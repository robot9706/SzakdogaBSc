import React, { Component } from 'react';
import BasePage from "./BasePage"
import { connect } from "react-redux";

import { check_string_field } from '../utils/utils';
import SubmitForm from './elements/SubmitForm';
import { doBackendPost, ENDPOINT_USERTXDASH, ENDPOINT_USERMONEYMOVE, ENDPOINT_USERTXHISTORY } from '../utils/backend';
import lookupMessage from '../utils/lang';

import Loader from 'react-loader-spinner'

import arrowLeft from "images/arrow_left.png";
import arrowRight from "images/arrow_right.png";
import arrowLeftBig from "images/arrow_left_big.png";
import arrowRightBig from "images/arrow_right_big.png";

import CollapseDiv from "components/elements/CollapseDiv.js";

import "styles/radio_button.css";
import "styles/finance_table.css";

const mapStateToProps = state => ({
    user_token: state.user.token,
    user_balance: state.user.balance
});

const mapDispatchToProps = dispatch => ({
});

class UserFinancePage extends BasePage {
    constructor() {
        super("user_finance");

        this.state = {
            tx_all: 0,
            tx_history: null,
            tx_page: 0,

            moneyIn_amount: 0,
            moneyIn_method: "METHOD_PAYPAL",

            moneyOut_amount: 0,
            moneyOut_method: "METHOD_PAYPAL",
        };
    }

