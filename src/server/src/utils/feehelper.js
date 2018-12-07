var gmaps = require.main.require("./utils/gmaps.js");
var config = require.main.require("./utils/config.js");

const calculateDistAndTime = (route) => {
    let dist = 0;
    let time = 0;

    for (let i = 0; i < route.legs.length; i++) {
        dist += route.legs[i].distance.value;
        time += route.legs[i].duration.value;
    }

    return {
        distance: dist,
        time: time
    };
};


module.exports.calculateFee = function(from, to) {
    return new Promise(function(resolve, reject){
        gmaps.makeRoute(from, to)
        .then(function(route) {
            if (route.status != "OK") {
                reject({ok:false, error: "Status: " + route.status});
                return;
            }

            if (route.routes.length == 0) {
                reject({ok:false, error: "No route!"});
                return;
            }

            var dt = calculateDistAndTime(route.routes[0]);
            var routeCfg = config.getRoutesConfig();

            var result = {
                ok: true,
                fee: (dt.distance / 1000) * routeCfg.price_per_km
            };

            resolve(result);
        })
        .catch(function (err) {
            reject({ok:false, error: err});
        })
    });
};