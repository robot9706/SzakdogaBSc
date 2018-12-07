const googleMapsClient = require('@google/maps');

var config = require.main.require("./utils/config.js");

var gmap;

module.exports.init = function() {
    gmap = googleMapsClient.createClient({
        key: config.getGMapsApiKey()
    });
};

module.exports.makeRoute = function(from, to) {
    return new Promise(function(resolve, reject) {
        gmap.directions({
            origin: { lat: from.lat, lng: from.lng },
            destination: { lat: to.lat, lng: to.lng },
            mode: "driving",
            units: "metric"
        }, function(err, response) {
            if (err) {
                reject(err);
            } else {
                resolve(response.json);
            }
        });
    });
};