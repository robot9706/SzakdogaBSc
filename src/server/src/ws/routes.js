const Distance = require('geo-distance');
const config = require.main.require("./utils/config.js");
const feeHelper = require.main.require("./utils/feehelper.js");
const log = require.main.require("./utils/logger.js");
const tx = require.main.require("./database/transactions.js");

const STATE_PASSENGER_PICKUP = 0;
const STATE_PASSENGER_WAIT = 1;
const STATE_WAIT_FOR_ROUTE = 2; //Not used on the server side
const STATE_DO_ROUTE = 3;
const STATE_FINISHED = 4;
const STATE_CANCELLED = 10;

module.exports = class Route {
    constructor(d, p, target) {
        this.driver = d;
        this.passenger = p;
        this.targetLocation = target;

        this.driverHasPassenger = false;
        this.passengerHasDriver = false;

        this.routeStart = null;
        this.state = STATE_PASSENGER_PICKUP;

        this.calculatedRoutePrice = this.passenger.userSession.data.calculatedRoutePrice;
    }

    update() {
        if (this.driver.userSession.data.location != null && this.passenger.userSession.data.location != null) {
            var driverLoc = this.driver.userSession.data.location;
            var passLoc = this.passenger.userSession.data.location;

            switch (this.state) {
                case STATE_PASSENGER_PICKUP:
                {
                    var cfg = config.getRoutesConfig();
                    var dist = Distance.between({ lat: driverLoc.lat, lon: driverLoc.lng }, { lat: passLoc.lat, lon: passLoc.lng });

                    if (dist <= Distance(cfg.driver_arrive_distance)) {
                        this.state = STATE_PASSENGER_WAIT;

                        this.driver.sendPacket("route_message", {
                            message: "WAIT_PASSENGER"
                        });
                        this.passenger.sendPacket("route_message", {
                            message: "GOTO_DRIVER"
                        });
                    }
                }
                break;
                case STATE_PASSENGER_WAIT:
                {
                    if (this.driverHasPassenger && this.passengerHasDriver) {
                        this.startRoute();
                    }
                }
                break;
                case STATE_DO_ROUTE:
                {
                    var cfg = config.getRoutesConfig();
                    var dist = Distance.between({ lat: driverLoc.lat, lon: driverLoc.lng }, { lat: this.targetLocation.lat, lon: this.targetLocation.lng });

                    if (dist <= Distance(cfg.destination_distance)) {
                        dist = Distance.between({ lat: passLoc.lat, lon: passLoc.lng }, { lat: this.targetLocation.lat, lon: this.targetLocation.lng });
                        if (dist <= Distance(cfg.destination_distance)) {
                            this.arrived();
                        }
                    }
                }
                break;
            }
        }
    }

    onTaxiArrive(client) {
        if (client == this.driver) {
            this.driverHasPassenger = true;
        } else if (client == this.passenger) {
            this.passengerHasDriver = true;
        }

        this.update();
    }

    onGPSData(client, gps) {
        if (this.state >= STATE_FINISHED) {
            return;
        }

        if (client == this.driver) {
            this.passenger.sendPacket("route_message", {
                message: "DRIVER_GPS",
                location: gps
            });

            this.update();
        } else if (client == this.passenger) {
            this.driver.sendPacket("route_message", {
                message: "PASSENGER_GPS",
                location: gps
            });

            this.update();
        }
    }

    startRoute() {
        this.state = STATE_DO_ROUTE;
        this.routeStart = new Date();

        //Check the price
        if (this.calculatedRoutePrice == null) {
            log.info("Had to calculate fee on \"startRoute\"!");

            var from = this.passenger.userSession.data.location;
            var to = this.targetLocation;
    
            feeHelper.calculateFee(from, to)
            .then(function(result) {
                var intFee = parseInt(result.fee);

                log.info("Calculated fee is: " + intFee);
    
                this.calculatedRoutePrice = intFee;
            })
            .catch(function(err) {
                log.error("Failed to calculate fee: " + err.error);
            });
        }

        //Start the clients
        this.driver.sendPacket("route_message", {
            message: "DO_ROUTE",
            target: this.targetLocation
        });
        this.passenger.sendPacket("route_message", {
            message: "DO_ROUTE"
        });
    }

    arrived() {
        this.state = STATE_FINISHED;

        var routeLength = parseInt((new Date() - this.routeStart) / 1000);

        tx.createInternal(this.passenger.userID, this.driver.userID, this.calculatedRoutePrice)
        .then(function(){
            this.sendDoneAndBalanceTo(this.driver, routeLength);
            this.sendDoneAndBalanceTo(this.passenger, routeLength);
        }.bind(this))
        .catch(function(err){
            log.error("Failed to do transaction: " + err);

            this.driver.sendPacket("route_message", {
                cancel: true,
                message: "CANCELLED"
            });
            this.passenger.sendPacket("route_message", {
                cancel: true,
                message: "CANCELLED"
            });
        }.bind(this));
    }

    sendDoneAndBalanceTo(client, routeLength) {
        tx.sumForUser(client.userSession.userID)
        .then(function(balance) {
            client.sendPacket("route_message", {
                message: "DONE",
                routeTime: routeLength,
                price: this.calculatedRoutePrice,
                events: [
                    {
                        type: "USER_BALANCE",
                        balance: balance
                    }
                ]
            });
        }.bind(this))
        .catch(function(err){
            client.sendPacket("route_message", {
                message: "DONE",
                routeTime: routeLength,
                balance: 0,
                price: this.calculatedRoutePrice
            });
        }.bind(this));
    }

    cancel(client) {
        if (client == this.driver || client == this.passenger) {
            this.state = STATE_CANCELLED;

            this.driver.sendPacket("route_message", {
                cancel: true,
                message: "CANCELLED"
            });
            this.passenger.sendPacket("route_message", {
                cancel: true,
                message: "CANCELLED"
            });

            this.driver.userSession.data.route = null;
            this.passenger.userSession.data.route = null;
        }
    }
}