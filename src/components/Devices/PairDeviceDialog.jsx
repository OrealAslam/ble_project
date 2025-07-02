// import React, {Component} from 'react';
// import PropTypes from 'prop-types';
// import {View, Text, TouchableOpacity, ActivityIndicator} from 'react-native';
// import {Dialog, Icon, lightColors} from '@rneui/themed';

// class PairDeviceDialog extends Component {
//   renderDevices = (devices, deviceIdNameHash, pairWithDeviceHandler) => {
//     if (devices.length === 0) {
//       return (
//         <View style={{display: 'flex', flexDirection: 'column', width: '100%'}}>
//           <View>
//             <Text style={{fontSize: 16, color: '#000'}}>
//               Waiting for devices...
//             </Text>
//           </View>
//           <View
//             style={{width: '20px', marginTop: 10, alignItems: 'flex-start'}}>
//             <ActivityIndicator size="small" color={lightColors.primary} />
//           </View>
//         </View>
//       );
//     }

//     return devices
//       .filter(device => device && device.name && device.address)
//       .map(({name, address}, index) => {
//         const formerName = deviceIdNameHash[address];
//         const label =
//           formerName && formerName !== name
//             ? `${name} (was: ${formerName})`
//             : `${name}`;
//         return (
//           <TouchableOpacity
//             key={index.toString()}
//             onPress={pairWithDeviceHandler.bind(this, address)}>
//             <View
//               style={{
//                 display: 'flex',
//                 flexDirection: 'column',
//                 width: '100%',
//                 backgroundColor: '#EEE',
//                 padding: 6,
//                 marginBottom: 6,
//               }}>
//               <Text
//                 style={{
//                   fontSize: 18,
//                   color: lightColors.primary,
//                   fontWeight: 700,
//                 }}>
//                 {label}
//               </Text>
//             </View>
//           </TouchableOpacity>
//         );
//       });
//   };

//   renderBody = (props, state) => {
//     if (props.isVisible && props.isPairing) {
//       return (
//         <Dialog>
//           <Dialog.Loading />
//           <View style={{display: 'flex', alignItems: 'center'}}>
//             <Text style={{fontSize: 16, color: '#000'}}>
//               Pairing with {props.pairingWithDevice?.name}...
//             </Text>
//           </View>
//         </Dialog>
//       );
//     }

//     return (
//       <Dialog
//         isVisible={props.isVisible}
//         onBackdropPress={props.closeDialog.bind(this)}>
//         {props.pairingFailed && (
//           <View style={{flexDirection: 'row', marginBottom: 20}}>
//             <View style={{width: 40}}>
//               <Icon name="warning" type="ionicon" color="#fc9803" size={40} />
//             </View>
//             <View style={{flex: 1, paddingLeft: 10}}>
//               <Text style={{fontSize: 18, fontWeight: 700, color: '#000'}}>
//                 Pairing failed with device {props.pairingWithDevice?.name}.
//                 Please ensure device is turned on and in range and try again.
//               </Text>
//             </View>
//           </View>
//         )}
//         <Dialog.Title title="Choose Device to Pair..." />
//         <View>
//           {this.renderDevices(
//             props.unpairedDevices,
//             props.deviceIdNameHash,
//             props.pairWithDeviceHandler,
//           )}
//         </View>
//         <Dialog.Actions>
//           <Dialog.Button
//             title="Cancel"
//             onPress={props.closeDialog.bind(this)}
//           />
//         </Dialog.Actions>
//       </Dialog>
//     );
//   };

//   render() {
//     return this.renderBody(this.props, this.state);
//   }
// }

// export default PairDeviceDialog;

import React from 'react';
import {View, Text, TouchableOpacity, ActivityIndicator} from 'react-native';
import {Dialog, Icon, lightColors} from '@rneui/themed';

const PairDeviceDialog = ({
  isVisible,
  isPairing,
  pairingWithDevice,
  pairingFailed,
  unpairedDevices,
  deviceIdNameHash,
  pairWithDeviceHandler,
  closeDialog,
}) => {
  const renderDevices = (devices, deviceIdNameHash, onPair) => {
    if (devices.length === 0) {
      return (
        <View style={{display: 'flex', flexDirection: 'column', width: '100%'}}>
          <View>
            <Text style={{fontSize: 16, color: '#000'}}>
              Waiting for devices...
            </Text>
          </View>
          <View style={{width: 20, marginTop: 10, alignItems: 'flex-start'}}>
            <ActivityIndicator size="small" color={lightColors.primary} />
          </View>
        </View>
      );
    }

    return devices
      .filter(device => device && device.name && device.address)
      .map(({name, address}, index) => {
        const formerName = deviceIdNameHash[address];
        const label =
          formerName && formerName !== name
            ? `${name} (was: ${formerName})`
            : `${name}`;
        return (
          <TouchableOpacity
            key={index.toString()}
            onPress={() => onPair(address)}>
            <View
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                backgroundColor: '#EEE',
                padding: 6,
                marginBottom: 6,
              }}>
              <Text
                style={{
                  fontSize: 18,
                  color: lightColors.primary,
                  fontWeight: '700',
                }}>
                {label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      });
  };

  if (isVisible && isPairing) {
    return (
      <Dialog isVisible={true}>
        <Dialog.Loading />
        <View style={{display: 'flex', alignItems: 'center'}}>
          <Text style={{fontSize: 16, color: '#000'}}>
            Pairing with {pairingWithDevice?.name}...
          </Text>
        </View>
      </Dialog>
    );
  }

  return (
    <Dialog isVisible={isVisible} onBackdropPress={closeDialog}>
      {pairingFailed && (
        <View style={{flexDirection: 'row', marginBottom: 20}}>
          <View style={{width: 40}}>
            <Icon name="warning" type="ionicon" color="#fc9803" size={40} />
          </View>
          <View style={{flex: 1, paddingLeft: 10}}>
            <Text style={{fontSize: 18, fontWeight: '700', color: '#000'}}>
              Pairing failed with device {pairingWithDevice?.name}. Please
              ensure device is turned on and in range and try again.
            </Text>
          </View>
        </View>
      )}
      <Dialog.Title title="Choose Device to Pair..." />
      <View>
        {renderDevices(
          unpairedDevices,
          deviceIdNameHash,
          pairWithDeviceHandler,
        )}
      </View>
      <Dialog.Actions>
        <Dialog.Button title="Cancel" onPress={closeDialog} />
      </Dialog.Actions>
    </Dialog>
  );
};

export default PairDeviceDialog;
