"use strict";

var validate = require("validate.js");

class Validator {

	constructor() {
		
	}

	validateNewMessageReq(query) {

		let opt = {
			type: { 
				presence: { message: "^No type specified" },
				length: { minimum: 3, tooShort: "Min sourceId length: 3 chars"}
			},
			sourceId: { 
				presence: { message: "^No sourceId specified" },
				length: { minimum: 3, tooShort: "Min sourceId length: 3 chars"}
			},
			payload: {
				presence: { message: "^No payload specified" },
			}
		}

		return validate(query, opt, {format: "flat"});
	}

}

module.exports = Validator;