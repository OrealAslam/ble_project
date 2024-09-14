import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { View, Button } from 'react-native'

class HeaderRightAddDeviceButton extends Component {

  renderBody = (props,state) => <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
    <Button
      title="Add..."
      onPress={() => props.pressHandler.call(this)}
    />
  </View>

  render() {
    return this.renderBody(this.props,this.state)
  }

}

export default HeaderRightAddDeviceButton
