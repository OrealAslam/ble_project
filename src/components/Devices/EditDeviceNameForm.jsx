import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Text, View, TouchableOpacity } from 'react-native'
import { Input } from '@rneui/themed'

class EditDeviceNameForm extends Component {

  renderBody = (props,state) => {
    return  <View style={{ margin: 20, display: 'flex', flexDirection: 'column', flex: 1, width: '100%' }} >
      <View>
        <Text style={{ fontSize: 14, margin: 10 }}>Edit Device Name...</Text>
        <Input
          style={{ fontSize: 16, borderWidth: 0, borderColor: "#CCC" }}
          placeholder="Device name"
          inputStyle={{ height: 20, backgroundColor: "#EEE" }}
          value={props.deviceName}
          onChangeText={props.deviceNameOnChangeHandler}
        />
      </View>
    </View>
  }

  render() {
    return this.renderBody(this.props,this.state)
  }

}

export default EditDeviceNameForm
