import React, { Component } from 'react';
import BasePage from "./BasePage"
import { connect } from "react-redux";

import { check_string_field } from '../utils/utils';
import { doBackendPost, ENDPOINT_USERDATA } from '../utils/backend';
import SubmitForm from './elements/SubmitForm';
import lookupMessage from '../utils/lang';

import { UserPreferenceComponent, UserPreferenceComponent_submit_pref } from './elements/UserPreferenceComponent';

const mapStateToProps = state => ({
    user_token: state.user.token
});

const mapDispatchToProps = dispatch => ({
});

class UserDashboardPage extends BasePage {
    constructor() {
		super("home");
		
		this.state = {
			pref: "",
			user_pref: ""
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
				pref: result.pref,
				user_pref: result.pref
            });
        }.bind(this));
    }
	
	handle_change(event) {
        if (event.target.getAttribute("type") === "radio") {
            var add = {};
            add[event.target.getAttribute("field")] = event.target.getAttribute("p_method");
			
			console.log(add);

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

	submit_pref_config() {
		const basePromise = UserPreferenceComponent_submit_pref.bind(this);

		return basePromise()
		.then(function(result){
			this.setState({
				...this.state,
				user_pref: this.state.pref
			});
		}.bind(this));
	}

	renderPrefSelector() {
		return <div className="table">
			<p className="pageSubTitle">Üdvözöljük az oldalunkon! Kérem döntse el, hogy milyen típusú felhasználói profilt szeretne.</p>
			<UserPreferenceComponent state={this.state} submit={this.submit_pref_config.bind(this)} handle_change={this.handle_change.bind(this)} />;
		</div>;
	}

	redirect_driver() {
		this.props.history.push("/driver");
	}

	redirect_passenger() {
		this.props.history.push("/passenger");
	}

	renderDashboard() {
		var userPref = this.state.user_pref.split("|");
		return <>
			{
				userPref.includes("DRIVER") ?
				<div style={{width: "50%", display: (userPref.length > 1 ? "inline-block" : "inline")}}>
					<p className="pageSubTitle">Sofőr</p>
					<div className="centerText">
						<a>Bármikor és bárhol szolgálatba léphet az alábbi gomb megnyomásával.</a>
					</div>
					<div className="centerText" style={{paddingTop: "20px"}}>
						<input type="submit" className="button" value="Szolgálatba lépés" onClick={this.redirect_driver.bind(this)} />
					</div>
				</div>
				: null
			}
			{
				userPref.includes("PASSENGER") ?
				<div style={{width: "50%", display: (userPref.length > 1 ? "inline-block" : "inline")}}>
					<p className="pageSubTitle">Utas</p>
    	            <div className="centerText">
	                    <a>Bárhol és bármikor hívhat sofőrt az alábbi gomb megnyomásával.</a>
                	</div>	
					<div className="centerText" style={{paddingTop: "20px"}}>
						<input type="submit" className="button" value="Sofőr keresése" onClick={this.redirect_passenger.bind(this)} />
					</div>
				</div>
				: null
			}
		</>;
	}

    renderContent() {
        return <div>
            <div style={{backgroundColor: '#efefef', marginLeft: 'auto', marginRight: 'auto', marginTop: '40px', width: '750px' }}>
				<div style={{padding: '10px', paddingBottom: "20px"}}>
					{
						(this.state.user_pref != null && this.state.user_pref.length > 0) ?
						this.renderDashboard() :
						this.renderPrefSelector()
					}
				</div>
			</div>
        </div>;
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(UserDashboardPage);