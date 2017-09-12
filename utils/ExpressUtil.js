"use strict";

var util = require('util');

class ExpressUtil {

	httpError() {

		// we need to massage arguments into a V8 friendly array
		var args = new Array(arguments.length-1);

    for(var i = 1; i < arguments.length; i++)
        args[i-1] = arguments[i];
    
    var error = new Error(util.format.apply(null, args));
		error.httpCode = arguments[0];
		return error;
	};

	redirectWithMessage(res, uri) {

		// we need to massage arguments into a V8 friendly array
		var args = new Array(arguments.length-2);

    for(var i = 2; i < arguments.length; i++)
        args[i-2] = arguments[i];

  	return res.redirect(uri + "?message=" + encodeURIComponent(util.format.apply(null, args)));
	};

	redirectWithError(res, uri) {

		// we need to massage arguments into a V8 friendly array
		var args = new Array(arguments.length-2);

    for(var i = 2; i < arguments.length; i++)
        args[i-2] = arguments[i];
    
  	return res.redirect(uri + "?error=" + encodeURIComponent(util.format.apply(null, args)));
	};
}

module.exports = ExpressUtil;