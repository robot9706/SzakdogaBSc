//Load the config
console.log("Loading config");

var config = require("./utils/config.js");
if (!config.load()) {
	process.exit();
	
	return;
}

//Automated test users
const testDriver = require("./test/testdriver.js");
const initTest = {
	webServer: false,
	database: false,
	loaded: false,
	init: function(){
		if (!this.webServer || !this.database) {
			return;
		}

		if (this.loaded) {
			return;
		}

		this.loaded = true;

		testDriver.init();
	}
};
initTest.init = initTest.init.bind(initTest);

//Create the logger
var log = require("./utils/logger.js");
log.init();

log.info("");
log.info("");
log.info("Server start: " + new Date());

//Connect to the database
var db = require("./database/database.js");
const connectToDb = function() {
	db.connect()
	.then(function(){
		initTest.database = true;
		initTest.init();
	})
	.catch(function(err) {
		log.error("Failed to connect to db, retry in 10s...");

		setTimeout(connectToDb, 10000);
	});
};
connectToDb();

//Create the GMap api
var gmap = require("./utils/gmaps.js");
gmap.init();

//Create a JSON server (express)
log.info("Creating the JSON server");

const express = require('express');
const path = require('path');

const jsonServer = require("json-server")
const server = jsonServer.create()
const expressWs = require('express-ws')(server);

//Init the static frontend from the src/client folder (react build)
server.use(express.static(path.join(__dirname, 'client')));

//Init the WebSocket server
const socketServer = require("./ws/socketserver");
socketServer.init(server);

//Install default middlewares
const middlewares = jsonServer.defaults()
server.use(middlewares)

//Install the json body parser
const bodyParser = require("body-parser");
server.use(bodyParser.json()); //Parse JSON bodies
server.use(bodyParser.urlencoded({ //Parse URL encoded bodies
  extended: true
})); 

//Install client requests
const requests = require("./request/requests.js");
requests.install(server);

//Add the frontend response to the server, server all unserved requests with the index.html
server .get('/*', function(req, res) {
	res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

//Start the server
log.info("Starting server");
var endpoint = config.getEndpoint();
server.listen(endpoint.port, endpoint.ip, () => {
	log.info("Backend server started on " + endpoint.ip + ":" + endpoint.port);

	initTest.webServer = true;
	initTest.init();
});


//Handle the server shutdown
process.stdin.resume();

function onExit(options, exitCode) {
	db.close();
	
    if (options.exit) process.exit();
}

process.on('exit', onExit.bind(null,{cleanup:true}));
process.on('SIGINT', onExit.bind(null, {exit:true}));
process.on('SIGUSR1', onExit.bind(null, {exit:true}));
process.on('SIGUSR2', onExit.bind(null, {exit:true}));