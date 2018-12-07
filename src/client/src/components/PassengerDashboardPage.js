import React, { Component } from 'react';
import BaseMapView from "./BaseMapView"
import { connect } from "react-redux";

import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Button from '@material-ui/core/Button';
import { Typography, FormControlLabel } from '@material-ui/core';
import Checkbox from '@material-ui/core/Checkbox';

import { SocketConnection, onInvalidUser, doBackendPost, ENDPOINT_ROUTEPRICE } from "utils/backend";

import GPSLocationMarker from "./elements/GPSLocationMarker";
import StandaloneSearchBox from 'react-google-maps/lib/components/places/StandaloneSearchBox';

import blue_car from "images/blue_car.png";
import red_car from "images/red_car.png";

import { FindDriverMarker } from "./elements/FindDriverMarker"

import { Marker } from "react-google-maps";

import lookupMessage from '../utils/lang';

import { DirectionsRenderer } from "react-google-maps";

import { format_time } from '../utils/utils';

import { user_balancechange } from "../redux/user";

const createRouteFromDirections = (directions) => {
    let dist = 0;
    let time = 0;

    var route = directions.routes[0];
    for (let i = 0; i < route.legs.length; i++) {
        dist += route.legs[i].distance.value;
        time += route.legs[i].duration.value;
    }

    return {
        directions: directions,
        from: route.legs[0].start_address,
        to: route.legs[route.legs.length - 1].end_address,
        distance: dist,
        time: time,
        cost: 0,
        possible: false
    };
};

const formatDistance = (dist) => {
    if (dist < 1000) {
        return dist + "m";
    }

    return (Math.round((dist / 1000) * 10 ) / 10) + "km";
};

const formatTime = (time) => {
    return parseInt(time / 60) + ":" + parseInt(time % 60);
};

class PassengerDashboardPage extends BaseMapView {
    firstLocationUpdate;
    socket;

    locationMarker;
    searchBoxRef;

    constructor() {
        super("home");

        this.searchBoxRef = React.createRef();
        this.locationMarker = React.createRef();

        this.firstLocationUpdate = true;

		this.state = {
            places: [],
            hasDriver: false,
            routeDestination: null,
            generalError: null,
            route: null,
            drivers: [],
            requestDriver: null,
            driver: null,
            routeStatus: null,
            doneInfo: null,

            debug_follow: false
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
            case "find_drivers":
            this.setState({
                ...this.state,
                drivers: data.nearby
            });
            break;

            case "request_driver":
            if (!data.available) {
                this.setState({
                    ...this.state,
                    requestDriver: {
                        error: lookupMessage("UNAVAIL_DRIVER"),
                        driver: null
                    }
                })
            }
            break;

            case "route_message":
            this.onHandleRouteMessage(data);
            break;
        }
    }

    onHandleRouteMessage(data) {
        if (!this.state.hasDriver) {
            return;
        }

        if (data.cancel) {
            this.onRouteCancel();
        }

        switch(data.message) {
            case "DRIVER_DISMISS":
            this.setState({
                ...this.state,
                generalError: lookupMessage("DRIVER_DISMISS")
            })
            break;

            case "DRIVER_LOST":
            this.setState({
                ...this.state,
                generalError: lookupMessage("DRIVER_LOST")
            })
            break;

            case "DRIVER_GPS":
            this.setState({
                ...this.state,
                driver: {
                    ...this.state.driver,
                    location: {
                        lat: data.location.lat,
                        lng: data.location.lng,
                    }
                }
            });

            if (this.state.debug_follow) {
                this.locationMarker.current.setDebugLocation(data.location.lat, data.location.lng);
            }
            break;

            case "WAIT_DRIVER":
            this.setState({
                ...this.state,
                actualRoute: this.state.route,
                infoRoute: null,
                route: null,
                drivers: [],
                requestDriver: null,
                routeStatus: {
                    status: 0
                }
            })
            break;

            case "GOTO_DRIVER":
            this.setState({
                ...this.state,
                routeStatus: {
                    status: 1
                }
            });
            break;

            case "DO_ROUTE":
            this.setState({
                ...this.state,
                route: this.state.actualRoute,
                routeStatus: {
                    status: 3
                }
            });
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
            this.socket.sendPassengerGPS(pos.lat, pos.lng);
        }
    }

