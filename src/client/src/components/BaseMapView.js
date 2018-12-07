import React, { Component } from 'react';
import BasePage from "./BasePage"

import {
    withGoogleMap,
    GoogleMap
  } from "react-google-maps";

  const GoogleMapView = withGoogleMap(props =>
    <GoogleMap
      defaultZoom={17}
      defaultCenter={{ lat: 46.2535027, lng: 20.1493668 }}
    >
    { props.children }
    </GoogleMap>
  );

class BaseMapView extends BasePage {
    mapRef;

    constructor(page) {
        super(page);
        
        this.mapRef = React.createRef();
    }
    
    makeRoute(from, to, callbackOk, callbackError) {
        const DirectionsService = new window.google.maps.DirectionsService();
        DirectionsService.route({
            origin: new window.google.maps.LatLng(from.lat, from.lng),
            destination: new window.google.maps.LatLng(to.lat, to.lng),
            travelMode: window.google.maps.TravelMode.DRIVING,
            }, (result, status) => {
                if (status === window.google.maps.DirectionsStatus.OK) {
                    callbackOk(result);
                } else {
                    callbackError(result);
                }
        });
    }

	componentWillMount() {
    }
    
    onMapMounted(ref) {
        if (ref != null){
            this.mapRef = ref;
        }
    }

    renderContent() {
        return <>
            <GoogleMapView
                ref = {this.onMapMounted.bind(this)}
                containerElement={<div style={{ height: "100%", width: "100%", position: "absolute" }} />}
                mapElement={<div style={{ height: `100%` }} />}
            >
                {this.renderInsideMap()}
            </GoogleMapView>
            <div style={{position: "absolute", width: "100%", height: "100%"}} className="pointerDisable">
                {this.renderOverlay()}
            </div>
        </>;
    }

    renderInsideMap() {
    }

    renderOverlay() {
    }
}

export default BaseMapView;