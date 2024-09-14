import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { SafeAreaView, ScrollView, View, Dimensions, Text } from 'react-native'

// import RNBluetoothClassic, { BluetoothDevice } from 'react-native-bluetooth-classic'
import { connect } from 'react-redux'
import { saveDeviceName } from '../../actions/DeviceActions'

import EditDeviceNameForm from '../../components/Devices/EditDeviceNameForm'

class EditUnpairDevice extends Component {

  constructor(props) {
    super(props)
    this.state = {
      deviceId: '',
      deviceName: '',
    }
  }

  componentDidMount() {
    this.setState({
      deviceId: this.props.route.params?.deviceId,
      deviceName: this.props.route.params?.deviceName,
    })
    const { navigation } = this.props
    this._navigationBeforeRemoveUnsubscribe = navigation.addListener("beforeRemove", (e) => {
      const { deviceId, deviceName } = this.state
      this.props.dispatch(saveDeviceName(deviceId,deviceName))
    })
  }

  componentDidUpdate() {
  }

  componentWillUnmount() {
    this._navigationBeforeRemoveUnsubscribe()
  }

  deviceNameOnChange = (newValue) => {
    this.setState({ deviceName: newValue })
  }

  renderBody = (props,state) => {
    return <SafeAreaView>
      <ScrollView>
        <EditDeviceNameForm
          deviceName={this.state.deviceName}
          deviceNameOnChangeHandler={this.deviceNameOnChange}
        />
      </ScrollView>
    </SafeAreaView>
  }

  render() {
    return this.renderBody(this.props,this.state)
  }

}

export default connect(({ devices }) => ({ devices }))(EditUnpairDevice)
