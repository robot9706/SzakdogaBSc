var fs = require("fs")

var _config;

module.exports.load = function () {
	var configFile = process.cwd() + "/server_config.json";
	
	if (!fs.existsSync(configFile)) {
		console.log("Server config file doesn't exist!");
		
		return false;
	}
	
	var jsonData = fs.readFileSync(configFile, "utf8");
	
	_config = JSON.parse(jsonData);
	
	return true;
};

module.exports.getLogFolder = function() {
	return _config.paths.log;
};

module.exports.getDatabaseConfig = function() {
	return _config.database;
};

module.exports.getEndpoint = function() {
	return _config.endpoint;
};

module.exports.getRoutesConfig = function() {
	return _config.route;
};

module.exports.getGMapsApiKey = function() {
	return _config.gmaps_api;
};