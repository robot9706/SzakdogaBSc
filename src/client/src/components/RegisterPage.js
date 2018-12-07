import React, { Component } from 'react';
import BasePage from "./BasePage"
import { connect } from "react-redux";

import { check_string_field } from '../utils/utils';
import { doBackendPost, ENDPOINT_USERREGISTER } from '../utils/backend';
import SubmitForm from './elements/SubmitForm';
import lookupMessage from '../utils/lang';

class RegisterPage extends BasePage {
    constructor() {
		super("register");
		
		this.state = {
			errorText: null,
			name: null,
			username: null,
			password: null,
			email: null
		};
    }
	
	handle_change(event) {
		var add = {};
		add[event.target.getAttribute("field")] = event.target.value;
		
		this.setState({
			...this.state,
			...add
		});
	}
	
	do_register() {
		return new Promise(function(resolve, reject) {
			if (check_string_field(this.state.username) || check_string_field(this.state.password) || check_string_field(this.state.email) || check_string_field(this.state.name)) {
				resolve();

				return;
			}

			let registerRequest = {
				username: this.state["username"],
				password: this.state["password"],
				email: this.state["email"],
				name: this.state["name"]
			};
	
			doBackendPost(ENDPOINT_USERREGISTER, registerRequest, this)
			.then(function(result){
				if (result == null) {
					this.setState({errorText: lookupMessage("SERVER_ERROR")});
				} else {
					if (result.ok) {
						this.props.history.push("/user/login");
					} else {
						this.setState({errorText: lookupMessage(result.message)});
					}
				}

				resolve();
			}.bind(this))
		}.bind(this));
	}

    renderContent() {
        return <div>
            <div style={{backgroundColor: '#efefef', marginLeft: 'auto', marginRight: 'auto', marginTop: '40px', width: '500px' }}>
				<div style={{padding: '10px'}}>
					<p className="pageTitle">Regisztráció</p>
					<div className="table">
						<div className="centerText">
							<a className="errorText">{this.state.errorText}</a>
						</div>
						<SubmitForm submitText="Regisztráció" onSubmit={this.do_register.bind(this)}>
							<input className="inputForm inputFormSpacing" type='text' placeholder='Név' required={true} field="name" onChange={this.handle_change.bind(this)} />
							<input className="inputForm inputFormSpacing" type='text' placeholder='Felhasználónév' required={true} field="username" onChange={this.handle_change.bind(this)} />
							<input className="inputForm inputFormSpacing" type='password' placeholder='Jelszó' required={true} field="password" onChange={this.handle_change.bind(this)} />
							<input className="inputForm inputFormSpacing" type='email' placeholder='Email cím' required={true} field="email" onChange={this.handle_change.bind(this)} />
						</SubmitForm>
					</div>
				</div>
			</div>
        </div>;
    }
}

export default connect()(RegisterPage);