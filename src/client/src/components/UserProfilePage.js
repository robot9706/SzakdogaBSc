import React, { Component } from 'react';
import BasePage from "./BasePage"
import { connect } from "react-redux";

import { check_string_field } from '../utils/utils';
import SubmitForm from './elements/SubmitForm';
import { doBackendPost, ENDPOINT_USERSETDATA, ENDPOINT_USERDATA } from '../utils/backend';
import lookupMessage from '../utils/lang';

import "styles/radio_button.css";
import { UserPreferenceComponent, UserPreferenceComponent_submit_pref } from './elements/UserPreferenceComponent';

const mapStateToProps = state => ({
    user_token: state.user.token
});

const mapDispatchToProps = dispatch => ({
});

class UserProfilePage extends BasePage {
    constructor() {
        super("user_profile");

        this.state = {
            errorTextInfo: null,
            errorTextPassword: null,
            okTextInfo: null,
            okTextPassword: null,
            name: "",
            email: "",
            password1: "",
            password2: "",
            pref: ""
        };
    }

    componentWillMount() {
        var request = {
            token: this.props.user_token
        };

        doBackendPost(ENDPOINT_USERDATA, request, this)
        .then(function(result){
            this.setState({
                ...this.state,
                name: result.name,
                email: result.email,
                pref: result.pref
            });
        }.bind(this));
    }

    handle_change(event) {
        if (event.target.getAttribute("type") === "radio") {
            var add = {};
            add[event.target.getAttribute("field")] = event.target.getAttribute("p_method");
            
            this.setState({
                ...this.state,
                ...add
            });
        } else {
            var add = {};
            add[event.target.getAttribute("field")] = event.target.value;
            
            this.setState({
                ...this.state,
                ...add
            });
        }

        return event;
    }
    
    submit_info() {
        return new Promise(function(resolve, reject) {
			if (check_string_field(this.state.name) || check_string_field(this.state.email)) {
                resolve();
                
				return;
			}

			var dataRequest = {
                token: this.props.user_token,
				name: this.state["name"],
				email: this.state["email"]
            };
            
			doBackendPost(ENDPOINT_USERSETDATA, dataRequest, this)
			.then(function(result) {
				if (result == null) {
					this.setState({errorTextInfo: lookupMessage("SERVER_ERROR"), okTextInfo: null});
				} else {
					if (result.ok) {
						this.setState({okTextInfo: lookupMessage(result.message), errorTextInfo: null});
					} else {
						this.setState({errorTextInfo: lookupMessage(result.message), okTextInfo: null});
					}
				}

				resolve();
			}.bind(this));
		}.bind(this));
    }

    submit_password() {
        return new Promise(function(resolve, reject) {
			if (check_string_field(this.state.password1) || check_string_field(this.state.password2)) {
                resolve();
                
				return;
            }
            
            if (this.state.password1 != this.state.password2) {
                this.setState({errorTextPassword: lookupMessage("INPUT_DOESNT_MATCH")});

                resolve();
                
				return;
            }

			var dataRequest = {
                token: this.props.user_token,
				password: this.state["password1"],
            };
            
            this.setState({password1: null, password2: null});

			doBackendPost(ENDPOINT_USERSETDATA, dataRequest, this)
			.then(function(result) {
				if (result == null) {
					this.setState({errorTextPassword: lookupMessage("SERVER_ERROR"), okTextPassword: null});
				} else {
					if (result.ok) {
						this.setState({okTextPassword: lookupMessage(result.message), errorTextPassword: null});
					} else {
						this.setState({errorTextPassword: lookupMessage(result.message), okTextPassword: null});
					}
				}

				resolve();
			}.bind(this));
		}.bind(this));
    }

    renderContent() {
        return <div>
            <div style={{backgroundColor: '#efefef', marginLeft: 'auto', marginRight: 'auto', marginTop: '40px', width: '700px' }}>
				<div style={{padding: '10px'}}>
					<p className="pageTitle">Profil</p>
                    <div>
                        <UserPreferenceComponent state={this.state} submit={UserPreferenceComponent_submit_pref.bind(this)} handle_change={this.handle_change.bind(this)}  />
                    </div>
					<div>
                        <div className="table">
                            <hr/>
                            <p className="pageSubTitle">Adatmódosítás</p>
                            <div className="centerText">
                                <a className="errorText">{this.state.errorTextInfo}</a>
                                <a className="okText">{this.state.okTextInfo}</a>
                            </div>
                            <SubmitForm submitText="Módosít" onSubmit={this.submit_info.bind(this)}>
                                <input className="inputForm inputFormSpacing" type='text' placeholder="Név" required={true} 
                                    field="name" onChange={this.handle_change.bind(this)} value={this.state["name"]} />
                                <input className="inputForm inputFormSpacing" type='text' placeholder="Email" required={true} 
                                    field="email" onChange={this.handle_change.bind(this)} value={this.state["email"]} />
                            </SubmitForm>
                        </div>
                    </div>
                    <div>
                        <div className="table">
                            <hr/>
                            <p className="pageSubTitle">Jelszó módosítás</p>
                            <div className="centerText">
                                <a className="errorText">{this.state.errorTextPassword}</a>
                                <a className="okText">{this.state.okTextPassword}</a>
                            </div>
                            <SubmitForm submitText="Módosít" onSubmit={this.submit_password.bind(this)}>
                                <input className="inputForm inputFormSpacing" type='password' placeholder="Jelszó" required={true} 
                                    field="password1" onChange={this.handle_change.bind(this)} value={this.state["password1"]} />
                                <input className="inputForm inputFormSpacing" type='password' placeholder="Jelszó újra" required={true} 
                                    field="password2" onChange={this.handle_change.bind(this)} value={this.state["password2"]} />
                            </SubmitForm>
                        </div>
                    </div>
				</div>
			</div>
        </div>;
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(UserProfilePage);