    onPlaceSearch() {
        const places = this.searchBoxRef.getPlaces();

        this.setState({
          places: places
        });

        if (places.length == 1) {
            var loc = this.locationMarker.current.getLastPosition();

            var destLoc = places[0].geometry.location;
            var destLat = destLoc.lat();
            var destLng = destLoc.lng();
            var dest = { lat: destLat, lng: destLng };

            this.makeRoute(loc, dest,
                function(resultOk) {
                    var route = createRouteFromDirections(resultOk);

                    var dir = route.directions.routes[0];
                    var realDest = dir.legs[dir.legs.length - 1].end_location;
                    destLat = realDest.lat();
                    destLng = realDest.lng();
                    dest = { lat: destLat, lng: destLng };

                    var request = {
                        token: this.props.user_token,
                        from: loc,
                        to: dest
                    };

                    doBackendPost(ENDPOINT_ROUTEPRICE, request, this)
                    .then(function(result) {
                        if (result == null) {
                            this.setState({generalError: lookupMessage("SERVER_ERROR")});
                        } else {
                            if (result.ok) {
                                route.cost = result.fee;
                                route.possible = result.possible;

                                this.setState({
                                    ...this.state,
                                    route: route.directions,
                                    infoRoute: route,
                                    routeDestination: { lat: destLat, lng: destLng }
                                });
                            } else {
                                this.setState({generalError: lookupMessage(result.message)});
                            }
                        }
                    }.bind(this));
                }.bind(this),
                function(resultError) {
                    this.setState({
                        ...this.state,
                        generalError: resultError
                    });
                }
            );
        }
    }

    onRouteOrder() {
        var loc = this.locationMarker.current.getLastPosition();
        
        this.socket.getNearbyDrivers(loc.lat, loc.lng);

        this.mapRef.state.map.zoom = 16;
        this.mapRef.state.map.panTo({
            lat: loc.lat,
            lng: loc.lng
        });
    }

    onRouteCancel() {
        this.socket.routeCancel();

        this.setState({
            ...this.state,
            routeDestination: null,
            route: null,
            infoRoute: null,
            drivers: [],
            requestDriver: null,
            driver: null,
            routeStatus: null,
            hasDriver: false,
        });
    }

    onRouteFinish() {
        this.setState({
            ...this.state,
            routeDestination: null,
            route: null,
            infoRoute: null,
            drivers: [],
            requestDriver: null,
            driver: null,
            routeStatus: null,
            hasDriver: false,
        });
    }

    onDriverRequestCancel() {
        this.setState({
            ...this.state,
            requestDriver: null,
            routeStatus: null,
            hasDriver: false
        });
    }

    onDriverSelected(driver) {
        this.socket.requestDriver(driver.id, this.state.routeDestination);

        this.setState({
            ...this.state,
            requestDriver: {
                error: null,
                driver: driver
            },
            hasDriver: true
        })
    }

    onArrivedToTaxi() {
        this.socket.taxiArrive();

        this.setState({
            ...this.state,
            routeStatus: {
                status: 2
            }
        });
    }

    handleDebugFollowChange(event) {
        this.setState({
            ...this.state,
            debug_follow: event.target.checked
        });

        if (event.target.checked && this.state.driver != null) {
            this.locationMarker.current.setDebugLocation(this.state.driver.location.lat, this.state.driver.location.lng);
        }
    }

    renderInsideMap() {
        return <>
            <GPSLocationMarker ref={this.locationMarker} onGPSUpdate={this.onGPSUpdate.bind(this)} available={false} />
            {
                this.state.route != null ?
                <DirectionsRenderer directions={this.state.route} /> :
                null
            }
            {
                (this.state.drivers != null) ?
                this.state.drivers.map((driver, index) => {
                    return <FindDriverMarker key={index} driver={driver} icon={blue_car} onSelect={() => { this.onDriverSelected(driver); }} />
                }) : null
            }
            {
                (this.state.driver != null) ?
                <Marker className="pointerDisable" draggable={false} position={this.state.driver.location} icon={blue_car} />
                : null
            }
        </>;
    }

