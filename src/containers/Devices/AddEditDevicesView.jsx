import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {SafeAreaView, ScrollView} from 'react-native';

import {CommonActions} from '@react-navigation/native';
import {connect} from 'react-redux';

import AddEditDevicesList from '../../components/Devices/AddEditDevicesList';

import {addBondedDevice} from '../../actions/DeviceActions';

class AddEditDevicesView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      bluetoothEnabled: true,
      bondedDevicesRaw: [],
      bondedDevicesFormatted: [],
      devicesInRangeAddresses: [],
      unpairedDevices: [],
      pairDeviceDialogVisible: false,
      isPairing: false,
      pairingFailed: false,
    };
  }

  componentDidMount() {
    const {navigation} = this.props;

    navigation.setOptions({
      headerRight: () => (
        <HeaderRightAddDeviceButton
          pressHandler={this.addPairedDeviceButtonPress}
        />
      ),
    });
  }

  componentDidUpdate() {}

  componentWillUnmount() {}

  deviceListItemPress = (deviceId, deviceName) => {
    const routeToEditUnpairDevice = CommonActions.navigate({
      name: 'EditUnpairDevice',
      params: {
        deviceId,
        deviceName,
      },
    });
    this.props.navigation.dispatch(routeToEditUnpairDevice);
  };

  pairWithDevice = address => {
    const {devices} = this.props;
    const pairingWithDevice = devices.unpairedDevices.find(
      unpairedDevice => unpairedDevice.address === address,
    );
    this.setState({isPairing: true, pairingFailed: false, pairingWithDevice});
    RNBluetoothClassic.pairDevice(address)
      .then(device => {
        if (device.bonded) {
          this.setState({
            isPairing: false,
            pairDeviceDialogVisible: false,
            pairingFailed: false,
          });
          this.props.dispatch(addBondedDevice(pairingWithDevice));
        } else {
          this.setState({
            isPairing: false,
            pairDeviceDialogVisible: true,
            pairingFailed: true,
          });
        }
      })
      .catch(error => {
        console.log('XXX pairDevice.catch error', error);
        console.warn('XXX pairDevice.catch error', error);
        this.setState({
          isPairing: false,
          pairDeviceDialogVisible: true,
          pairingFailed: true,
        });
      });
  };

  addPairedDeviceButtonPress = msg => {
    this.setState({pairDeviceDialogVisible: true});
  };

  closeAddPairedDeviceDialog = () => {
    this.setState({pairDeviceDialogVisible: false});
  };

  renderBody = (props, state) => {
    const {devices} = props;
    return (
      <SafeAreaView>
        <ScrollView>
          <AddEditDevicesList
            bondedDevices={devices.bondedDevicesFormatted}
            deviceOnPressHandler={this.deviceListItemPress}
          />
        </ScrollView>
      </SafeAreaView>
    );
  };

  render() {
    return this.renderBody(this.props, this.state);
  }
}

export default connect(({devices}) => ({devices}))(AddEditDevicesView);
