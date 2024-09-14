import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Text, View } from 'react-native'
import DeviceInfo from 'react-native-device-info'

class About extends Component {

  renderBody = (props,state) => {

    return <View style={{ paddingTop: 40, padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: 700}}>Observator NEP-LINK</Text>
      <Text style={{ fontSize: 16, fontWeight: 400}}>{`Version ${DeviceInfo.getVersion()} (${DeviceInfo.getBuildNumber()})`}</Text>
    </View>
  }

  render() {
    return this.renderBody(this.props,this.state)
  }

}

export default About
