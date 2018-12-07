import React, { Component } from 'react';

import arrowDown from "images/arrow_down.png";
import arrowUp from "images/arrow_up.png";

class CollapseDiv extends Component {
    constructor(props) {
        super(props);

        this.state = {
            display: (props.display != null ? props.display : true)
        };
    }

    toogle_display() {
        this.setState({display: !this.state.display});
    }

    render() {
        return <div>
            <div style={{cursor: "pointer", paddingBottom: "10px"}} onClick={this.toogle_display.bind(this)}>
                <img src={this.state.display ? arrowDown : arrowUp} className="inlineCenter" style={{paddingRight: "10px"}} />
                <a className="pageSubTitleLeft inlineCenter">{this.props.title}</a>
            </div>
            <div style={{width: "95%", marginLeft: "auto", marginRight: "auto"}}>
                {
                    this.state.display ?
                    this.props.children :
                    null
                }
            </div>
        </div>;
    }
};

export default CollapseDiv;