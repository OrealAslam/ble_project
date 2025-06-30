import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {View, Text} from 'react-native';

class DataAverages extends Component {
  renderAverages = props => {
    return (
      <View style={{borderWidth: 0}}>
        <View
          style={{
            padding: 16,
            margin: 10,
            marginTop: 20,
            backgroundColor: 'rgb(19,113,255)',
          }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: '#000',
              textAlign: 'center',
            }}>
            Average Turbidity Value: {props.turbidityAverage} NTU
          </Text>
        </View>
      </View>
    );
  };

  renderBody = (props, state) => {
    return this.renderAverages(props);
  };

  render() {
    return this.renderBody(this.props, this.state);
  }
}

export default DataAverages;
