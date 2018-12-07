const log = require.main.require("./utils/logger.js");
const dbUser = require.main.require("./database/users.js");
const sessions = require.main.require("./sessions.js");
const config = require.main.require("./utils/config.js");
const WebSocket = require('isomorphic-ws')
const dbDrivers = require.main.require("./database/drivers.js");
const gmaps = require.main.require("./utils/gmaps.js");
const polyUtil = require('polyline-encoded');

var _drivers;

module.exports.init = function() {
    _drivers = [
        new TestDriver("Teszt gyors", { lat: 46.247366, lng: 20.142473 }, false),
        new TestDriver("Teszt animált", { lat: 46.252859, lng: 20.148191 }, true),
    ];
};

class TestDriver {
    constructor(username, baseLocation, followPath) {
        this.username = username;
        this.userID = null;
        this.token = null;
        this.tokenUpdater = null;
        this.spawnLocation = baseLocation;
        this.driverGPSUpdater = null;
        
        this.followPath = followPath;
        this.path = null;
        this.followTimer = null;

        this.driveLocation = null;
        this.passengerLocation = null;

        //Check the user
        dbUser.getUserByUsername(username)
        .then(function(user) {
            if (user == null) {
                this.createUser();
            } else {
                this.userID = user._id;

                log.info("Test driver \"" + this.username + "\" loaded as \"" + this.userID + "\"");    

                this.loginUser();
            }
        }.bind(this))
        .catch(this.errorHandler.bind(this));
    }

    createUser() {
        log.info("Creating test driver: \"" + this.username + "\"");

        dbUser.createUser(this.username, "driver", this.username + "@test.driver", this.username)
        .then(function(uid){
            this.userID = uid;

            log.info("Test driver \"" + this.username + "\" created as \"" + this.userID + "\"");

            this.loginUser();
        }.bind(this))
        .catch(this.errorHandler.bind(this));
    }

    loginUser() {
        var tokenID = sessions.createToken(this.userID);

        this.token = sessions.getToken(tokenID);

        if (this.token == null) {
            log.error("Failed to login test user: \"" + this.username + "\"");
        } else {
            log.info("Test driver \"" + this.username + "\" logged in!");
            
            if (this.tokenUpdater != null) {
                clearInterval(this.tokenUpdater);
            }
            this.tokenUpdater = setInterval(this.updateToken.bind(this), 1000 * 60 * 20); //20 mins

            setTimeout(this.initSocket.bind(this), 2000);
        }
    }

    initDriverReady() {
        if (this.driverGPSUpdater != null) {
            clearInterval(this.driverGPSUpdater);
        }

        dbDrivers.setDriverState(this.userID, true)
        .then(function(ok){
            dbDrivers.setDriverLocation(this.userID, this.spawnLocation.lat, this.spawnLocation.lng)
            .then(function(ok){
                //OK??
            })
            .catch(this.errorHandler.bind(this));
        }.bind(this))
        .catch(this.errorHandler.bind(this));
    }

    initSocket() {
        if (this.token == null || this.token.token == null) {
            setTimeout(this.loginUser.bind(this), 1000);
            return;
        }

        var ep = config.getEndpoint();

        var link = "ws://" + ep.ip + ":" + ep.port + "/ws_endpoint?t=" + this.token.token;

        this.socket = new WebSocket(link);

        this.socket.onopen = function() {
            log.info("Test driver connected socket.");

            this.initDriverReady();
        }.bind(this);

        this.socket.onerror = function (error) {
            log.error("Test driver socket error, relogging...");
            log.error(error);
            setTimeout(this.loginUser.bind(this), 1000);
        }.bind(this);

        this.socket.onclose = function(event) {
            log.error("Test driver socket error, relogging...");
            setTimeout(this.loginUser.bind(this), 1000);
        }.bind(this);

        this.socket.onmessage = function (message) {
            var msg = JSON.parse(message.data);

            if (msg.type == null) {
                return;
            }
            
            this.socket_message(msg.type, msg.data);
        }.bind(this);
    }

