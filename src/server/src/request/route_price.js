const feeHelper = require.main.require("./utils/feehelper.js");
const sessions = require.main.require("./sessions.js");
const log = require.main.require("./utils/logger.js");
const db_tx = require.main.require("./database/transactions.js");

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
        var from = req.body.from;
        var to = req.body.to;

        feeHelper.calculateFee(from, to)
        .then(function(result) {
            var intFee = parseInt(result.fee);
            session.data.calculatedRoutePrice = intFee;

            db_tx.sumForUser(session.userID)
            .then(function(allMoney){
                var response = {
                    ok: true,
                    fee: intFee,
                    possible: (allMoney >= intFee)
                };
                res.status(200).send(JSON.stringify(response));
            })
            .catch(function(err) {
                log.error("Failed to calculate fee: " + err);

                res.status(200).send(JSON.stringify({
                    ok: false
                }));
            });
        })
        .catch(function(err) {
            log.error("Failed to calculate fee: " + err.error);

            res.status(200).send(JSON.stringify({
                ok: false
            }));
        });
    }
};