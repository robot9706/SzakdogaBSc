/**
User object:
_id
username
password (sha256 hash)
email
name
*/

const sha256 = require('js-sha256').sha256;
const log = require.main.require("./utils/logger.js");

var ObjectId = require('mongodb').ObjectId;

var data;

//Private
var doQuery = function(query) {
	return new Promise(function(resolve, reject) {
		data.find(query).toArray(function(err, result) {
			if (err) {
				log.error(err);
				
				reject();
			} else {
				resolve(result);
			}
		});
	});
};

var nameExists = function(name) {
	return new Promise(function(resolve, reject) {
		var query = { username: name };
	
		doQuery(query).then(function(result) {
			resolve(result != null && result.length == 1 && result[0].username == name);
		}).catch(reject);
	});
};

var catchFunction = function(err) {
	log.error(err);
};

var createAdminUser = function() {
	module.exports.createUser("admin", "admin", null, "ADMIN").then(function(id) {
		console.log("Admin user created, id: " + id);
	})
	.catch(catchFunction);
};

//Public
module.exports.init = function(db) {
	data = db.collection("users");
	
	//Check the admin user
	nameExists("admin").then(function(result) {
		if(!result) {
			log.info("No admin user found, creating.");
			
			createAdminUser();
		}
	})
	.catch(catchFunction);
};

module.exports.getUserByUsername = function(name) {
	return new Promise(function(resolve, reject) {
		var query = {
			username: name
		};
		
		doQuery(query).then(function(result) {
			if (result != null && result.length == 1 && result[0].username == name) {
				resolve(result[0]);
			} else {
				resolve(null);
			}
		}).catch(function(ex){
			reject(ex);
		});
	});
};

module.exports.getUserByID = function(id) {
	return new Promise(function(resolve, reject) {
		var query = {
			_id: new ObjectId(id)
		};
		
		doQuery(query).then(function(result) {
			if (result != null && result.length == 1) {
				resolve(result[0]);
			} else {
				resolve(null);
			}
		}).catch(function(ex){
			reject(ex);
		});
	});
};

module.exports.checkUser = function(name, rawPass) {
	return new Promise(function(resolve, reject) {
		var query = {
			username: name,
			password: sha256(rawPass),
		};
		
		doQuery(query).then(function(result) {
			if (result != null && result.length == 1 && result[0].username == name) {
				resolve(result[0]);
			} else {
				resolve(null);
			}
		}).catch(function(ex){
			reject(ex);
		});
	});
};

module.exports.createUser = function(username, rawPass, email, name) {
	return new Promise(function(resolve, reject) {
		var newUser = {
			username: username,
			password: sha256(rawPass),
			email: email,
			name: name,
			pref: null
		};
		
		data.insertOne(newUser, function (err, result) {
			if (err) {
				reject(err);
			} else {
				resolve(result.insertedId);
			}
		});
	});
};

module.exports.updateUserInfo = function(userID, newData) {
	return new Promise(function(resolve, reject) {
		var query = {
			_id: new ObjectId(userID)
		};

		var update = { };

		if (newData["email"] != null){
			update = {
				...update,
				email: newData["email"]
			};
		}
		if (newData["name"] != null){
			update = {
				...update,
				name: newData["name"]
			};
		}
		if (newData["password"] != null){
			update = {
				...update,
				password: sha256(newData["password"])
			};
		}
		if (newData["pref"] != null){
			var prefValue = newData["pref"];
			prefValue = prefValue.split("|");

			update = {
				...update,
				pref: {
					passenger: prefValue.includes("PASSENGER"),
					driver: prefValue.includes("DRIVER"),
				}
			};
		}

		var set = {
			$set: {
				...update
			}
		};
		
		data.updateOne(query, set, function (err, result) {
			if (err) {
				reject(err);
			} else {
				resolve(result.modifiedCount > 0);
			}
		});
	});
};