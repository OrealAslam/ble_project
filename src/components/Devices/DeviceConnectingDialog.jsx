import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { View, Text } from 'react-native'
import { Dialog } from '@rneui/themed'

class DeviceConnectingDialog extends Component {

  renderBody = (props,state) => {
    if (props.visible && props.deviceStatus==='connecting') {
      return  <Dialog>
        <Dialog.Loading />
        <View style={{ display: 'flex', alignItems: 'center' }}>
          <Text >
            Connecting to {props.deviceLabel}...
          </Text>
        </View>
      </Dialog>
    } else if (props.visible && props.awaitingDevice) {
      return  <Dialog>
        <Dialog.Loading />
        <View style={{ display: 'flex', alignItems: 'center' }}>
          <Text >
            Waiting for device to be ready for connection...
          </Text>
        </View>
        <Dialog.Button
          title="Cancel"
          buttonStyle={{ marginTop: 20 }}
          onPress={props.cancelConnectToDeviceHandler.bind(this)}
        />
      </Dialog>
    } else if (props.visible && props.connectionAttemptStarted) {

      return  <Dialog>
        <View style={{ display: 'flex', alignItems: 'center' }}>
          <Text >
            Couldn't connect to {props.deviceLabel}.
          </Text>
        </View>
        <Dialog.Button
          title="Retry"
          buttonStyle={{ marginTop: 20 }}
          onPress={props.connectToDeviceHandler.bind(this,props.connectingDevice.id)}
        />
        <Dialog.Button
          title="Cancel"
          buttonStyle={{ marginTop: 20 }}
          onPress={props.cancelConnectToDeviceHandler.bind(this)}
        />
      </Dialog>

    }
  }

  render() {
    return this.renderBody(this.props,this.state)
  }

}

export default DeviceConnectingDialog
