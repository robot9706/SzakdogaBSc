import React, { Component } from 'react';
import { connect } from "react-redux";
import { BrowserRouter, Route, Switch, Link, Redirect } from "react-router-dom";

import ExitIcon from "images/icon_exit_to_app.png";

import "./HeaderMenu.css";
import { user_logout } from "redux/user.js";

const mapStateToProps = state => ({
	user_logged_in: state.user.user_logged_in,
	user_balance: state.user.balance,
	username: state.user.username,
});

const mapDispatchToProps = dispatch => ({
	user_logout: () => dispatch(user_logout())
});

const MenuEntry = ({ text, active, right, link }) => (
    <Link to={link} className={(active ? "active header_menu" : "header_menu")} style={{ float: (right ? 'right' : 'left') }}>{text}</Link>
);

class HeaderMenu extends Component {
	push_history;

	constructor(history) {
		super();

		this.push_history = history.props.push.bind(this);
	}

	do_logout_user() {
		this.push_history('/');
		this.props.user_logout();
	};

    render() {
		var loggedIn = this.props.user_logged_in;

		var headerRightComponent = null;

		if (loggedIn) {
			headerRightComponent = <>
				<a style={{float: "right", color: "#aaaaaa", padding: "14px 16px", cursor: "pointer"}} onClick={this.do_logout_user.bind(this)}>Kijelentkezés</a>
				<MenuEntry active={this.props.page === "user_profile"} right="true" text={this.props.username} link="/user/profile" />
				<MenuEntry active={this.props.page === "user_finance"} right="true" text={"Egyenleg: " + this.props.user_balance + "Ft"} link="/user/finance" />
			</>;
		} else {
			headerRightComponent = <>
				<MenuEntry active={this.props.page === "login"} right="true" text="Bejelentkezés" link="/user/login" />
				<MenuEntry active={this.props.page === "register"} right="true" text="Regisztráció" link="/user/register" />
			</>;
		}
		
        return <div className="header_menu_back">
			<div style={{ width: '60%', marginLeft: 'auto', marginRight: 'auto' }}>
				<MenuEntry active={this.props.page === "home"} text="Főldal" link={loggedIn ? "/user/dashboard" : "/"} />
				<MenuEntry active={this.props.page === "info_passenger"} text="Utasoknak" link="/info/passenger" />
				<MenuEntry active={this.props.page === "info_driver"} text="Sofőröknek" link="/info/driver" />

				{headerRightComponent}
			</div>
        </div>;
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(HeaderMenu);