/**
TX object:
_id
userID
date
diff
balance
info: { type: USER_TX, otherUserID: ... } / { type: EXTERNAL_IN, source: PayPal/Wire/... } / { type: EXTERNAL_OUT, source: PayPal/Wire/... }
*/

const log = require.main.require("./utils/logger.js");

var ObjectId = require('mongodb').ObjectId;

var data;

//Private


//Public
module.exports.init = function(db) {
	data = db.collection("tx");
};

module.exports.sumForUser = function(userID) {
    return new Promise(function(resolve, reject) {
        var query = {
            userID: new ObjectId(userID)
        };

        var sort = {
            date: -1
        };

		data.find(query).sort(sort).limit(1).toArray(function(err, result) {
			if (err) {
				log.error(err);
				
				reject();
			} else {
                if (result != null && result.length == 1){
                    resolve(result[0].balance);
                } else {
                    resolve(0);
                }
			}
		});
	});
};

module.exports.transactionCount = function(userID) {
    return new Promise(function(resolve, reject) {
        var query = {
            userID: new ObjectId(userID)
        };

        var sort = {
            date: -1
        };

        var cursor = data.find(query);

        cursor.count()
        .then(function(docs){
            resolve(docs);
        })
        .catch(function(err){
            reject(err);
        });
	});
};

module.exports.getTransactions = function(userID, start, count) {
    return new Promise(function(resolve, reject) {
        var aggregate = [
            {
                $match: {
                    userID: new ObjectId(userID)
                }
            },
            {
                $sort: {
                    date: -1
                }
            },
            {
                $skip: start
            },
            {
                $limit: count
            },
            {
                $lookup: {
                    from: "users",
                    localField: "info.otherUserID",
                    foreignField: "_id",
                    as: "info.otherUser"
                }
            }
        ];
        
        data.aggregate(aggregate).toArray(function(err, result) {
			if (err) {
				log.error(err);
				
				reject();
			} else {
                if (result != null){
                    resolve(result);
                } else {
                    resolve(0);
                }
			}
		});
	});
};

module.exports.createExternal = function(userID, amount, moneyIn, method) {
    return new Promise(function(resolve, reject) {
        module.exports.sumForUser(userID)
        .then(function (balance) {
            if (moneyIn) {
                amount = Math.abs(amount);
            } else {
                amount = -Math.abs(amount);
            }
    
            var newTx = {
                userID: new ObjectId(userID),
                date: new Date().getTime(),
                diff: amount,
                balance: balance + amount,
                info: {
                    type: (moneyIn ? "EXTERNAL_IN" : "EXTERNAL_OUT"),
                    source: method
                }
            };
            
            data.insertOne(newTx, function (err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(newTx.balance);
                }
            });
        })
        .catch(reject);
	});
};

module.exports.createInternal = function(fromUser, toUser, amount) {
    amount = Math.abs(amount);

    var date = new Date().getTime();

    return new Promise(function(resolve, reject) {
        module.exports.sumForUser(fromUser)
        .then(function (balance) {
            var newTx = {
                userID: new ObjectId(fromUser),
                date: date,
                diff: -amount,
                balance: balance - amount,
                info: {
                    type: "USER_TX",
                    otherUserID: new ObjectId(toUser)
                }
            };
            
            data.insertOne(newTx, function (err, result) {
                if (err) {
                    reject(err);
                } else {

                    module.exports.sumForUser(toUser)
                    .then(function (balance) {
                        var newTx = {
                            userID: new ObjectId(toUser),
                            date: date,
                            diff: amount,
                            balance: balance + amount,
                            info: {
                                type: "USER_TX",
                                otherUserID: new ObjectId(fromUser)
                            }
                        };
                        
                        data.insertOne(newTx, function (err, result) {
                            if (err) {
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    })
                    .catch(reject);
                }
            });
        })
        .catch(reject);
	});
};