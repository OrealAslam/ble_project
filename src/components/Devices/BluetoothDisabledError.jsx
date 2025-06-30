import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Text, View} from 'react-native';
import {Icon} from '@rneui/themed';

class BluetoothDisabledError extends Component {
  renderBody = (props, state) => {
    let bluetoothStatusStr = '';
    let bluetoothAdviceStr = '';
    if (!props.bluetoothAvailable) {
      bluetoothStatusStr = 'Bluetooth is Unavailable';
      bluetoothAdviceStr =
        "Please check the phone's features to ensure Bluetooth is available.";
    } else if (!props.bluetoothEnabled) {
      bluetoothStatusStr = 'Bluetooth is Disabled';
      bluetoothAdviceStr =
        'Please check your settings and ensure Bluetooth is turned on.';
    } else if (!props.bluetoothPermissions) {
      bluetoothStatusStr = 'Bluetooth permissions are not enabled';
      bluetoothAdviceStr =
        'Please reload or reinstall the app and accept all Bluetooth permissions.';
    }

    return (
      <View
        style={{
          margin: 20,
          display: 'flex',
          flexDirection: 'row',
          borderWidth: 0,
        }}>
        <View style={{paddingTop: 20}}>
          <Icon name="warning" type="ionicon" color="#fc9803" size={60} />
        </View>
        <View style={{paddingLeft: 20, paddingTop: 20}}>
          <Text style={{fontSize: 18, fontWeight: 700, color: '#000'}}>
            {bluetoothStatusStr}
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontWeight: 300,
              color: '#000',
              borderWidth: 0,
            }}>
            {bluetoothAdviceStr}
          </Text>
        </View>
      </View>
    );
  };

  render() {
    return this.renderBody(this.props, this.state);
  }
}

export default BluetoothDisabledError;
