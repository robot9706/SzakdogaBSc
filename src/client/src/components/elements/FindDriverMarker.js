import React, { Component } from 'react';
import { Marker, InfoWindow } from "react-google-maps"
import Button from '@material-ui/core/Button';
import { Typography } from '@material-ui/core';

export class FindDriverMarker extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            infoOpen: true
        }
    }

    handleCloseInfo() {
        this.setState({
            ...this.state,
            infoOpen: false
        });
    }

    handleOpenInfo() {
        this.setState({
            ...this.state,
            infoOpen: true
        });
    }

    render() {
        return <Marker position={{ lat: this.props.driver.lat, lng: this.props.driver.lng }} icon={this.props.icon} onClick={this.handleOpenInfo.bind(this)} >
            {
                this.state.infoOpen ?
                <InfoWindow onCloseClick={this.handleCloseInfo.bind(this)}>
                    <div>
                        <Typography variant="headline" style={{marginBottom: "10px"}}>{this.props.driver.name}</Typography>
                        <Button color="primary" size="small" variant="contained" onClick={this.props.onSelect.bind(this)}>Sofőr választása</Button>
                    </div>
                </InfoWindow>
                : null
            }
        </Marker>;
    }
}