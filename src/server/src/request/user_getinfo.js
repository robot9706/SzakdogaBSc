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

        db_users.getUserByID(userID)
        .then(function(result){
            var prefText = "";
            if (result.pref != null) {
                if (result.pref.driver && result.pref.passenger) {
                    prefText = "PASSENGER|DRIVER";
                } else if (result.pref.driver) {
                    prefText = "DRIVER";
                } else if (result.pref.passenger) {
                    prefText = "PASSENGER";
                } 
            }

            var response = {
                ok: true,
                username: result.username,
                name: result.name,
                email: result.email,
                pref: prefText
            };
    
            res.status(200).send(JSON.stringify(response));
        })
        .catch(function(ex){
            log.error(ex);

            var response = {
                ok: false,
                error: "TOKEN_EXPIRY"
            };
    
            res.status(200).send(JSON.stringify(response));
        });
    }
};