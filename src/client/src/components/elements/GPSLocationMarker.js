import React, { Component } from 'react';

import red_car from "images/red_car.png";
import blue_car from "images/blue_car.png";

import { Marker } from "react-google-maps"

class GPSLocationMarker extends Component {
    timer;
    fakeLocation;
    updateStateWithLocation;

    constructor(props) {
        super(props);

        this.fakeLocation = null;
        this.updateStateWithLocation = true;

        this.state = {
            lat: 46.2535027,
            lng: 20.149366
        }

        this.timer = null;
    }

    componentDidMount() {
        if (this.timer == null) {
            this.timer = setInterval(this.getLocation.bind(this), 1000);
        }
    }

    componentWillUnmount() {
        if (this.timer != null) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    getLocation() {
        if (this.fakeLocation != null) {
            this.updatePosition(this.fakeLocation);
        } else {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(this.updatePosition.bind(this));
            } else {
                alert("GPS not supported!");
            }
        }
    }

    updatePosition(pos) {
        var location = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
        };

        if (this.props.onGPSUpdate != null) {
            this.props.onGPSUpdate(location);
        }

        if (this.updateStateWithLocation){
            this.setState({
                ...this.state,
                ...location
            });
        } 
    }

    getLastPosition() {
        if (this.updateStateWithLocation || this.fakeLocation == null) {
            return { 
                lat: this.state.lat,
                lng: this.state.lng 
            }
        } else {
            return { 
                lat: this.fakeLocation.coords.latitude,
                lng: this.fakeLocation.coords.longitude
            }
        }
    }

    setDebugLocation(lat, lng) {
        this.updateStateWithLocation = false;
        this.fakeLocation = {
            coords: {
                latitude: lat,
                longitude: lng
            }
        };
        this.updatePosition(this.fakeLocation);
    }

    onDebugDragStart(event) {
        this.updateStateWithLocation = false;
    }

    onDebugDrag(event) {
        var lat = event.latLng.lat();
        var lng = event.latLng.lng();

        this.fakeLocation = {
            coords: {
                latitude: lat,
                longitude: lng
            }
        };
    }

    render() {
        return <Marker
                    position={this.getLastPosition()} 
                    icon={this.props.available ? blue_car : red_car} 
                    draggable={true}
                    onDragStart={this.onDebugDragStart.bind(this)}
                    onDragEnd={this.onDebugDrag.bind(this)} />;
    }
}

export default GPSLocationMarker;