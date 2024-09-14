import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { View, Text } from 'react-native'
import { Dialog, Input } from '@rneui/themed'

class LoggingSessionCommentDialog extends Component {

  renderBody = (props,state) => {
    return  <Dialog>
      <View style={{ display: 'flex', alignItems: 'center' }}>
        <Text style={{ marginBottom: 10 }}>Please enter a comment for the session...</Text>
        <Input
          style={{ fontSize: 14, borderWidth: 0, borderColor: "#CCC" }}
          placeholder="Enter comment..."
          multiline
          inputStyle={{ height: 80, backgroundColor: "#EEE" }}
          textAlignVertical={'top'}
          value={props.commentValue}
          onChangeText={props.commentOnChangeTextHandler}
        />
        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', width: "100%" }}>
          <Dialog.Button
            title="Cancel"
            onPress={props.cancelButtonHandler.bind(this)}
          />
          <Dialog.Button
            title="OK"
            onPress={props.okButtonHandler.bind(this)}
          />
        </View>
      </View>
    </Dialog>
  }

  render() {
    return this.renderBody(this.props,this.state)
  }

}

export default LoggingSessionCommentDialog
