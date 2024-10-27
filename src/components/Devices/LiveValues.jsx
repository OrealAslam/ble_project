import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Text, View, TouchableOpacity } from 'react-native'

class LiveValues extends Component {

  turbidityView = (turbidityEnabled,temperatureEnabled,turbidityValue) => {

    if (!turbidityEnabled) return null

    const marginRight = temperatureEnabled ? 5 : 0
    const fontSize = temperatureEnabled ? 24 : 40

    return <View style={{ padding: 20, backgroundColor: 'rgb(19,113,255)', flex: 1, marginRight, height: 120, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize, fontWeight: 600, color: "#FFF", textAlign: "center" }}>{!isNaN(turbidityValue) ? `${turbidityValue.toFixed(2)} NTU` : ''}</Text>
    </View>

  }

  temperatureView = (temperatureEnabled,turbidityEnabled,temperatureValue) => {



    if (!temperatureEnabled) return null

    const marginLeft = turbidityEnabled ? 5 : 0
    const fontSize = turbidityEnabled ? 24 : 40

    return <View style={{ padding: 20, backgroundColor: 'rgb(255,140,0)', flex: 1, marginLeft, height: 120, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize, fontWeight: 600, color: "#FFF", textAlign: "center"}}>{!isNaN(temperatureValue) ? `${temperatureValue.toFixed(1)}°C` : ''}</Text>
    </View>

  }

  renderBody = (props,state) => {

    const { turbidityEnabled, temperatureEnabled, turbidityValue, temperatureValue } = props

    return <View style={{ padding: 20, paddingBottom: 10, width: '100%', display: 'flex', flexDirection: 'row' }} >
      {this.turbidityView(turbidityEnabled,temperatureEnabled,turbidityValue)}
      {this.temperatureView(temperatureEnabled,turbidityEnabled,temperatureValue)}
    </View>
  }

  render() {
    return this.renderBody(this.props,this.state)
  }

}

export default LiveValues
