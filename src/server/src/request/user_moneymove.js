const log = require.main.require("./utils/logger.js");
const db_users = require.main.require("./database/users.js");
const db_tx = require.main.require("./database/transactions.js");
const sessions = require.main.require("./sessions.js");

var catchFunction = function(res) {
    var response = {
        ok: false,
        message: "SERVER_ERROR"
    };

    res.status(200).send(JSON.stringify(response));
};

module.exports.handle = function(req, res) {
    var token = req.body.token;

    var session = sessions.getToken(token);

    if (session == null) {
        var response = {
            ok: false,
            error: "TOKEN_EXPIRY"
        };

        res.status(200).send(JSON.stringify(response));
    } else {
        var userID = session.userID;
        var amount = parseInt(req.body.amount);
        var moneyIn = req.body.in;
        var method = req.body.method;

        if (!moneyIn) {
            db_tx.sumForUser(userID)
            .then(function(allMoney){
                if (allMoney < Math.abs(amount)) {
                    var response = {
                        ok: false,
                        error: "NO_FUNDS"
                    };
            
                    res.status(200).send(JSON.stringify(response));
                } else {
                    db_tx.createExternal(userID, amount, moneyIn, method)
                    .then(function(result){
                        var response = {
                            ok: true,
                            event: [
                                {
                                    type: "USER_BALANCE",
                                    balance: result
                                }
                            ]
                        };
                
                        res.status(200).send(JSON.stringify(response));
                    })
                    .catch(catchFunction);
                }
            })
            .catch(catchFunction);
        } else {
            db_tx.createExternal(userID, amount, moneyIn, method)
            .then(function(result){
                var response = {
                    ok: true,
                    event: [
                        {
                            type: "USER_BALANCE",
                            balance: result
                        }
                    ]
                };
        
                res.status(200).send(JSON.stringify(response));
            })
            .catch(catchFunction);
        }
    }
};