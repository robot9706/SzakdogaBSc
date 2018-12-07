import React, { Component } from 'react';
import SubmitForm from './SubmitForm';
import { connect } from "react-redux";

import { check_string_field } from "../../utils/utils";
import { doBackendPost, ENDPOINT_USERSETDATA } from "../../utils/backend";
import lookupMessage from "../../utils/lang";

import "styles/radio_button.css";

export function UserPreferenceComponent_submit_pref() {
    return new Promise(function(resolve, reject){
        if (check_string_field(this.state.pref)) {
            resolve();
            
            return;
        }

        var dataRequest = {
            token: this.props.user_token,
            pref: this.state["pref"],
        };

        doBackendPost(ENDPOINT_USERSETDATA, dataRequest, this)
        .then(function(result) {
            if (result == null) {
                this.setState({errorTextOk: lookupMessage("SERVER_ERROR"), okTextPassword: null});
            } else {
                if (result.ok) {
                    this.setState({okTextOk: lookupMessage(result.message), errorTextPassword: null});
                } else {
                    this.setState({errorTextOk: lookupMessage(result.message), okTextPassword: null});
                }
            }

            resolve();
        }.bind(this));
    }.bind(this));
}

export function UserPreferenceComponent({state, handle_change, submit}) {
    return <div className="table">
        <hr/>
        <p className="pageSubTitle">Profil típusa</p>
        <div className="centerText">
            <a className="errorText">{state.errorTextOk}</a>
            <a className="okText">{state.okTextOk}</a>
        </div>
        <SubmitForm submitText="Módosít" onSubmit={submit}>
            <label className="container">Utas
                <input type="radio" name="user_pref" checked={state.pref == "PASSENGER"} required={true} field="pref" p_method="PASSENGER" onChange={handle_change} />
                <span className="checkmark"></span>
            </label>
            <label className="container">Sofőr
                <input type="radio" name="user_pref" checked={state.pref == "DRIVER"} required={true} field="pref" p_method="DRIVER" onChange={handle_change} />
                <span className="checkmark"></span>
            </label>
            <label className="container">Sofőr és utas
                <input type="radio" name="user_pref" checked={state.pref == "PASSENGER|DRIVER"} required={true} field="pref" p_method="PASSENGER|DRIVER" onChange={handle_change} />
                <span className="checkmark"></span>
            </label>
        </SubmitForm>
    </div>;
}