const crypto = require("crypto");

const MAX_SESSION_TIME = 1000 * 60 * 30; //30 mins

var sessions = [ ];

const createTokenForUser = function(userID) {
    var tokenID = null;
    var iteration = 0;
    do {
        var buffer = crypto.randomBytes(48);
        tokenID = buffer.toString("base64");

        tokenID = tokenID.replace("/", "").replace("+", "");

        iteration++;
    } while (iteration < 10 && sessions.includes(tokenID));

    if (iteration >= 10) {
        return null;
    }

    var session = {
        userID: userID,
        token: tokenID,
        lastSeen: new Date(),
        data: { }
    };

    sessions[tokenID] = session;

    return tokenID;
};

module.exports.createToken = function(userID) {
    return createTokenForUser(userID);
};

module.exports.getToken = function(tokenID) {
    if (sessions[tokenID] != null) {
        var session = sessions[tokenID];
        if ((new Date().getTime() - session.lastSeen.getTime()) >= MAX_SESSION_TIME){
            sessions[tokenID] = null;

            return null;
        }

        session.lastSeen = new Date();

        return sessions[tokenID];
    }

    return null;
};

module.exports.validateToken = function(session) {
    var tokenID = session.token;
    if ((new Date().getTime() - session.lastSeen.getTime()) >= MAX_SESSION_TIME){
        sessions[tokenID] = null;

        return false;
    }

    return true;
}