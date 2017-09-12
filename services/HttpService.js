"use strict";

var util = require('util');
var path = require('path');
var express    = require('express');

class HttpService {

	constructor(logFactory, config, apiRoute) {
		this.log = logFactory.get('HttpService');
		this.config = config;
		
		this.apiRoute = apiRoute;
	}

	start() {

		this.app = express();

		// allows the app through proxies
		this.app.enable('trust proxy');

		// don't send the signature
		this.app.disable('x-powered-by');

		this.app.use('/v1/api', this.apiRoute.router);

		// error handler
		this.app.use((err, req, res, next) => { this._errorHandler(err,req,res,next); });

		this.log.info('Listening on port %d', this.config.httpPort);

		this.app.listen(this.config.httpPort);
	}

	_errorHandler(err, req, res, next) {

		this.log.error("*** Error caught: " + err.httpCode + " / " + err.message + " ***");

	  if(err.httpCode !== undefined) {
	  	switch(err.httpCode) {
	  		case 403: return res.status(403).json({httpCode: 403, error: 'UNAUTHORIZED'});
	  		case 400: return res.status(400).json({httpCode: 400, error: 'BAD_REQUEST', message: err.message});
	  		case 404: return res.status(404).json({httpCode: 404, error: 'NOT_FOUND', message: err.message});
	        case 503: return res.status(503).json({httpCode: 503, error: 'SERVICE_UNAVAILABLE', message: err.message});
	        case 500: return res.status(500).json({httpCode: 500, error: 'INTERNAL_SERVER_ERROR', message: err.message});

	      // basic auth
	      case 401: 
	  			this.log.debug("Authentication required (401): %s", err.message);
	  			return res.status(401).set('WWW-Authenticate', 'Basic realm=Authorization Required').end();
	  	}
	  }

	  this.log.error("### Unhandled error ###");
	  this.log.error(err.stack);
	  this.log.error("#######################");

	  res.status(500).json({httpCode: 500, error: 'INTERNAL_SERVER_ERROR', message: 'Internal Server Error'});
	}

}

module.exports = HttpService;