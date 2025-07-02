// import React, {Component} from 'react';
// import PropTypes from 'prop-types';
// import {SafeAreaView, ScrollView} from 'react-native';

// import {CommonActions} from '@react-navigation/native';
// import {connect} from 'react-redux';

// import AddEditDevicesList from '../../components/Devices/AddEditDevicesList';

// import {addBondedDevice} from '../../actions/DeviceActions';

// class AddEditDevicesView extends Component {
//   constructor(props) {
//     super(props);
//     this.state = {
//       bluetoothEnabled: true,
//       bondedDevicesRaw: [],
//       bondedDevicesFormatted: [],
//       devicesInRangeAddresses: [],
//       unpairedDevices: [],
//       pairDeviceDialogVisible: false,
//       isPairing: false,
//       pairingFailed: false,
//     };
//   }

//   componentDidMount() {
//     const {navigation} = this.props;

//     navigation.setOptions({
//       headerRight: () => (
//         <HeaderRightAddDeviceButton
//           pressHandler={this.addPairedDeviceButtonPress}
//         />
//       ),
//     });
//   }

//   componentDidUpdate() {}

//   componentWillUnmount() {}

//   deviceListItemPress = (deviceId, deviceName) => {
//     const routeToEditUnpairDevice = CommonActions.navigate({
//       name: 'EditUnpairDevice',
//       params: {
//         deviceId,
//         deviceName,
//       },
//     });
//     this.props.navigation.dispatch(routeToEditUnpairDevice);
//   };

//   pairWithDevice = address => {
//     const {devices} = this.props;
//     const pairingWithDevice = devices.unpairedDevices.find(
//       unpairedDevice => unpairedDevice.address === address,
//     );
//     this.setState({isPairing: true, pairingFailed: false, pairingWithDevice});
//     RNBluetoothClassic.pairDevice(address)
//       .then(device => {
//         if (device.bonded) {
//           this.setState({
//             isPairing: false,
//             pairDeviceDialogVisible: false,
//             pairingFailed: false,
//           });
//           this.props.dispatch(addBondedDevice(pairingWithDevice));
//         } else {
//           this.setState({
//             isPairing: false,
//             pairDeviceDialogVisible: true,
//             pairingFailed: true,
//           });
//         }
//       })
//       .catch(error => {
//         console.log('XXX pairDevice.catch error', error);
//         console.warn('XXX pairDevice.catch error', error);
//         this.setState({
//           isPairing: false,
//           pairDeviceDialogVisible: true,
//           pairingFailed: true,
//         });
//       });
//   };

//   addPairedDeviceButtonPress = msg => {
//     this.setState({pairDeviceDialogVisible: true});
//   };

//   closeAddPairedDeviceDialog = () => {
//     this.setState({pairDeviceDialogVisible: false});
//   };

//   renderBody = (props, state) => {
//     const {devices} = props;
//     return (
//       <SafeAreaView>
//         <ScrollView>
//           <AddEditDevicesList
//             bondedDevices={devices.bondedDevicesFormatted}
//             deviceOnPressHandler={this.deviceListItemPress}
//           />
//         </ScrollView>
//       </SafeAreaView>
//     );
//   };

//   render() {
//     return this.renderBody(this.props, this.state);
//   }
// }

// export default connect(({devices}) => ({devices}))(AddEditDevicesView);

import React, {useState, useEffect, useCallback} from 'react';
import {SafeAreaView, ScrollView} from 'react-native';
import {CommonActions, useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';

import AddEditDevicesList from '../../components/Devices/AddEditDevicesList';
import {addBondedDevice} from '../../actions/DeviceActions';

// Ensure this is imported
// import HeaderRightAddDeviceButton from '../../components/Devices/HeaderRightAddDeviceButton';
import RNBluetoothClassic from 'react-native-bluetooth-classic';

const AddEditDevicesView = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const devices = useSelector(state => state.devices);

  const [pairDeviceDialogVisible, setPairDeviceDialogVisible] = useState(false);
  const [isPairing, setIsPairing] = useState(false);
  const [pairingFailed, setPairingFailed] = useState(false);
  const [pairingWithDevice, setPairingWithDevice] = useState(null);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderRightAddDeviceButton pressHandler={handleAddPairedDevicePress} />
      ),
    });
  }, [navigation]);

  const handleDeviceItemPress = useCallback(
    (deviceId, deviceName) => {
      navigation.dispatch(
        CommonActions.navigate({
          name: 'EditUnpairDevice',
          params: {deviceId, deviceName},
        }),
      );
    },
    [navigation],
  );

  const handleAddPairedDevicePress = () => {
    setPairDeviceDialogVisible(true);
  };

  const handleCloseDialog = () => {
    setPairDeviceDialogVisible(false);
  };

  const handlePairWithDevice = async address => {
    const deviceToPair = devices.unpairedDevices.find(
      device => device.address === address,
    );

    if (!deviceToPair) {
      return;
    }

    setIsPairing(true);
    setPairingFailed(false);
    setPairingWithDevice(deviceToPair);

    try {
      const device = await RNBluetoothClassic.pairDevice(address);
      if (device?.bonded) {
        setIsPairing(false);
        setPairDeviceDialogVisible(false);
        setPairingFailed(false);
        // dispatch(addBondedDevice(deviceToPair));
        dispatch(
          addBondedDevice({
            id: device.address, // or device.id
            name: device.name,
            address: device.address,
          }),
        );
      } else {
        setIsPairing(false);
        setPairDeviceDialogVisible(true);
        setPairingFailed(true);
      }
    } catch (error) {
      console.warn('Pairing failed:', error);
      setIsPairing(false);
      setPairDeviceDialogVisible(true);
      setPairingFailed(true);
    }
  };

  return (
    <SafeAreaView style={{flex: 1}}>
      <ScrollView>
        <AddEditDevicesList
          bondedDevices={devices.bondedDevicesFormatted}
          deviceOnPressHandler={handleDeviceItemPress}
        />
        {/* Optionally, render dialog based on state here */}
      </ScrollView>
    </SafeAreaView>
  );
};

export default AddEditDevicesView;
