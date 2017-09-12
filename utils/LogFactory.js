"use strict";

var util = require('util');
var stream = require('stream');

var _levels = {
	debug : 0,
	info : 1,
	warning : 2,
	error : 3
};

class LogFactory {

	constructor() {

		// by default INFO
		this.minLevel = 1;

		// we start with a default stream to stdout by default
		this._streamList = [{stream:new DefaultStream(), minLevel:0}];
	}

	get(module) {

		return {
			_module: module,
			_parent: this,
			_output: function(levelStr, module, message) {

				var level = _levels[levelStr];

				if(level < this.minLevel)
					return;

				var logObj = {
					t: new Date().getTime(),
					l: levelStr.toUpperCase(),
					md: module,
					m: message
				}

				// we send to all registered streams
				for(let streamObj of this._parent._streamList)
					if(level >= streamObj.minLevel)
						streamObj.stream.write(logObj);

			},
			debug: function() { this._output("debug", this._module, util.format.apply(null, arguments)); },
			info: function() { this._output("info", this._module, util.format.apply(null, arguments)); },
			warning: function() { this._output("warning", this._module, util.format.apply(null, arguments)); },
			error: function() { this._output("error", this._module, util.format.apply(null, arguments)); }
			};
	}

	clearStreams() {
		this._streamList = [];
	}

	addStream(stream, minLevelStr) {

		var minLevel = _levels[minLevelStr];

    if(minLevel === undefined)
    	throw new Error("Unrecognized minLevel '%s'", minLevelStr);

    this._streamList.push({minLevel:minLevel, stream:stream});
  }

	setMinLevel(minLevel) {
		
		if(minLevel < 0) minLevel = 0;
		if(minLevel > 3) minLevel = 3;

		this.minLevel = minLevel;
	}

};

class DefaultStream extends stream.Writable {

	constructor() {
    
    super({
      highWaterMark: 16384,
      decodeStrings: false,
      objectMode : true
    });
    
  }

	_write(data, encoding, callback) {

		// we output straight to console
    process.stdout.write(this._format(data));
    
    callback(null);
	}

	_format(data) {
		if(data.md && data.md !== "")
			return new Date(data.t).toISOString() + ": " + data.l + ": " + data.md + ": " + data.m + "\n";
		else
			return new Date(data.t).toISOString() + ": " + data.l + ": " + data.m + "\n";
	}

}

module.exports = LogFactory;