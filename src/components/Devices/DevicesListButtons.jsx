import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { View } from 'react-native'
import { Button } from '@rneui/themed'

class DevicesListButtons extends Component {

  renderBody = (props,state) => {
    return <View style={{ padding: 10, paddingTop: 0, width: '100%' }} >
        <View style={{ padding: 10, marginTop: 50, width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center' }}>
          <Button size={'sm'} onPress={props.enterDemoModeButtonPressHandler.bind(this)}>Open Demo Mode...</Button>
        </View>
      </View>
  }

  render() {
    return this.renderBody(this.props,this.state)
  }

}

export default DevicesListButtons
