"use strict";

var util = require('util');
var IoRedis = require('ioredis');

class RedisClient {

	constructor(logFactory, config) {

		this.log = logFactory.get('RedisClient');
    this.config = config;

    // unhandled exceptions
		IoRedis.Promise.onPossiblyUnhandledRejection((err) => {
		  // you can log the error here.
		  this.log.error("Command %s with args %j: %s -> %s", err.command.name, err.command.args, err.name, err.message);
		});

		// we create the client
		this._redisClient = new IoRedis(this.config.redisPort, this.config.redisHost, { retryStrategy: (times) => 5000 } );

		this._redisClient.on('error', (err) => { this.log.error("Redis error: %s -> %s", err.name, err.message) });
		this._redisClient.on('ready', () => { 
			this.log.info("Redis connected");

			// redis basic configuration
			this._redisClient.config('set', 'maxmemory', 500 * 1014 * 1024); // 500 mb
			this._redisClient.config('set', 'maxmemory-policy', 'volatile-lru'); // allows for log rotation
		});
		this._redisClient.on('close', () => { this.log.warning("Redis connection closed") });
		this._redisClient.on('reconnecting', (ms) => { this.log.info("Redis reconnecting in %d", ms) });

	}

	get client() { return this._redisClient; }

}

module.exports = RedisClient;