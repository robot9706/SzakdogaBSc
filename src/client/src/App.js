import React, { Component } from 'react';
import { BrowserRouter, Route, Switch, Link, Redirect } from "react-router-dom";

import { Provider } from 'react-redux'
import { createReduxStore } from "./redux/redux";

import "./styles/index.css";

import { default as LandingPage } from "./components/LandingPage.js";
import { default as InfoPassengerPage } from "./components/InfoPassengerPage.js";
import { default as InfoDriverPage } from "./components/InfoDriverPage.js";
import { default as LoginPage } from "./components/LoginPage.js";
import { default as RegisterPage } from "./components/RegisterPage.js";
import UserProfilePage from './components/UserProfilePage';
import UserFinancePage from './components/UserFinancePage';
import UserDashboardPage from './components/UserDashboardPage';
import DriverDashboardPage from './components/DriverDashboardPage';
import PassengerDashboardPage from './components/PassengerDashboardPage';

import { createMuiTheme, MuiThemeProvider } from "@material-ui/core/styles";
import { withStyles } from '@material-ui/core/styles';
import blue from '@material-ui/core/colors/blue';

const appTheme = createMuiTheme({
  palette: {
    primary: blue
  }
});

const NoMatch = function(location) {
  return <Redirect to="/" />
};

export const store = createReduxStore();

class App extends Component {
  render(){
        return <Provider store={store}>
          <MuiThemeProvider theme={appTheme}>
            <BrowserRouter basename="/">
              <Switch>
                <Route exact path={"/"} component={LandingPage} />
                <Route exact path={"/info/passenger"} component={InfoPassengerPage} />
                <Route exact path={"/info/driver"} component={InfoDriverPage} />
                <Route exact path={"/user/login"} component={LoginPage} />
                <Route exact path={"/user/register"} component={RegisterPage} />
                <Route exact path={"/user/profile"} component={UserProfilePage} />
                <Route exact path={"/user/finance"} component={UserFinancePage} />
                <Route exact path={"/user/dashboard"} component={UserDashboardPage} />
                <Route exact path={"/driver"} component={DriverDashboardPage} />
                <Route exact path={"/passenger"} component={PassengerDashboardPage} />
                <Route exact component={NoMatch} />
              </Switch>
          </BrowserRouter>
        </MuiThemeProvider>
      </Provider>;
    }

}

export default withStyles({ withTheme: true })(App);
