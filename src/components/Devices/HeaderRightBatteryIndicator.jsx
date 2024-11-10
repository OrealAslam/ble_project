import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { View, Text, ActivityIndicator } from 'react-native'
import { Icon } from '@rneui/themed'

class HeaderRightBatteryIndicator extends Component {

  renderBody = (props,state) => {

    const { batteryCharging, batteryLevel } = props

    console.log("XXX batteryLevel",batteryLevel)

    if (batteryLevel === undefined) {
      return <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <ActivityIndicator size="small" color={"#FFF"} />
      </View>
    }

    let iconName
    let batteryLevelColor = "#FFF"
    if (batteryCharging) {
      iconName = 'battery-charging'
    } else if (batteryLevel > 80) {
      iconName = 'battery-full'
    } else if (batteryLevel > 20) {
      iconName = 'battery-half'
    } else {
      iconName = 'battery-dead'
      //batteryLevelColor = '#c4041e'
      batteryLevelColor = '#FFF'
    }

    return <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <Icon
          name={iconName}
          type='ionicon'
          color={batteryLevelColor}
        />
      <Text style={{color: batteryLevelColor, fontSize: 12, lineHeight: 12 }}>{ !isNaN(batteryLevel) ? `${batteryLevel}%` : ''}</Text>
    </View>

  }

  render() {
    return this.renderBody(this.props,this.state)
  }

}

export default HeaderRightBatteryIndicator
