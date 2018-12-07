import React, { Component } from 'react';

import HeaderMenu from "./header/HeaderMenu";

class BasePage extends Component {
    constructor(pageName) {
        super();

        this.pageName = pageName;
    }

    renderContent() {
        return <p>MissingContent</p>;
    }

    render() {
        return <div id="page">
            <div id="header">
                <HeaderMenu page={this.pageName} props={this.props.history}/>
            </div>
            <div id="page_content" style={{ width: '70%', marginLeft: 'auto', marginRight: 'auto' }}>
               
                    {this.renderContent()}
                
            </div>
        </div>;
    }
}

export default BasePage;