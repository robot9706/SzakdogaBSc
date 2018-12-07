const log = require.main.require("./utils/logger.js");
const db_users = require.main.require("./database/users.js");

function doRegisterUser(req, res) {
    db_users.createUser(req.body.username, req.body.password, req.body.email, req.body.name)
    .then(function(result){
        if (result) {
            res.status(200).send(JSON.stringify({
                ok: true,
                message: null
            }));
        } else {
            res.status(200).send(JSON.stringify({
                ok: false,
                message: "SERVER_ERROR"
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
}

module.exports.handle = function(req, res) {
    db_users.getUserByUsername(req.body.username)
    .then(function(result){
        if (result) {
            res.status(200).send(JSON.stringify({
                ok: false,
                message: "USER_EXISTS"
            }));
        } else {
            doRegisterUser(req, res);
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