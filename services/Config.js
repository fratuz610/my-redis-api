"use strict";

var fs = require('fs');

class Config {

  constructor(logFactory) {

    // we determine the environment
    this.currentFolder = __dirname + "/../";
    this.log = logFactory.get('config');

    this.env = this.determineEnv();
    
    this.log.info("Environment: '" + this.env + "'");

    try {
    	this.commonConfig = this.getCommonConfig();
	    this.envConfig = this.getEnvConfig(this.env);
    } catch (e) {
		  this.log.error("Unable to read config file(s): " + e);
		  throw e;
		}
    
    this.log.info("Successfully parsed common config file " + JSON.stringify(this.commonConfig).length + " bytes");
		this.log.info("Successfully parsed '"+this.env+"' config file " + JSON.stringify(this.envConfig).length + " bytes");

		this.envConfig.env = this.env;

		// we merge the 2 objects
		this.config = Object.assign(this.commonConfig, this.envConfig);
  }
  
  determineEnv() {

  	var env = "dev";
		try {
		  env = fs.readFileSync(this.currentFolder + ".env");
		} catch (e) {
		  env = process.env.ENV;
		  if(env === undefined) {
		    env = "dev";
		    this.log.error("Unable to determine the environment - .env file missing. Starting as '" + env + "'");
		  }
		}
		// we make sure we trim the env string
		return ("" + env).trim();
	}

	getCommonConfig() {
		var commonConfig = fs.readFileSync(this.currentFolder + "conf/config.all.json");
	  return JSON.parse(commonConfig);
	}

	getEnvConfig(env) {
		var envConfig = fs.readFileSync(this.currentFolder + "conf/config."+env+".json");
	  return JSON.parse(envConfig);
	}

	get conf() { return this.config; }

}

module.exports = Config;