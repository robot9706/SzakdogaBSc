var mongo = require("mongodb").MongoClient;
var config = require.main.require("./utils/config.js");
var log = require.main.require("./utils/logger.js");

//Collections
var users = require("./users.js");
var transactions = require("./transactions.js");
var drivers = require("./drivers.js");

//Database
var connection;
var database;

module.exports.connect = function () {
	return new Promise(function(resolve, reject) {
		var url = config.getDatabaseConfig().path;
		
		log.info("Connecting to database: " + url);
	
		mongo.connect(url, { useNewUrlParser: true }, function(err, conn) {
			if (err) {
				reject(err);
			} else {
				//Store the connection
				connection = conn;
			
				//Get the database object
				var dbName = config.getDatabaseConfig().name;
				database = connection.db(dbName);
			
				log.info("Connected to the database!");
			
				users.init(database);
				transactions.init(database);
				drivers.init(database);
				
				resolve();
			}
		});
	});
};

exports.close = function() {
	if (connection != undefined) {
		connection.close();
		connection = undefined;
	
		log.info("Database connection closed.");
	}
}