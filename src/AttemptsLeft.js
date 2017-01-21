import React, { Component, PropTypes } from 'react';

import './AttemptsLeft.css';

class AttemptsLeft extends Component {
  render() {
    return (
      <div className="AttemptsLeft">
        <span>Retries left: {this.props.attempts}</span>
      </div>
    );
  }
};

AttemptsLeft.propTypes = {
  attempts: PropTypes.number.isRequired,
};

export default AttemptsLeft;