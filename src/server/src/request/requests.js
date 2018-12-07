//Requests
var gets = [
];

var posts = [
    { url: "/data/user_login", method: require("./user_login.js").handle },
    { url: "/data/user_register", method: require("./user_register.js").handle },
    { url: "/data/user_getinfo", method: require("./user_getinfo.js").handle },
    { url: "/data/user_setinfo", method: require("./user_setinfo.js").handle },
    { url: "/data/user_txdash", method: require("./user_txdash.js").handle },
    { url: "/data/user_moneymove", method: require("./user_moneymove.js").handle },
    { url: "/data/user_txhistory", method: require("./user_txhistory.js").handle },
    { url: "/data/route_price", method: require("./route_price.js").handle },
];

//Private
var installFunctions = function(array, installMethod) {
    for (var x = 0; x < array.length; x++) {
        var endpoint = array[x];
        installMethod(endpoint.url, endpoint.method);
    }
};

//Public
module.exports.install = function(server) {
    installFunctions(gets, server.get.bind(server));
    installFunctions(posts, server.post.bind(server));
};