    renderOverlay() {
        return <>
            <div data-standalone-searchbox="" className="pointerEnable" style={{marginLeft: "auto", marginRight: "auto", width: "50%", marginTop: "10px"}}>
                <StandaloneSearchBox   
                    ref={(ref) => { this.searchBoxRef = ref }}
                    onPlacesChanged={this.onPlaceSearch.bind(this)}
                >
                <input
                    type="text"
                    placeholder="Keresés"
                    style={{
                    boxSizing: `border-box`,
                    border: `1px solid transparent`,
                    width: `240px`,
                    height: `32px`,
                    padding: `0 12px`,
                    borderRadius: `3px`,
                    boxShadow: `0 2px 6px rgba(0, 0, 0, 0.3)`,
                    fontSize: `14px`,
                    outline: `none`,
                    textOverflow: `ellipses`,
                    width: `100%`
                    }}
                />
                </StandaloneSearchBox>
            </div>

            {
                //Route info panel
                this.state.infoRoute != null ?
                (
                    <Card className="cardBottomLeft pointerEnable">
                        <CardContent>
                            <Typography variant="headline" style={{marginBottom: "10px"}}>Útvonal terv</Typography>
                            <Typography variant="subheading"><b>Út innen:</b> {this.state.infoRoute.from}</Typography>
                            <Typography variant="subheading"><b>Út ide:</b> {this.state.infoRoute.to}</Typography>
                            <Typography variant="subheading"><b>Távolság:</b> {formatDistance(this.state.infoRoute.distance)}</Typography>
                            <Typography variant="subheading"><b>Idő:</b> {formatTime(this.state.infoRoute.time)}</Typography>
                            <Typography variant="subheading"><b>Ár:</b> {this.state.infoRoute.cost} Ft</Typography>
                        </CardContent>
                        <CardActions>
                            {
                                (this.state.infoRoute.possible) ? 
                                <Button color="primary" size="small" variant="contained" onClick={this.onRouteOrder.bind(this)}>Sofőr keresése</Button>
                                : <Typography variant="subheading">Nincs elég keret!</Typography>
                            }
                            <Button color="primary" size="small" variant="text" onClick={this.onRouteCancel.bind(this)}>Mégse</Button>
                        </CardActions>
                    </Card>
                )
                : null
            }

            {
                //Done panel
                (this.state.routeStatus != null && this.state.routeStatus.status == 4) ?
                <div style={{position: "absolute", width: "100%", height: "100%", display: "flex", alignItems: "center"}}>
                    <Card className="pointerEnable" style={{width: "25%", marginLeft: "auto", marginRight: "auto"}}>
                        <CardContent style={{textAlign: "center"}}>
                            <Typography variant="headline" style={{marginBottom: "10px"}}>Célhoz ért!</Typography>
                            <Typography variant="subheading" style={{marginBottom: "10px"}}>{ "Az utazás ideje: " + format_time(this.state.doneInfo.time) }</Typography>
                            <Typography variant="subheading" style={{marginBottom: "10px"}}>{ "Az utazás díja: " + this.state.doneInfo.price + "Ft" }</Typography>
                        </CardContent>
                        <CardActions>							
                            <Button color="primary" style={{marginLeft: "auto", marginRight: "auto"}} size="small" variant="contained" onClick={this.onRouteFinish.bind(this)}>Rendben</Button>
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
                                <Typography variant="subheading" style={{marginBottom: "10px"}}>{lookupMessage("ROUTE_STATUS_2_PASSENGER")}</Typography>
                                : null
                            }
                            <FormControlLabel control={
                                <Checkbox checked={this.state.debug_follow} onChange={this.handleDebugFollowChange.bind(this)} value="debug_follow" color="primary" />
                            }
                            label="TESZT: Sofőr automatikus követése" />
                        </CardContent>
                        <CardActions>
                            {
                                (this.state.routeStatus.status == 1) ?
                                <Button color="primary" style={{marginLeft: "auto", marginRight: "auto"}} size="small" variant="contained" onClick={this.onArrivedToTaxi.bind(this)}>Beszálltam az autóba</Button>
                                : null
                            }
                            <Button color="primary" style={{marginLeft: "auto", marginRight: "auto"}} size="small" variant="contained" onClick={this.onRouteCancel.bind(this)}>Út megszakítása</Button>
                        </CardActions>
                    </Card>
                </div>
                : null
            }

            {
                //Wait for driver response popup
                (this.state.requestDriver != null) ?
                <div style={{position:"absolute", left: "0", top:"0", width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center"}}>
                    <Card className="pointerEnable" style={{width: "25%", marginLeft: "auto", marginRight: "auto"}}>
                        <CardContent style={{textAlign: "center"}}>
                            {
                                (this.state.requestDriver.error == null) ? <>
                                    <Typography variant="headline" style={{marginBottom: "10px"}}>Várakozás a sofőrre</Typography>
                                    <Typography variant="subheading" style={{marginBottom: "10px"}}>{this.state.requestDriver.driver.name}</Typography>
                                </>
                                : <Typography variant="headline" style={{marginBottom: "10px"}}>{this.state.requestDriver.error}</Typography>
                            }
                        </CardContent>
                        <CardActions>
                            <Button color="primary" style={{marginLeft: "auto", marginRight: "auto"}} size="small" variant="contained" onClick={this.onDriverRequestCancel.bind(this)}>Mégse</Button>
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

export default connect(mapStateToProps, mapDispatchToProps)(PassengerDashboardPage);