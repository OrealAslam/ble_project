import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {View, Text, ActivityIndicator} from 'react-native';
import {Icon} from '@rneui/themed';

class HeaderRightBatteryIndicator extends Component {
  renderBody = (props, state) => {
    const {batteryCharging, batteryLevel, batteryRawVoltage} = props;

    console.log('XXX batteryLevel', batteryLevel);
    console.log('XXX batteryRawVoltage', batteryRawVoltage);

    if (batteryLevel === undefined) {
      return (
        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
          <ActivityIndicator size="small" color={'#FFF'} />
        </View>
      );
    }

    let iconName;
    let batteryLevelColor = '#000';
    if (batteryCharging) {
      iconName = 'battery-charging';
    } else if (batteryLevel > 80) {
      iconName = 'battery-full';
    } else if (batteryLevel > 20) {
      iconName = 'battery-half';
    } else {
      iconName = 'battery-dead';
      //batteryLevelColor = '#c4041e'
      batteryLevelColor = '#FFF';
    }

    let formattedBatteryLevel = parseInt(batteryLevel);
    if (formattedBatteryLevel > 100) {
      formattedBatteryLevel = 100;
    } else if (formattedBatteryLevel < 0) {
      formattedBatteryLevel = 0;
    }

    return (
      <View
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
        <Icon name={iconName} type="ionicon" color={batteryLevelColor} />
        {/*<Text style={{color: batteryLevelColor, fontSize: 12, lineHeight: 12 }}>{ !isNaN(batteryLevel) ? `${batteryLevel}%` : ''}</Text>*/}
        <Text style={{color: batteryLevelColor, fontSize: 12, lineHeight: 12}}>
          {!isNaN(formattedBatteryLevel) ? `${formattedBatteryLevel}%` : ''}
        </Text>
      </View>
    );
  };

  render() {
    return this.renderBody(this.props, this.state);
  }
}

export default HeaderRightBatteryIndicator;
