import React, { Component } from 'react';
import BaseMapView from "./BaseMapView"
import { connect } from "react-redux";

import { SocketConnection } from "utils/backend";

import GPSLocationMarker from "./elements/GPSLocationMarker";
import { onInvalidUser } from '../utils/backend';

import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Button from '@material-ui/core/Button';
import { Typography } from '@material-ui/core';

import blue_car from "images/blue_car.png";
import red_car from "images/red_car.png";

import lookupMessage from '../utils/lang';
import { Marker } from 'react-google-maps';

import { DirectionsRenderer } from "react-google-maps";
import { format_time } from '../utils/utils';

import { user_balancechange } from "../redux/user";

class DriverDashboardPage extends BaseMapView {
    firstLocationUpdate;
    socket;
    locationMarker;

    constructor() {
		super("home");
        
        this.firstLocationUpdate = true;
        this.locationMarker = React.createRef();

		this.state = {
            available: false,
            hasPassenger: false,
            generalError: null,
            passengerRequest: null,
            passenger: null,
            route: null,
            routeStatus: null,
            doneInfo: null
        };
    }

    componentWillMount() {
        this.socket = new SocketConnection(this.props.user_token);
        this.socket.setEvents(this.socket_onError.bind(this), this.socket_onClose.bind(this), this.socket_message.bind(this));
    }

    componentWillUnmount() {
        this.socket.close();
    }

    socket_onError() {

    }

    socket_onClose(msg) {
        if (msg == "TOKEN_EXPIRY") {
            onInvalidUser(this);
        }
    }

    socket_message(type, data) {
        switch (type) {
            case "request_ride":
            this.setState({
                ...this.state,
                passengerRequest: {
                    name: data.passenger
                }
            });
            break;

            case "route_message":
            this.onHandleRouteMessage(data);
            break;
        }
    }

    routeCancel() {
        this.socket.routeCancel();

        this.setState({
            ...this.state,
            passengerRequest: null,
            passenger: null,
            route: null,
            routeStatus: null,
            hasPassenger: false
        });
    }

    routeFinish() {
        this.setState({
            ...this.state,
            passengerRequest: null,
            passenger: null,
            route: null,
            routeStatus: null,
            hasPassenger: false
        });
    }

    routeGotoPassenger(data) {
        var loc = this.locationMarker.current.getLastPosition();

        this.makeRoute(loc, { lat: data.passenger.lat, lng: data.passenger.lng },
            function(resultOk) {
                this.setState({
                    ...this.state,
                    route: resultOk,
                    routeStatus: {
                        status: 0
                    }
                });
            }.bind(this),
            function(resultError) {
                this.setState({
                    ...this.state,
                    generalError: resultError
                });
            }
        );
    }

    routeGotoDestination(destination) {
        var loc = this.locationMarker.current.getLastPosition();

        this.makeRoute(loc, { lat: destination.lat, lng: destination.lng },
            function(resultOk) {
                this.setState({
                    ...this.state,
                    route: resultOk,
                    routeStatus: {
                        status: 3
                    }
                });
            }.bind(this),
            function(resultError) {
                this.setState({
                    ...this.state,
                    generalError: resultError
                });
            }
        );
    }

    onHandleRouteMessage(data) {
        if (!this.state.hasPassenger) {
            return;
        }

        if (data.cancel) {
            this.routeCancel();
        }

        switch(data.message) {
            case "PASSENGER_LOST":
            this.setState({
                ...this.state,
                generalError: lookupMessage("PASSENGER_LOST")
            })
            break;

            case "PASSENGER_GPS":
            this.setState({
                ...this.state,
                passenger: {
                    ...this.state.passenger,
                    location: {
                        lat: data.location.lat,
                        lng: data.location.lng,
                    }
                }
            })
            break;

            case "PICKUP_PASSENGER":
            this.routeGotoPassenger(data);
            break;

            case "WAIT_PASSENGER":
            this.setState({
                ...this.state,
                routeStatus: {
                    status: 1
                }
            });
            break;

            case "DO_ROUTE":
            this.routeGotoDestination(data.target);
            break;

            case "DONE":
            this.setState({
                ...this.state,
                routeStatus: {
                    status: 4
                },
                doneInfo: {
                    time: data.routeTime,
                    price: data.price
                }
            });
            this.props.user_balancechange(data.balance);
            break;

            case "CANCELLED":
            this.setState({
                ...this.state,
                generalError: "Az útazás megszakítva!"
            });
            break;
        }
    }
    
    onGPSUpdate(pos){
        if (this.firstLocationUpdate && this.mapRef != null && this.mapRef.state.map != null) {
            this.firstLocationUpdate = false;

            this.mapRef.state.map.panTo(pos);
        }

        if (this.socket != null) {
            this.socket.sendDriverGPS(pos.lat, pos.lng);
        }
    }

    btn_toggleAvailable() {
        var state = !this.state.available;

        this.setState({
            ...this.state,
            available: state
        })

        this.socket.sendDriverState(state);
    }

    onPassengerResponse(ok) {
        this.socket.driverRequestResult(ok);

        this.setState({
            ...this.state,
            passengerRequest: null,
            hasPassenger: ok
        });
    }

