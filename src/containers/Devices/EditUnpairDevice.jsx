// import React, { Component } from 'react'
// import PropTypes from 'prop-types'
// import { SafeAreaView, ScrollView, View, Dimensions, Text } from 'react-native'

// // import RNBluetoothClassic, { BluetoothDevice } from 'react-native-bluetooth-classic'
// import { connect } from 'react-redux'
// import { saveDeviceName } from '../../actions/DeviceActions'

// import EditDeviceNameForm from '../../components/Devices/EditDeviceNameForm'

// class EditUnpairDevice extends Component {

//   constructor(props) {
//     super(props)
//     this.state = {
//       deviceId: '',
//       deviceName: '',
//     }
//   }

//   componentDidMount() {
//     this.setState({
//       deviceId: this.props.route.params?.deviceId,
//       deviceName: this.props.route.params?.deviceName,
//     })
//     const { navigation } = this.props
//     this._navigationBeforeRemoveUnsubscribe = navigation.addListener("beforeRemove", (e) => {
//       const { deviceId, deviceName } = this.state
//       this.props.dispatch(saveDeviceName(deviceId,deviceName))
//     })
//   }

//   componentDidUpdate() {
//   }

//   componentWillUnmount() {
//     this._navigationBeforeRemoveUnsubscribe()
//   }

//   deviceNameOnChange = (newValue) => {
//     this.setState({ deviceName: newValue })
//   }

//   renderBody = (props,state) => {
//     return <SafeAreaView>
//       <ScrollView>
//         <EditDeviceNameForm
//           deviceName={this.state.deviceName}
//           deviceNameOnChangeHandler={this.deviceNameOnChange}
//         />
//       </ScrollView>
//     </SafeAreaView>
//   }

//   render() {
//     return this.renderBody(this.props,this.state)
//   }

// }

// export default connect(({ devices }) => ({ devices }))(EditUnpairDevice)

import React, {useEffect, useState, useCallback} from 'react';
import {SafeAreaView, ScrollView} from 'react-native';
import {connect} from 'react-redux';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';

import {saveDeviceName} from '../../actions/DeviceActions';
import EditDeviceNameForm from '../../components/Devices/EditDeviceNameForm';

const EditUnpairDevice = ({dispatch}) => {
  const navigation = useNavigation();
  const route = useRoute();
  const [deviceId, setDeviceId] = useState('');
  const [deviceName, setDeviceName] = useState('');

  // Extract params on mount
  useEffect(() => {
    const id = route.params?.deviceId || '';
    const name = route.params?.deviceName || '';
    setDeviceId(id);
    setDeviceName(name);
  }, [route.params]);

  // Save device name on back navigation
  useFocusEffect(
    useCallback(() => {
      const beforeRemove = e => {
        dispatch(saveDeviceName(deviceId, deviceName));
      };

      const unsubscribe = navigation.addListener('beforeRemove', beforeRemove);
      return unsubscribe;
    }, [deviceId, deviceName, dispatch, navigation]),
  );

  const deviceNameOnChange = newValue => {
    setDeviceName(newValue);
  };

  return (
    <SafeAreaView>
      <ScrollView>
        <EditDeviceNameForm
          deviceName={deviceName}
          deviceNameOnChangeHandler={deviceNameOnChange}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default connect(({devices}) => ({devices}))(EditUnpairDevice);
