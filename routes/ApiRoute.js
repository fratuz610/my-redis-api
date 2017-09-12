"use strict";

var express = require('express');
var async = require('async');
var util = require('util');
var bodyParser = require('body-parser';)

var router = express.Router();

class ApiRoute {

	constructor(logFactory, config, expressUtil, messageModel, adminAuth, validator) {

		this.log = logFactory.get('ApiRoute');
		this.config = config;
		this.expressUtil = expressUtil;
		this.messageModel = messageModel;
		this.adminAuth = adminAuth;
		this.validator = validator;

		this._router = express.Router();

		// Authentication (basic)
		this._router.use('/', (req,res,next) => { this.adminAuth.middleware(req,res,next); });

		// we support application/x-www-form-urlencoded encodings
		this._router.use('/', bodyParser.json({ type: "*/*" }));

		this._router.get('/messages', (req, res, next) => { this._getMessageList(req,res,next); });

		this._router.post('/messages', (req, res, next) => { this._postMessage(req,res,next); });
	}

	_getMessageList(req, res, next) {

		var query = {
			skip: (req.query.skip && !isNaN(parseInt(req.query.skip))) ? parseInt(req.query.skip) : 0,
			sourceId: req.query.sourceId ? req.query.sourceId : null,
			type: req.query.type ? req.query.type : null,
			limit: (req.query.limit && !isNaN(parseInt(req.query.limit))) ? parseInt(req.query.limit) : 100
		}

		this.messageModel.queryMessages(query, (err, messageList) => {

			if(err)
				return next(this.expressUtil.httpError(500, "DB error: %s", err));

			return res.json(messageList);

		});

	}

	_postMessage(req, res, next) {
		
		let validationRes = this.validator.validateNewMessageReq(req.body);

		if(validationRes)
			return next(this.expressUtil.httpError(400, "Bad request: ", validationRes));

		this.messageModel.queryMessages(query, (err, messageList) => {

			if(err)
				return next(this.expressUtil.httpError(500, "DB error: %s", err));

			return res.json(messageList);

		});
	}
	
	get router() {
		return this._router;
	}

}

module.exports = ApiRoute;