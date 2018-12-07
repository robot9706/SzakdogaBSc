/**
Driver object:
_id
userID
available: true/false
lastLocation: { lat: ?, lng: ? }
*/

const log = require.main.require("./utils/logger.js");

var ObjectId = require('mongodb').ObjectId;

var data;

//Private
var getDriver = function(uid) {
    return new Promise(function(resolve, reject) {
        var query = { userID: new ObjectId(uid) };

        data.findOne(query)
        .then(function(user) {
            if (user == null) {
                //Driver doesn't exist
                var driver = {
                    userID: new ObjectId(uid),
                    available: false,
                    lastLocation: { //Geospatial Data
                        type: "Point",
                        coordinates: [
                            0, 0 //longitude, latitude
                        ]
                    }
                };
    
                data.insertOne(driver)
                .then(function(insert){
                    if (insert.insertedCount > 0) {
                        resolve({
                            _id: insert.insertedId,
                            ...driver
                        });
                    } else {
                        reject();
                    }
                })
                .catch(reject);
            } else {
                resolve(user);
            }
        })
        .catch(reject);
	});
}

//Public
module.exports.init = function(db) {
    data = db.collection("drivers");
    
    data.createIndex( { lastLocation: "2dsphere" } );
};

module.exports.setDriverState = function(userID, avail) {
	return new Promise(function(resolve, reject) {
        getDriver(userID)
        .then(function(driver){
            data.updateOne({
                _id: driver._id,
            },
            {
                $set: {
                    available: avail
                }
            })
            .then(function(update) {
                resolve(update.modifiedCount > 0);
            })
            .catch(reject);
        })
        .catch(reject);
	});
};

module.exports.setDriverLocation = function(userID, lat, lng) {
	return new Promise(function(resolve, reject) {
        getDriver(userID)
        .then(function(driver){
            data.updateOne({
                _id: driver._id,
            },
            {
                $set: {
                    lastLocation: {
                        type: "Point",
                        coordinates: [
                            lng, lat //longitude, latitude
                        ]
                    }
                }
            })
            .then(function(update) {
                resolve(update.modifiedCount > 0);
            })
            .catch(reject);
        })
        .catch(reject);
	});
};

module.exports.findNearby = function(lat, lng) {
    lat = parseFloat(lat);
    lng = parseFloat(lng);
    return new Promise(function(resolve, reject) {
        var query = [
            {
                $geoNear: {
                    near: {type: "Point", coordinates: [ lng, lat ] },
                    distanceField: "dist.calculated",
                    maxDistance: 500,
                    spherical: true
                }
            },
            {
                $match: {
                    available: true
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "userID",
                    foreignField: "_id",
                    as: "user"
                }
            }
        ];
        
        data.aggregate(query).toArray(function(err, result) {
			if (err) {
				log.error(err);
				
				reject();
			} else {
				resolve(result);
			}
		});
    });
};