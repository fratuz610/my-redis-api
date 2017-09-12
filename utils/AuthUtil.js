"use strict";

var util = require('util');
var crypto = require('crypto');

class AuthUtil {

	parseBasicAuth(authHeader) {

		var authList = authHeader.split(" ");

	  if(authList.length != 2)
	  	return {error: "malformed authHeader: '" + authHeader + "'"};

	  if(authList[0].toLowerCase() !== "basic")
	  	return {error: "authheader doesn't start with 'basic'"};
	  
	  var decodedToken = null;
	  try {
	    decodedToken = new Buffer(authList[1], 'base64').toString('ascii');
	  } catch(error) {
	  	return {error: "authheader malformed payload: " + error.message};
	  }

	  var tokenList = decodedToken.split(":");

	  if(tokenList.length != 2)
	  	return {error: "authheader malformed payload: " + tokenList};

	  return {
	  	username:tokenList[0], 
	  	password:tokenList[1]
	  }
	  
	};

	parseKioskAuthHeader(authHeader) {

		var ret = this.parseBasicAuth(authHeader);

		if(ret.error)
			return ret;

		var unitId = ret.username;
		var token = ret.password;

		for(var i = -10; i <= 10; i++)
	    if(this._genSignature(unitId, i) === token)
	        return {unitId: unitId}

	  return {error: "no hash match for token: " + token + " and unitId: " + unitId};

	};

	_genSignature(unitId, dayBias) {
    var shasum = crypto.createHash('sha1');
    var now = parseInt(new Date().getTime()/1000);
    var dayTS = now - now % 86400 + dayBias*86400;
    shasum.update("lq:" + unitId + ":" + dayTS);
    return shasum.digest('base64');
  };

	genKioskAuthHeader(unitId) {

		var signature = this._genSignature(unitId, 0);

		var basicHeader = util.format("%d:%s", unitId, signature);

		return util.format("basic %s", new Buffer(basicHeader).toString('base64'));
	}
}

module.exports = AuthUtil;