    onPassengerPickedUp() {
        this.socket.taxiArrive();

        this.setState({
            ...this.state,
            routeStatus: {
                status: 2
            }
        });
    }

    renderInsideMap() {
        return <>
            <GPSLocationMarker ref={this.locationMarker} onGPSUpdate={this.onGPSUpdate.bind(this)} available={this.state.available} />
            {
                this.state.route != null ?
                <DirectionsRenderer directions={this.state.route} /> :
                null
            }
            {
                (this.state.passenger != null) ?
                <Marker className="pointerDisable" draggable={false} position={this.state.passenger.location} icon={red_car} />
                : null
            }
        </>;
    }

    renderOverlay() {
        return <>
            <input style={{position: "absolute", left: "0", bottom: "0"}} type="submit" className="baseButton pointerEnable" value={this.state.available ? "Szolgálatból kilépés" : "Szolgálatba lépés"} onClick={this.btn_toggleAvailable.bind(this)} />

            {
                //Done panel
                (this.state.routeStatus != null && this.state.routeStatus.status == 4) ?
                <div style={{position: "absolute", width: "100%", height: "100%", display: "flex", alignItems: "center"}}>
                    <Card className="pointerEnable" style={{width: "25%", marginLeft: "auto", marginRight: "auto"}}>
                        <CardContent style={{textAlign: "center"}}>
                            <Typography variant="subheading" style={{marginBottom: "10px"}}>{ "Az utazás ideje: " + format_time(this.state.doneInfo.time) }</Typography>
                        </CardContent>
                        <CardActions>							
                            <Button color="primary" style={{marginLeft: "auto", marginRight: "auto"}} size="small" variant="contained" onClick={this.routeFinish.bind(this)}>Rendben</Button>
                        </CardActions>
                    </Card>
                </div>
                : null
            }

            {
                //Status panel
                (this.state.routeStatus != null && this.state.routeStatus.status < 4) ?
                <div style={{position: "absolute", bottom: "0", width: "100%", display: "flex", alignItems: "center"}}>
                    <Card className="pointerEnable" style={{width: "25%", marginLeft: "auto", marginRight: "auto"}}>
                        <CardContent style={{textAlign: "center"}}>
                            <Typography variant="subheading" style={{marginBottom: "10px"}}>{lookupMessage("ROUTE_STATUS_" + this.state.routeStatus.status)}</Typography>
                            {
                                (this.state.routeStatus.status == 2) ?
                                <Typography variant="subheading" style={{marginBottom: "10px"}}>{lookupMessage("ROUTE_STATUS_2_DRIVER")}</Typography>
                                : null
                            }
                        </CardContent>
                        <CardActions>
                            {
                                (this.state.routeStatus.status == 1) ?
                                <Button color="primary" style={{marginLeft: "auto", marginRight: "auto"}} size="small" variant="contained" onClick={this.onPassengerPickedUp.bind(this)}>Beszállt az utas</Button>
                                : null
                            }							
                            <Button color="primary" style={{marginLeft: "auto", marginRight: "auto"}} size="small" variant="contained" onClick={this.routeCancel.bind(this)}>Út megszakítása</Button>
                        </CardActions>
                    </Card>
                </div>
                : null
            }

            {
                //Passenger request popup
                (this.state.passengerRequest != null) ?
                <div style={{position:"absolute", left: "0", top:"0", width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center"}}>
                    <Card className="pointerEnable" style={{width: "25%", marginLeft: "auto", marginRight: "auto"}}>
                        <CardContent style={{textAlign: "center"}}>
                            <Typography variant="headline" style={{marginBottom: "10px"}}>Új fuvar!</Typography>
                            <Typography variant="subheading" style={{marginBottom: "10px"}}>{this.state.passengerRequest.name}</Typography>
                        </CardContent>
                        <CardActions>
                            <Button color="primary" style={{marginLeft: "auto", marginRight: "auto"}} size="small" variant="contained" onClick={() => {this.onPassengerResponse(true)}}>Elfogad</Button>
                            <Button color="primary" style={{marginLeft: "auto", marginRight: "auto"}} size="small" variant="contained" onClick={() => {this.onPassengerResponse(false)}}>Mégse</Button>
                        </CardActions>
                    </Card>
                </div>
                : null
            }

            {
                //General error popup
                (this.state.generalError != null) ?
                <div style={{position:"absolute", left: "0", top:"0", width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center"}}>
                    <Card className="pointerEnable" style={{width: "25%", marginLeft: "auto", marginRight: "auto"}}>
                        <CardContent style={{textAlign: "center"}}>
                            <Typography variant="headline" style={{marginBottom: "10px"}}>{this.state.generalError}</Typography>
                        </CardContent>
                        <CardActions>
                            <Button color="primary" style={{marginLeft: "auto", marginRight: "auto"}} size="small" variant="contained" onClick={() => {this.setState({...this.state,generalError:null})}}>OK</Button>
                        </CardActions>
                    </Card>
                </div>
                : null
            }
        </>;
    }
}

const mapStateToProps = state => ({
    user_token: state.user.token
});

const mapDispatchToProps = dispatch => ({
    user_balancechange: (balance) => {
        dispatch(user_balancechange(balance));   
    }
});

export default connect(mapStateToProps, mapDispatchToProps)(DriverDashboardPage);