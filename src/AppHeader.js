import React, { Component } from 'react';
import './AppHeader.css';
import RowRank from './Row';
import { Row, Col } from 'reactstrap';
class AppHeader extends Component {
  render() {
    if (this.props.isLoggedIn) {
      return (
        <div className='App-header'>
          <p className='address'>Address: {this.props.address}</p>
          <div className='container leaderboard'>
            <div className='leadheader'>
              <h2>Leaderboard</h2>
            </div>
            <Row>
              <Col className='col-xs-1'>
                <h4 className='col-rank'>#</h4>
              </Col>
              <Col className='col-xs-1'>
                <h4 className='col-item'>Address</h4>
              </Col>
              <Col className='col-xs-1 time'>
                <h4 className='col-item'>Time spent</h4>
              </Col>
            </Row>
            {this.props.leaderboard.map((item, index) => (
              <RowRank rank={index + 1} score={item.value} key={index} address={item.player} />
            ))}
          </div>
        </div>
      );
    } else {
      return (
        <div className='App-header'>
          <div>
            <span className='login' onClick={this.props.login}>
              <h2>Login</h2>{' '}
            </span>
          </div>
        </div>
      );
    }
  }
}

export default AppHeader;
