const log = require.main.require("./utils/logger.js");
const db_users = require.main.require("./database/users.js");
const sessions = require.main.require("./sessions.js");

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

        db_users.updateUserInfo(userID, req.body)
        .then(function(result){
            var response = {
                ok: result,
                message: "DATA_CHANGED"
            };
    
            res.status(200).send(JSON.stringify(response));
        })
        .catch(function(err){
            var response = {
                ok: false,
                message: "SERVER_ERROR"
            };

            res.status(200).send(JSON.stringify(response));
        });
    }
};