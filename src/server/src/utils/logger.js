const winston = require("winston");
const fs = require("fs");
const config = require("./config.js");
const os = require('os');

var _logger;

module.exports.init = function() {
	var logFolder = process.cwd() + "/" + config.getLogFolder() + "/";

	console.log("Log folder is: \"" + logFolder + "\"");

	//Make sure the log folder exists
	if (!fs.existsSync(logFolder)) {
		fs.mkdirSync(logFolder); //Create the folder if it doesn't exist
	}
	
	_logger = winston.createLogger({
	  level: "info",
	  format: winston.format.simple(),
	  transports: [
		new winston.transports.Console(), //Log everything to the console
		new winston.transports.File({ filename: logFolder + "server.log", eol: os.eol}), //Log everything to a file also
		new winston.transports.File({ filename: logFolder + "fatal.log", eol: os.eol, level: "error" }) //Log only errors to a fatal log
	  ]
	});
};

module.exports.info = function(what) {
	_logger.info(what);
};

module.exports.error = function(what) {
	_logger.error("Error \"" + what + "\" at " + what.stack);
};