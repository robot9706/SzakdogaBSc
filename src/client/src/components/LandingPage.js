import React, { Component } from 'react';
import BasePage from "./BasePage"

import iconRoad from "images/icon_road.png";
import iconDrive from "images/icon_drive.png";

const RowTextAreaComponent = ({ text, link }) => (
    <>
        <div className="panelAlignText">
            <a className="panelHeaderText">{text}</a>
        </div>
        <div className="panelInfo">
            <a className="panelInfoText" href={link}>További információ...</a>
        </div>
    </>
);

const RowComponent = ({ text, isTextLeft, link, icon }) => (
    <div className="panelRow">
        <div className={isTextLeft ? "panel panelLeft panel60" : "panel panelRight panel60"}>
            <RowTextAreaComponent text={text} link={link} />
        </div>
        <div className={isTextLeft ? "panel panelRight panel40" : "panel panelLeft panel40"} style={{ textAlign: "center" }}>
            <span style={{display: "inline-block", height: "100%", verticalAlign: "middle"}}></span>
            <img style={{verticalAlign: "middle"}} src={icon} />
        </div>
    </div>
);

class LandingPage extends BasePage {
    constructor() {
        super("home");
    }

    renderContent() {
        return <div>
            <RowComponent text="Utazzon könnyedén, bárhol, bármikor pár kattintással!" isTextLeft={true} link="/info/passenger" icon={iconRoad} />
            <RowComponent text="Legyen sofőrünk és szabja meg saját munkaidejét!" isTextLeft={false} link="/info/driver" icon={iconDrive} />
        </div>;
    }
}

export default LandingPage;