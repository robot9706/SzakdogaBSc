import React, { Component } from 'react';
import BasePage from "./BasePage"

import iconDrive from "images/icon_drive.png";
import iconPayment from "images/icon_payment.png";

const RowComponent = ({ text, isTextLeft, icon }) => (
    <div className="panelRow">
        <div className={isTextLeft ? "panel panelLeft panel60" : "panel panelRight panel60"}>
			<div className="panelAlignText">
				<a className="panelFillText panelAlignTextMargin">{text}</a>
			</div>
        </div>
        <div className={isTextLeft ? "panel panelRight panel40" : "panel panelLeft panel40"} style={{ textAlign: "center" }}>
            <span style={{display: "inline-block", height: "100%", verticalAlign: "middle"}}></span>
            <img style={{verticalAlign: "middle"}} src={icon} />
        </div>
    </div>
);

class InfoDriverPage extends BasePage {
    constructor() {
        super("info_driver");
    }

    renderContent() {
        return <div>
            <RowComponent text="Önnek csak vezetnie kell, a többit bízza ránk!" isTextLeft={true} icon={iconDrive} />
            <RowComponent text="Pénzét bármikor kiveheti profiljából!" isTextLeft={false} icon={iconPayment} />
        </div>;
    }
}

export default InfoDriverPage;