    componentWillMount() {
        var request = {
            token: this.props.user_token
        };

        doBackendPost(ENDPOINT_USERTXDASH, request, this)
        .then(function(result){
            if (result.ok) {
                this.setState({
                    ...this.state,
                    tx_all: result.tx_pages,
                    tx_history: result.page0
                });
            }
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

    get_history(page) {
        var request = {
            token: this.props.user_token,
            page: page
        };

        doBackendPost(ENDPOINT_USERTXHISTORY, request, this)
        .then(function(result){
            if (result.ok) {
                this.setState({
                    ...this.state,
                    tx_all: result.tx_pages,
                    tx_history: result.page
                });
            }
        }.bind(this));
    }

    submit_addmoney() {
        return new Promise(function(resolve, reject){
            var request = {
                token: this.props.user_token,
                amount: parseInt(this.state.moneyIn_amount),
                in: true,
                method: this.state.moneyIn_method
            };

            doBackendPost(ENDPOINT_USERMONEYMOVE, request)
            .then(function(result){
                if (result.ok) {
                    this.get_history(this.state.tx_page);
                }

                resolve();
            }.bind(this))
            .catch(reject);
        }.bind(this));
    }

    submit_getmoney() {
        return new Promise(function(resolve, reject){
            var request = {
                token: this.props.user_token,
                amount: parseInt(this.state.moneyOut_amount),
                in: false,
                method: this.state.moneyOut_method
            };

            doBackendPost(ENDPOINT_USERMONEYMOVE, request)
            .then(function(result){
                if (result.ok) {
                    this.get_history(this.state.tx_page);
                }

                resolve();
            }.bind(this))
            .catch(reject);
        }.bind(this));
    }

    tx_history_set_page(page){
        this.setState({
            ...this.state,
            tx_page: page,
            tx_history: null
        });

        this.get_history(page);
    }

    tx_history_page_change(event) {
        var index = parseInt(event.target.value) - 1;

        if (index < 0) {
            index = 0;
        }
        if (index > this.state.tx_all - 1) {
            index = this.state.tx_all - 1;
        }

        this.tx_history_set_page(index);
    }

    tx_history_backward() {
        var prevPage = this.state.tx_page - 1;
        if (prevPage < 0) {
            return;
        }

        this.tx_history_set_page(prevPage);
    }

    tx_history_forward() {
        var nextPage = this.state.tx_page + 1;
        if (nextPage > this.state.tx_all - 1) {
            return;
        }

        this.tx_history_set_page(nextPage);
    }

    renderHistoryList() {
        var history = this.state.tx_history;
        if (history == null) {
            var loader = <tr>
                <td colSpan="5" style={{textAlign: "center"}}>
                    <Loader type="ThreeDots" color="#276EF1" height={80} width={80} />
                </td>
            </tr>

            return loader;
        }

        const formatDate = (date) => {
            const formatNum = (num) => {
                if (num < 10) {
                    return "0" + num;
                }
                return num;
            };

            return date.getFullYear() + "." + formatNum(date.getMonth()) + "." + formatNum(date.getDate()) + ". " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
        };

        const formatInfo = (info) => {
            switch(info.type){
                case "USER_TX":
                    return <a>Tranzakció felhasználóval: "{info.otherUser[0].name}"</a>;
                case "EXTERNAL_IN":
                    return <a>Pénz befizetés: {lookupMessage(info.source)}</a>;
                case "EXTERNAL_OUT":
                    return <a>Pénz kivétel: {lookupMessage(info.source)}</a>;
            }

            return <a>?</a>;
        };

        var elements = [];

        for (var x = 0;x<history.length;x++){
            var line = history[x];

            var moneyIn = (line.diff > 0);

            var element = <tr key={x}>
                <td>
                    <img className="inlineCenter" src={moneyIn ? arrowRight : arrowLeft} />
                    <a className="inlineCenter">{moneyIn ? "Be" : "Ki"}</a>
                </td> 
                <td style={{textAlign: "right"}}>{line.diff}Ft</td>
                <td style={{textAlign: "right"}}>{line.balance}Ft</td>
                <td>{formatDate(new Date(line.date))}</td>
                <td>{formatInfo(line.info)}</td>
            </tr>;

            elements.push(element);
        }

        return elements;
    }

    renderContent() {
        var historyList = this.renderHistoryList();

        return <div>
            <div style={{backgroundColor: '#efefef', marginLeft: 'auto', marginRight: 'auto', marginTop: '40px', width: '1000px' }}>
				<div style={{padding: "10px 30px"}}>
					<p className="pageTitleLeft">Egyenleg: {this.props.user_balance}Ft</p>
					<hr/>
                    <div>
                        <div style={{width: "95%", marginLeft: "auto", marginRight: "auto"}}>
                            <CollapseDiv title="Pénz feltöltés" display={false}>
                                <SubmitForm submitText="Feltölt" onSubmit={this.submit_addmoney.bind(this)}>
                                    <label className="container">PayPal
                                        <input type="radio" name="method_in" required={true} field="moneyIn_method" p_method="METHOD_PAYPAL" onChange={this.handle_change.bind(this)} />
                                        <span className="checkmark"></span>
                                    </label>
                                    <label className="container">Banki átutalás
                                        <input type="radio" name="method_in" field="moneyIn_method" p_method="METHOD_WIRE" onChange={this.handle_change.bind(this)} />
                                        <span className="checkmark"></span>
                                    </label>
                                    <input className="inputForm" type="text" placeholder="1000 Ft" required={true} field="moneyIn_amount" onChange={this.handle_change.bind(this)} />
                                </SubmitForm>
                            </CollapseDiv>
                        </div>
                        <hr />
                        <div style={{width: "95%", marginLeft: "auto", marginRight: "auto"}}>
                            <CollapseDiv title="Pénz kivétel" display={false}>
                                <SubmitForm submitText="Kivesz" onSubmit={this.submit_getmoney.bind(this)}>
                                    <label className="container">PayPal
                                        <input type="radio" name="method_out" required={true} field="moneyOut_method" p_method="METHOD_PAYPAL" onChange={this.handle_change.bind(this)} />
                                        <span className="checkmark"></span>
                                    </label>
                                    <label className="container">Banki átutalás
                                        <input type="radio" name="method_out" field="moneyOut_method" p_method="METHOD_WIRE" onChange={this.handle_change.bind(this)} />
                                        <span className="checkmark"></span>
                                    </label>
                                    <input className="inputForm" type="text" placeholder="1000 Ft" required={true} field="moneyOut_amount" onChange={this.handle_change.bind(this)} />
                                </SubmitForm>
                            </CollapseDiv>
                        </div>
                        <hr />
                        <div style={{width: "95%", marginLeft: "auto", marginRight: "auto"}}>
                            <p className="pageSubTitleLeft">Mozgások</p>
                            <table className="finance_table">
                                <tr>
                                    <th>Mozgás</th>
                                    <th>Különbség</th>
                                    <th>Egyenleg</th>
                                    <th>Dátum</th>
                                    <th>Infó</th>
                                </tr>
                                { historyList }
                            </table>
                            <div style={{width: "100%", paddingTop: "10px"}}>
                                <div style={{display: "flex", alignItems: "center", justifyContent: "center"}}>
                                    <div style={{display: "inline-block"}}>
                                        <img className="inlineCenter" src={arrowLeftBig} style={{cursor: "pointer"}} onClick={this.tx_history_backward.bind(this)} />
                                        <input type="number" className="inlineCenter inputForm" style={{width: "4em"}} value={this.state.tx_page+1} onChange={this.tx_history_page_change.bind(this)} min="1" max={this.state.tx_all} />
                                        <a className="inlineCenter">/{this.state.tx_all}</a>
                                        <img className="inlineCenter" src={arrowRightBig} style={{cursor: "pointer"}} onClick={this.tx_history_forward.bind(this)} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
				</div>
			</div>
        </div>;
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(UserFinancePage);