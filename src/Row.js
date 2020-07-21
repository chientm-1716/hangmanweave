import React from 'react';
import { Row, Col } from 'reactstrap';
const RowRank = (props) => {
  return (
    <Row>
      <Col className='col-xs-1'>
        <h4 className='col-rank'>{props.rank}</h4>
      </Col>
      <Col className='col-xs-1 address-col'>
        <h4 className='col-item'>{props.address}</h4>
      </Col>
      <Col className='col-xs-1'>
        <h4 className='col-item'>{props.score}</h4>
      </Col>
    </Row>
  );
};

export default RowRank;
