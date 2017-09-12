"use strict";

class RedisHelper {

	constructor(redisClient) {
		this.redisClient = redisClient;
	}

	getHash() {
		if(arguments.length === 3)
			return this._getHashFieldList(arguments[0], arguments[1], arguments[2]);
		else if(arguments.length === 2)
			return this._getHashAll(arguments[0], arguments[1]);
		else
			throw new Error("Unrecognized argument number: " + arguments.length);
	}
	
	_getHashAll(redisKey, cb) {

		this.redisClient.hgetall(redisKey, (err, ret) => {
			
			if(err)
				return cb(err);

			// if empty object
			if(Object.keys(ret).length === 0)
    		return cb(null, null);

			return cb(null, this._parse(ret));
		});
	}

	_getHashFieldList(redisKey, fieldNameList, cb) {

		var pipeline = this.redisClient.pipeline();

		for(let fieldName of fieldNameList)
			pipeline.hget(redisKey, fieldName);
		
		pipeline.exec((err, results) => {

			// if any error happened let's return it
			for(let result of results)
				if(result[0])
					return cb(result[0]);

			var found = false;
			var ret = {};

			for(let i = 0; i < results.length; i++) {

				let value = results[i][1];
				let key = fieldNameList[i];

				if(value !== undefined && value !== null)
					found = true;

				ret[key] = value;
			}

			// if we haven't found any field
			if(!found)
    	 return cb(null, null);

			return cb(null, this._parse(ret));
		});
	
	}

	getHashList(redisKeyList, cb) {

		var pipeline = this.redisClient.pipeline();

		for(let redisKey of redisKeyList)
			pipeline.hgetall(redisKey);

		pipeline.exec((err, results) => {

			// if any error happened let's return it
			for(let result of results)
				if(result[0])
					return cb(result[0]);

			var retList = [];
			
			for(let i = 0; i < results.length; i++) {

				let value = results[i][1];

				// if empty object
				if(Object.keys(value).length === 0)
	    		continue;

	    		retList.push(this._parse(value));
			}

			return cb(null, retList);
		});


	}

	_parse(src) {

		var ret = {}
			
		for(let key in src) {

			if(!src.hasOwnProperty(key))
				continue;

			let value = src[key];

			if(this._canBeJson(value)) {

				try { 
					ret[key] = JSON.parse(value);
				} catch(err) {
					// nothing to do
				}
			} else if(this._isInteger(value)) {
				ret[key] = parseInt(value);
			} else if(this._isFloat(value)) {
				ret[key] = parseFloat(value);
			} else if(this._isBool(value)) {
				ret[key] = (value.toLowerCase() === 'true');
			} else
				ret[key] = value;

		}
		return ret;
	}

	_canBeJson(src) {

		if(!src)
			return false;

		if(src.startsWith("{") && src.endsWith("}"))
			return true;

		if(src.startsWith("[") && src.endsWith("]"))
			return true;

		return false;
	}

	_isInteger(src) {

		if(src === null || src === undefined)
			return false;

		// we don't match numbers starting with 0 (which could be hex strings)
		return /^[-+]?[1-9]\d*$/.test(src);
	}

	_isFloat(src) {

		if(src === null || src === undefined)
			return false;

		return /^[-+]?[0-9]+\.[0-9]+?$/.test(src);
	}

	_isBool(src) {
		if(src === null || src === undefined)
			return false;

		return /^(true|false)$/i.test(src);
	}

}

module.exports = RedisHelper;