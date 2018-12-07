const PAGE_SIZE = require("./user_txdash").PAGE_SIZE;

const log = require.main.require("./utils/logger.js");
const db_users = require.main.require("./database/users.js");
const db_tx = require.main.require("./database/transactions.js");
const sessions = require.main.require("./sessions.js");

var catchFunction = function(ex, res) {
    log.error(ex);

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
        var pageNumber = req.body.page;

        db_tx.transactionCount(userID)
        .then(function(count){
            db_tx.getTransactions(userID, pageNumber * PAGE_SIZE, PAGE_SIZE)
            .then(function(array) {
                var response = {
                    ok: true,
                    tx_pages: parseInt(Math.ceil(count / PAGE_SIZE)),
                    page: array
                };
        
                res.status(200).send(JSON.stringify(response));
            })
            .catch((ex) => catchFunction(ex, res));
        })
        .catch((ex) => catchFunction(ex, res));
    }
};