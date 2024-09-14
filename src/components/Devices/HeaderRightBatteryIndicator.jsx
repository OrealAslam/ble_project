import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { View, Text, ActivityIndicator } from 'react-native'
import { Icon } from '@rneui/themed'

class HeaderRightBatteryIndicator extends Component {

  renderBody = (props,state) => {

    const { batteryCharging, batteryVoltage } = props

    if (!batteryVoltage) {
      return <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <ActivityIndicator size="small" color={"#FFF"} />
      </View>
    }

    let iconName
    if (batteryCharging) {
      iconName = 'battery-charging'
    } else if (batteryVoltage > 80) {
      iconName = 'battery-full'
    } else if (batteryVoltage > 20) {
      iconName = 'battery-half'
    } else {
      iconName = 'battery-dead'
    }

    return <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <Icon
          name={iconName}
          type='ionicon'
          color='#FFF'
        />
      <Text style={{color: '#FFF', fontSize: 12, lineHeight: 12 }}>{ batteryVoltage ? `${batteryVoltage}%` : ''}</Text>
    </View>

  }

  render() {
    return this.renderBody(this.props,this.state)
  }

}

export default HeaderRightBatteryIndicator
