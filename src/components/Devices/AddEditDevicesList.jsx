import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Text, View, TouchableOpacity} from 'react-native';
import {Icon} from '@rneui/themed';

class AddEditDevicesList extends Component {
  renderDevicesList = (bondedDevices, onPress) => {
    console.log('JJJ bondedDevices', bondedDevices);
    return bondedDevices.map(({id, name, address, inRange, isConnected}) => {
      return (
        <TouchableOpacity
          onPress={onPress.bind(this, id, name)}
          key={name.toString()}>
          <View
            style={{
              borderBottomWidth: 1,
              borderColor: '#CCC',
              display: 'flex',
              flexDirection: 'row',
            }}>
            <View style={{margin: 10, flex: 1}}>
              <Text style={{fontSize: 20, color: '#000'}}>{name}</Text>
            </View>
            <View
              style={{
                margin: 5,
                width: 40,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}>
              <Icon name="chevron-forward" type="ionicon" color="#000" />
            </View>
          </View>
        </TouchableOpacity>
      );
    });
  };

  renderBody = (props, state) => {
    return (
      <View
        style={{
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          width: '100%',
        }}>
        {this.renderDevicesList(
          props.bondedDevices,
          props.deviceOnPressHandler,
        )}
      </View>
    );
  };

  render() {
    return this.renderBody(this.props, this.state);
  }
}

export default AddEditDevicesList;
