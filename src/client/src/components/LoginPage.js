import React, { Component } from 'react';
import BasePage from "./BasePage"
import { connect } from "react-redux";

import { check_string_field } from '../utils/utils';
import { doBackendPost, ENDPOINT_USERLOGIN } from '../utils/backend';
import SubmitForm from './elements/SubmitForm';
import { user_onlogin } from '../redux/user';
import lookupMessage from '../utils/lang';

const mapStateToProps = state => ({});

const mapDispatchToProps = dispatch => ({
	user_set_loggedin: (loginData) => dispatch(user_onlogin(loginData))
});

class LoginPage extends BasePage {
    constructor() {
		super("login");

		this.state = {
			errorText: null,
			username: null,
			password: null
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
	
	do_login() {
		return new Promise(function(resolve, reject) {
			if (check_string_field(this.state.username) || check_string_field(this.state.password)) {
				resolve();

				return;
			}

			let loginRequest = {
				username: this.state["username"],
				password: this.state["password"]
			};

			doBackendPost(ENDPOINT_USERLOGIN, loginRequest, this)
			.then(function(result) {
				if (result == null) {
					this.setState({errorText: lookupMessage("SERVER_ERROR")});
				} else {
					if (result.ok) {
						this.props.user_set_loggedin(result);

						this.props.history.push("/user/dashboard");
					} else {
						this.setState({errorText: lookupMessage(result.message)});
					}
				}

				resolve();
			}.bind(this));
		}.bind(this));
	}

    renderContent() {
        return <div>
            <div style={{backgroundColor: '#efefef', marginLeft: 'auto', marginRight: 'auto', marginTop: '40px', width: '500px' }}>
				<div style={{padding: '10px'}}>
					<p className="pageTitle">Bejelentkezés</p>
					<div className="table">
						<div className="centerText">
							<a className="errorText">{this.state.errorText}</a>
						</div>
						<SubmitForm submitText="Bejelentkezés" onSubmit={this.do_login.bind(this)}>
							<input className="inputForm inputFormSpacing" type='text' placeholder="Felhasználónév" required={true} field="username" onChange={this.handle_change.bind(this)} />
							<input className="inputForm inputFormSpacing" type='password' placeholder="Jelszó" required={true} field="password" onChange={this.handle_change.bind(this)} />
						</SubmitForm>
					</div>
				</div>
			</div>
        </div>;
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(LoginPage);