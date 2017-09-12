"use strict";

class RedisKeys {

	constructor(config) {
		this.config = config;
		this.prefix = this.config.redis.prefix + ":" + this.config.env+ ":";
	}
	
	// Messages
	getMessagesKey() { return this.prefix + "messages"; } // ZSET of <createdTs> <-> <messageId>
	getMessagesBySourceKey(sourceId) { return this.prefix + "messages:sources:" + sourceId; } // ZSET of <createdTs> <-> <messageId>
	getMessagesByTypeKey(type) { return this.prefix + "messages:type:" + type; } // ZSET of <createdTs> <-> <messageId>

	getMessageKey(messageId) { return this.prefix + "messages:" + messageId; } // HASH
	getMessageAutoKey() { return this.prefix + "auto:messages"; } // COUNTER

}

module.exports = RedisKeys;