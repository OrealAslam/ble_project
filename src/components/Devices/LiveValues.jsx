import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Text, View, TouchableOpacity, Dimensions } from 'react-native'

const fontSizeHash = {
  singleView: {
    largeScreen: 60,
    mediumScreen: 50,
    smallScreen: 40,
  },
  dualView: {
    largeScreen: 50,
    mediumScreen: 40,
    smallScreen: 30,
  },
}

const getScreenSizeKey = () => {

  const screenWidth = Dimensions.get('window').width

  if (screenWidth >= 800) return 'largeScreen'
  if (screenWidth >= 500) return 'mediumScreen'
  return 'smallScreen'

}

class LiveValues extends Component {

  turbidityView = (turbidityEnabled,temperatureEnabled,turbidityValue) => {

    const viewKey = temperatureEnabled ? 'dualView' : 'singleView'
    const screenSizeKey = getScreenSizeKey()
    const fontSize = fontSizeHash[viewKey][screenSizeKey]
    const marginRight = temperatureEnabled ? 5 : 0

    return <View style={{ padding: 20, backgroundColor: 'rgb(19,113,255)', flex: 1, marginRight, height: 220, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize, fontWeight: 600, color: "#FFF", textAlign: "center" }}>{!isNaN(turbidityValue) ? `${turbidityValue.toFixed(2)} NTU` : ''}</Text>
    </View>

  }

  temperatureView = (temperatureEnabled,turbidityEnabled,temperatureValue) => {

    if (!temperatureEnabled) return null

    const viewKey = temperatureEnabled ? 'dualView' : 'singleView'
    const screenSizeKey = getScreenSizeKey()
    const fontSize = fontSizeHash[viewKey][screenSizeKey]
    const marginLeft = 5

    return <View style={{ padding: 20, backgroundColor: 'rgb(255,140,0)', flex: 1, marginLeft, height: 220, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
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
