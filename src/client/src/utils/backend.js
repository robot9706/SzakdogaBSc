import { store } from "App.js";
import { user_logout, user_balancechange } from "redux/user.js";

//var baseAddress = "localhost:4000";
//var backend = "http://" + baseAddress;

function getBackendAddress(withProtocol) {
    var host = window.location.host;
    
	if (withProtocol) {
		return window.location.protocol + "//" + host;
	}
	
	return host;
}

export const ENDPOINT_USERLOGIN = "/data/user_login";
export const ENDPOINT_USERREGISTER = "/data/user_register";
export const ENDPOINT_USERDATA = "/data/user_getinfo";
export const ENDPOINT_USERSETDATA = "/data/user_setinfo";
export const ENDPOINT_USERTXDASH = "/data/user_txdash";
export const ENDPOINT_USERMONEYMOVE = "/data/user_moneymove";
export const ENDPOINT_USERTXHISTORY = "/data/user_txhistory";
export const ENDPOINT_ROUTEPRICE = "/data/route_price";

function processEvent(e) {
    switch (e.type) {
        case "USER_BALANCE":
        store.dispatch(user_balancechange(e.balance));
        break;
    }
}

export function processBackendEvents(events) {
    for (var x = 0; x < events.length; x++) {
        processEvent(events[x]);
    }
}

export function onInvalidUser(page) {
    store.dispatch(user_logout());
    page.props.history.push("/user/login");
}

export function doBackendPost(endpoint, data, page) {
    return new Promise(function(resolve, reject){
        fetch(getBackendAddress(true) + endpoint, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data)
        }).then(result => result.json())
        .then(function (result){
            if (result != null && !result.ok && result.error == "TOKEN_EXPIRY"){
                onInvalidUser(page);
            } else {
                if (result.ok && result.event != null) {
                    processBackendEvents(result.event);
                }

                resolve(result);
            }
        })
        .catch(function(err){
            console.error(err);

            resolve(null);
        });
    });
}

export function getWebsocketEndpoint(token) {
    //return "ws://" + baseAddress + "/ws_endpoint?t=" + encodeURIComponent(token);
	return "ws://" + getBackendAddress(false) + "/ws_endpoint?t=" + encodeURIComponent(token);
}

export class SocketConnection {
    event_error;
    event_close;
    event_message;

    constructor(token) {
        this.socket = new WebSocket(getWebsocketEndpoint(token));

        this.socket.onopen = function () {
            console.log("OPEN");
        };

        this.socket.onerror = function (error) {
            if (this.event_error != null) {
                this.event_error(error);
            }
        }.bind(this);

        this.socket.onclose = function(event) {
            if (event.code == 4000 && this.event_close != null) {
                this.event_close(event.reason);
            }
        }.bind(this);

        this.socket.onmessage = function (message) {
            var msg = JSON.parse(message.data);

            if (msg.data != null && msg.data.events != null) {
                processBackendEvents(msg.data.events);
            }

            if (msg.type == null) {
                return;
            }
            
            if (this.event_message != null) {
                this.event_message(msg.type, msg.data);
            }
        }.bind(this);
    }

    close() {
        this.socket.close();
    }

    setEvents(onError, onClose, onMessage) {
        this.event_error = onError;
        this.event_close = onClose;
        this.event_message = onMessage;
    }

    makePacket(type, data) {
        return JSON.stringify({
            type: type,
            data: {
                ...data
            }
        });
    }

    sendDriverState(available) {
        this.socket.send(this.makePacket("driver_state", {
            state: available
        }));
    }

    sendDriverGPS(lat, lng) {
        this.socket.send(this.makePacket("driver_set_gps", {
            lat: lat,
            lng: lng
        }));
    }

    sendPassengerGPS(lat, lng) {
        this.socket.send(this.makePacket("passenger_set_gps", {
            lat: lat,
            lng: lng
        }));
    }

    getNearbyDrivers(lat, lng) {
        this.socket.send(this.makePacket("find_drivers", {
            lat: lat,
            lng: lng
        }));
    }

    requestDriver(driverID, target) {
        this.socket.send(this.makePacket("request_driver", {
            driver: driverID,
            target: target
        }));
    }

    driverRequestResult(ok) {
        this.socket.send(this.makePacket("driver_request_result", {
            accept: ok
        }));
    }

    taxiArrive() {
        this.socket.send(this.makePacket("route_taxi_arrive", { }));
    }

    routeCancel() {
        this.socket.send(this.makePacket("route_cancel", { }));
    }
}