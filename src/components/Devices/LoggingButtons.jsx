import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Text, View } from 'react-native'
import { Button } from '@rneui/themed'

class LoggingButtons extends Component {

  renderButton = (props) => {
    if (props.isLogging) {
      return <>
        <Button color="warning" onPress={props.stopLoggingHandler.bind(this)}>Stop Logging</Button>
        <View style={{ backgroundColor: "#0296b0", marginLeft: 20, padding: 8, borderRadius: 5 }}>
          <Text style={{ color: "#FFF" }}>{props.loggingSessionSampleCount} readings</Text>
        </View>
      </>
    }
    return <>
      <Button onPress={props.startLoggingHandler.bind(this)}>Start Logging</Button>
    </>
  }

  renderBody = (props,state) => {
    return <View style={{ padding: 20, paddingBottom: 30, width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
      {this.renderButton(props)}
    </View>
  }

  render() {
    return this.renderBody(this.props,this.state)
  }

}

export default LoggingButtons
