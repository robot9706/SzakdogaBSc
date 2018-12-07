const log = require.main.require("./utils/logger.js");
const db_users = require.main.require("./database/users.js");
const db_tx = require.main.require("./database/transactions.js");
const sessions = require.main.require("./sessions.js");

module.exports.handle = function(req, res) {
    db_users.checkUser(req.body.username, req.body.password)
    .then(function(result){
        if (result) {
            var token = sessions.createToken(result._id);

            db_tx.sumForUser(result._id)
            .then(function(money){
                res.status(200).send(JSON.stringify({
                    ok: true,
                    token: token,
                    name: result.name,
                    balance: money
                }));
            })
            .catch(function(err){
                log.error(err);

                res.status(200).send(JSON.stringify({
                    ok: false,
                    message: "SERVER_ERROR"
                }));
            });
        } else {
            res.status(200).send(JSON.stringify({
                ok: false,
                message: "INVALID_LOGIN"
            }));
        }
    })
    .catch(function(err){
        log.error(err);

        res.status(200).send(JSON.stringify({
            ok: false,
            message: "SERVER_ERROR"
        }));
    });
};