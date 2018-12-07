import React, { Component } from 'react';
import BasePage from "./BasePage"

import iconRoad from "images/icon_road.png";
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

class InfoPassengerPage extends BasePage {
    constructor() {
        super("info_passenger");
    }

    renderContent() {
        return <div>
            <RowComponent text="Határozza meg útícélját, válasszon söffőrt és utazzon! Pár kattintás az egész!" isTextLeft={true} icon={iconRoad} />
            <RowComponent text="Fizessen egyszerűen közvetlenül a profiljából!" isTextLeft={false} icon={iconPayment} />
        </div>;
    }
}

export default InfoPassengerPage;