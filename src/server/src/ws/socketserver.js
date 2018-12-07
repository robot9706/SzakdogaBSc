const log = require.main.require("./utils/logger");
const sessions = require.main.require("./sessions.js");
const Route = require.main.require("./ws/routes.js");

var drivers = require.main.require("./database/drivers.js");
var users = require.main.require("./database/users.js");

var _wsServer;
var _clients = [];

module.exports.init = function(server) {
    log.info("Starting WebSocket server");

    server.ws("/ws_endpoint", function(ws, req) {
        if (req.query == null || req.query.t == null) {
            log.info("WS missing token");
            ws.close();
        } else {
            ws_connect(ws, req.query.t);
        }
    });
};

function ws_connect(ws, token) {
    var userSession = sessions.getToken(token);
    if (userSession == null) {
        log.info("WS invalid token");
        ws.close();
        return;
    }

    log.info("WS connection accepted for \"" + userSession.userID + "\"");

    console.log(userSession.userID);
    _clients[userSession.userID] = new SocketClient(ws, userSession);
}

function remove_client(client) {
    delete _clients[client.userID];
}

class SocketClient {
    constructor(s, userSession) {
        this.socket = s;
        this.userSession = userSession;
        this.userID = userSession.userID;

        s.on("close", this.event_close.bind(this));
        s.on("message", this.event_message.bind(this));

        this.lastTalk = new Date();

        this.handlers = {
            ping: function (msg) {
                this.lastTalk = new Date();
            }.bind(this),
            
            driver_state: function (msg) {
                drivers.setDriverState(this.userID, msg.state)
                .then(function(result) {
                    //???
                }.bind(this))
                .catch(function(err){
                    log.error(err);
                }.bind(this));
            }.bind(this),

            driver_set_gps: function(msg) {
                drivers.setDriverLocation(this.userID, msg.lat, msg.lng)
                .then(function(result) {
                    //???
                }.bind(this))
                .catch(function(err){
                    log.error(err);
                }.bind(this));

                this.userSession.data.location = {
                    lat: msg.lat,
                    lng: msg.lng
                }

                if (this.userSession.data.route != null) {
                    this.userSession.data.route.onGPSData(this,  {
                        lat: msg.lat,
                        lng: msg.lng
                    });
                }
            }.bind(this),

            passenger_set_gps: function(msg) {
                this.userSession.data.location = {
                    lat: msg.lat,
                    lng: msg.lng
                }

                if (this.userSession.data.route != null) {
                    this.userSession.data.route.onGPSData(this,  {
                        lat: msg.lat,
                        lng: msg.lng
                    });
                }
            }.bind(this),

            find_drivers: function(msg) {
                drivers.findNearby(msg.lat, msg.lng)
                .then(function(result) {
                    var nearby = [];

                    for (var x = 0; x < result.length; x++) {
                        var dbObject = result[x];

                        nearby.push({
                            name: dbObject.user[0].name,
                            lat: dbObject.lastLocation.coordinates[1],
                            lng: dbObject.lastLocation.coordinates[0],
                            dist: dbObject.dist.calculated,
                            id: dbObject.userID
                        });
                    }

                    var answer = {
                        type: "find_drivers",
                        data: {
                            nearby: nearby
                        }
                    };
                    this.socket.send(JSON.stringify(answer));
                }.bind(this))
                .catch(function(err){
                    log.error(err);
                }.bind(this));
            }.bind(this),

            request_driver: function(msg) {
                if (_clients[msg.driver] == null) {
                    this.socket.send(JSON.stringify({
                        type: "request_driver",
                        data: {
                            available: false
                        }
                    }));
                } else {
                    var driver = _clients[msg.driver];

                    if (driver.userSession.data.passengerRequest != null) {
                        this.socket.send(JSON.stringify({
                            type: "request_driver",
                            data: {
                                available: false
                            }
                        }));
                    } else {
                        users.getUserByID(this.userID)
                        .then(function(result){
                            driver.userSession.data.passengerRequest = {
                                passenger: this.userID,
                                target: msg.target
                            };
    
                            driver.sendPacket("request_ride", {
                                passenger: result.name
                            });
                        }.bind(this))
                        .catch(function(err){
                            log.error(err);
                        }.bind(this));
                    }
                }
            }.bind(this),

            driver_request_result: function(msg) {
                //Dismiss passenger
                if (!msg.accept) {
                    var passengerID = this.userSession.data.passengerRequest.passenger;
                    this.userSession.data.passengerRequest = null;

                    if (_clients[passengerID] != null) {
                        var passenger = _clients[passengerID];

                        passenger.sendPacket("route_message", {
                            cancel: true,
                            message: "DRIVER_DISMISS"
                        });
                    }

                    return;
                }

                //Accept passenger
                if (this.userSession.data.passengerRequest == null) {
                    this.socket.send(JSON.stringify({
                        type: "route_message",
                        data: {
                            cancel: true,
                            message: "PASSENGER_LOST"
                        }
                    }));
                } else {
                    var passengerID = this.userSession.data.passengerRequest.passenger;
                    var targetLocation = this.userSession.data.passengerRequest.target;

                    if (_clients[passengerID] == null) {
                        this.userSession.data.passengerRequest = null;

                        this.socket.send(JSON.stringify({
                            type: "route_message",
                            data: {
                                cancel: true,
                                message: "PASSENGER_LOST"
                            }
                        }));
                    } else {
                        this.userSession.data.passengerRequest = null;
                        this.userSession.data.passenger = passengerID;

                        var passenger = _clients[passengerID];
                        passenger.userSession.data.driver = this.userID;

                        var route = new Route(this, passenger, targetLocation);

                        passenger.userSession.data.route = route;
                        this.userSession.data.route = route;

                        this.sendPacket("route_message", {
                            message: "PICKUP_PASSENGER",
                            passenger: {
                                lat: passenger.userSession.data.location.lat,
                                lng: passenger.userSession.data.location.lng,
                            }
                        });
                        passenger.sendPacket("route_message", {
                            message: "WAIT_DRIVER"
                        });
                    }
                }
            }.bind(this),

            route_taxi_arrive: function(msg) {
                if (this.userSession.data.route != null) {
                    this.userSession.data.route.onTaxiArrive(this);
                }
            }.bind(this),

            route_cancel: function(msg) {
                if (this.userSession.data.route != null) {
                    this.userSession.data.route.cancel(this);
                }
            }.bind(this)
        }
    }

