import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Text} from 'react-native';
import {Dialog} from '@rneui/themed';

class TakePhotoDialog extends Component {
  renderBody = (props, state) => {
    return (
      <Dialog
        isVisible={props.visible}
        onBackdropPress={props.closeDialog.bind(this)}>
        <Dialog.Title
          title="Take Photo"
          titleStyle={{fontSize: 20, color: '#000'}}
        />
        <Text style={{fontSize: 16, color: '#000'}}>
          Would you like to take a photo?
        </Text>
        <Dialog.Actions>
          <Dialog.Button title="Yes" onPress={props.launchCamera.bind(this)} />
          <Dialog.Button title="No" onPress={props.closeDialog.bind(this)} />
        </Dialog.Actions>
      </Dialog>
    );
  };

  render() {
    return this.renderBody(this.props, this.state);
  }
}

export default TakePhotoDialog;
