"use strict";

var async = require('async');

class MessageModel {

	constructor(logFactory, config, redisClient, redisKeys, redisHelper) {

		this.log = logFactory.get('MessageModel');
		this.config = config;
		this.redisClient = redisClient;
		this.redisKeys = redisKeys;
		this.redisHelper = redisHelper;
	}

	queryMessages(query, cb) {

		/* query
		- limit
		- skip
		- sourceId
		- type
		*/

		if(!query) query = {};

		if(query.limit === undefined) query.limit = 0;
		if(query.skip === undefined) query.skip = 0;

		query.limit = Math.min(300, Math.max(5, query.limit)); // between 5 and 300 messages only
		query.skip = Math.max(0, query.skip); // Skip >= 0
		
		// we get the latest <limit> events from the index
		let redisKey = this.redisKeys.getMessagesKey();

		if(query.sourceId)
			redisKey = this.redisKeys.getMessagesBySourceKey(query.sourceId);
		else if(query.type)
			redisKey = this.redisKeys.getMessagesByTypeKey(query.type);

		this.redisClient.zrevrange(redisKey, query.skip, query.skip + query.limit -1, (err, messageIdList) => {

			if(err)
				return cb(err);

			if(messageIdList.length === 0)
				return cb(null, []);

			var redisKeyList = [];
			for(let messageId of messageIdList)
				redisKeyList.push(this.redisKeys.getMessageKey(messageId));

			return this.redisHelper.getHashList(redisKeyList, cb);

		});

	}

	logMessage(messageObj, cb) {

		var ts = new Date().getTime();

		// first we increment our autoincrement key
		this.redisClient.incr(this.redisKeys.getMessageAutoKey(), (err, newMessageId) => {
			
			if(err)
				return cb(err);

			var pipeline = this.redisClient.pipeline();

			// messageId
			pipeline.hset(this.redisKeys.getMessageKey(newMessageId), "messageId", newMessageId);

			// timestamp
			pipeline.hset(this.redisKeys.getMessageKey(newMessageId), "ts", ts);

			// sourceId
			pipeline.hset(this.redisKeys.getMessageKey(newMessageId), "sourceId", messageObj.sourceId);

			// type
			pipeline.hset(this.redisKeys.getMessageKey(newMessageId), "type", messageObj.type);
			
			// payload
			pipeline.hset(this.redisKeys.getMessageKey(newMessageId), "payload", JSON.stringify(messageObj.payload));

			// we add to the main index (all messages)
			pipeline.zadd(this.redisKeys.getMessagesKey(), ts, newMessageId);

			// messages by sourceId
			pipeline.zadd(this.redisKeys.getMessagesBySourceKey(messageObj.sourceId), ts, newMessageId);

			// messages by type
			pipeline.zadd(this.redisKeys.getMessagesByTypeKey(messageObj.type), ts, newMessageId);

			// we get the cardinality of the main index 
			pipeline.zcard(this.redisKeys.getMessagesKey());

			pipeline.exec((err, replies) => {
			  
			  for(let reply of replies)
        		if(reply[0])
        			if(cb)
            			return cb(reply[0]);
					else
						return this.log.warning("Error: %s", reply[0]);
					
				// we get the current cardinality of our main index
				let curCard = parseInt(replies[replies.length-1][1]);

				if(curCard > this.config.limits.maxMessages)
					this._cleanup(curCard);
				
				if(cb)
					return cb(null);
			});
		});

	}

	deleteMessage(messageId, cb) {

		// we get the whole message
		this.redisHelper.getHash(this.redisKeys.getMessageKey(messageId), (err, messageObj) => {

			if(err)
				return cb(err);

			if(messageObj === null)
				return cb(null);

			var pipeline = this.redisClient.pipeline();

			// we delete the hash
			pipeline.del(this.redisKeys.getMessageKey(messageId));

			// we delete from the main index
			pipeline.zrem(this.redisKeys.getMessagesKey(), messageId);

			// we delete from other indexes
			if(messageObj.sourceId)
				pipeline.zrem(this.redisKeys.getMessagesBySourceKey(messageObj.sourceId), messageId);

			if(messageObj.type)
				pipeline.zrem(this.redisKeys.getMessagesByTypeKey(messageObj.type), messageId);

			pipeline.exec((err, replies) => {
			  
			  	for(let reply of replies)
					if(reply[0])
						return cb(reply[0]);
        
        	  	return cb(null);
			});
		})

		
	}

	// remove old messages (older than 10k)
	_cleanup(curCard) {

		// we delete curCard - this.config.limits.maxMessages -1 oldest messages 

		this.redisClient.zrange(this.redisKeys.getMessagesKey(), 0, curCard - this.config.limits.maxMessages -1, (err, messageIdList) => {
			
			if(err)
				return this.log.warning("Unable to cleanup: db error: %s", err);

			if(messageIdList.length === 0)
				return;

			async.each(messageIdList, 
				(messageId, asyncCb) => { this.deleteMessage(messageId, asyncCb)},
				(err) => {

					if(err)
						return this.log.warning("Unable to cleaup: db error: %s", err);
				})

		});
	}

}

module.exports = MessageModel;
