import React, { Component } from 'react';

import PropTypes from 'prop-types';
import Loader from 'react-loader-spinner'

class SubmitForm extends Component {
    submitCallback;
    unmounted;

    constructor(props) {
        super(props);

        this.unmounted = false;

        this.submitCallback = props.onSubmit;

        this.state = {
            isLoading: false
        };
    }

    componentWillUnmount() {
        this.unmounted = true;
    }

    form_submit(e) {
        e.preventDefault();

        this.setState({isLoading: true});

        const setState = this.setState.bind(this);

        this.submitCallback().then(function(ret) {
            if (!this.unmounted) {
                setState({isLoading: false});
            }
        }.bind(this))
        .catch(function(ex){
            console.error(ex);
        });

		return false;
	}

    render() {
        let button = (this.state.isLoading ? 
            <Loader type="ThreeDots" color="#276EF1" height={80} width={80} /> : 
            <input type="submit" className="button" value={this.props.submitText} />);

		return <form onSubmit={this.form_submit.bind(this)}>
            {this.props.children}
            
            <div className="centerText">
                {button}
            </div>
        </form>;
    }
}

export default SubmitForm;

SubmitForm.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    submitText: PropTypes.string.isRequired
};