    sendPacket(type, data) {
        this.socket.send(JSON.stringify({
            type: type,
            data: {
                ...data
            }
        }));
    }

    socket_message(type, data) {
        switch(type) {
            case "request_ride":
            this.driveLocation = {
                lat: this.spawnLocation.lat,
                lng: this.spawnLocation.lng
            };

            //Wait a little before accepting
            setTimeout(function() {
                this.sendPacket("driver_request_result", {
                    accept: true
                });

                this.driverGPSUpdater = setInterval(this.sendGPSLocation.bind(this), 1000);
            }.bind(this), 1000);
            break;

            case "route_message":
            this.handleRouteMessages(data);
            break;
        }
    }

    sendGPSLocation() {
        this.sendPacket("driver_set_gps", {
            lat: this.driveLocation.lat,
            lng: this.driveLocation.lng
        });
    }

    startFollowingRoad(from, to) {
        gmaps.makeRoute(from, to)
        .then(function(route) {
            if (route.status != "OK") {
                this.driveLocation = to;
                return;
            }

            if (route.routes.length == 0) {
                this.driveLocation = to;
                return;
            }

            this.path = [];

            var steps = route.routes[0];
            var polyPath = steps.overview_polyline.points;

            var latlngs = polyUtil.decode(polyPath);

            for (var x = 0; x < latlngs.length; x++) {
                var ostep = latlngs[x];
                this.path.push({
                    lat: ostep[0],
                    lng: ostep[1]
                });
            }

            this.pathAnimator();
        }.bind(this))
        .catch(function (err) {
            console.log(err);
            this.driveLocation = to;
        }.bind(this));
    }

    pathAnimator() {
        if (this.followTimer != null) {
            clearInterval(this.followTimer);
            this.followTimer = null;
        }

        if (this.followPath) {
            var time = 250;
            if (this.path != null && this.path.length < 25) {
                time = 400;
            }

            this.followTimer = setInterval((() => {
                if (this.path != null && this.path.length > 0) {
                    var loc = this.path[0];
                    this.driveLocation = {
                        lat: loc.lat,
                        lng: loc.lng
                    };
                    this.sendGPSLocation();

                    this.path = this.path.slice(1);
                } else {
                    clearInterval(this.followTimer);
                    this.followTimer = null;
                }
            }).bind(this), time);
        }
    }

    handleRouteMessages(data) {
        if (data.cancel) { //The ride is cancelled
            this.initDriverReady();
        }

        switch(data.message) {
            case "PASSENGER_LOST":
            this.initDriverReady();
            break;

            case "PASSENGER_GPS":
            this.passengerLocation = {
                lat: data.location.lat,
                lng: data.location.lng
            };
            break;

            case "PICKUP_PASSENGER":
            //We need to goto the passenger, wait a little then teleport

            if (this.followPath) {
                this.startFollowingRoad(this.driveLocation, {
                    lat: data.passenger.lat,
                    lng: data.passenger.lng
                });
            } else {
                setTimeout(function(){
                    this.driveLocation = {
                        lat: data.passenger.lat,
                        lng: data.passenger.lng
                    }
                }.bind(this), 1000);
            }

            break;

            case "WAIT_PASSENGER":
            //Wait for the passenger to get in

            //Make sure we set the state so that the passenger is inside the taxi
            this.sendPacket("route_taxi_arrive", {});
            break;

            case "DO_ROUTE":
            //Go to the end address, wait a little then teleport

            if (this.followPath) {
                this.startFollowingRoad(this.driveLocation, {
                    lat: data.target.lat,
                    lng: data.target.lng
                });
            } else {
                setTimeout(function(){                
                    this.driveLocation = {
                        lat: data.target.lat,
                        lng: data.target.lng
                    }
                }.bind(this), 1000);
            }
            break;

            case "DONE":
            //Route done
            this.initDriverReady();
            break;

            case "CANCELLED":
            //Cancelled
            this.initDriverReady();
            break;
        }
    }  

    updateToken() {
        sessions.getToken(this.token.token);
    }

    errorHandler(err) {
        log.error("Test driver error:");
        log.error(err);
    }
}