    event_close() {
        remove_client(this);

        //Invalidate the driver
        drivers.setDriverState(this.userID, false)
        .then(function(result) {
            //???
        }.bind(this))
        .catch(function(err){
            log.error(err);
        }.bind(this));

        //If this is a driver and has a request
        if (this.userSession.data.passengerRequest != null) {
            this.userSession.data.route = null;
            var passengerID = this.userSession.data.passengerRequest.passenger;
            if (_clients[passengerID] != null) {
                var passenger = _clients[passengerID];

                passenger.sendPacket("route_message", {
                    cancel: true,
                    message: "DRIVER_DISMISS"
                });
            }
        }

        //If this is an active driver
        if (this.userSession.data.passenger != null) {
            this.userSession.data.route = null;
            var passengerID = this.userSession.data.passenger;
            if (_clients[passengerID] != null) {
                var passenger = _clients[passengerID];

                passenger.sendPacket("route_message", {
                    cancel: true,
                    message: "DRIVER_LOST"
                });
            }
        }

        //If this is an active passenger
        if (this.userSession.data.driver != null) {
            this.userSession.data.route = null;
            var driverID = this.userSession.data.driver;
            if (_clients[driverID] != null) {
                var driver = _clients[driverID];

                driver.sendPacket("route_message", {
                    cancel: true,
                    message: "PASSENGER_LOST"
                });
            }
        }
    }

    event_message(message) {
        var msg = JSON.parse(message);

        if (!sessions.validateToken(this.userSession)) {
            this.closeSocketWithError("TOKEN_EXPIRY");
            return;
        }

        if (this.handlers[msg.type] != null) {
            this.handlers[msg.type](msg.data);
        } else {
            log.info("Unknown WS message: \"" + msg.type + "\"");
        }
    }

    closeSocketWithError(msg) {
        this.socket.close(4000, msg);
    }

    sendPacket(type, data) {
        try {
            this.socket.send(JSON.stringify({
                type: type,
                data: {
                    ...data
                }
            }));
        }
        catch (err) {
            log.error(err);
        }
    }
}