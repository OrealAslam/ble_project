// import React, {Component} from 'react';
// import PropTypes from 'prop-types';
// import {Text, View, TouchableOpacity, FlatList} from 'react-native';
// import {Icon} from '@rneui/themed';

// class DevicesList extends Component {
//   renderBody = (props, state) => {
//     return (
//       <View style={{margin: 20, marginTop: 0}}>
//         <Text
//           style={{
//             marginBottom: 0,
//             fontSize: 18,
//             fontWeight: 700,
//             color: '#000',
//           }}>
//           Devices List
//         </Text>
//         <TouchableOpacity>
//           <Text
//             style={{
//               marginBottom: 6,
//               fontSize: 14,
//               fontWeight: 500,
//               color: '#000',
//             }}>
//             Tap to connect
//           </Text>
//         </TouchableOpacity>
//         <FlatList
//           style={{height: 160, borderWidth: 1, borderColor: '#CCC'}}
//           data={props.bondedDevices}
//           keyExtractor={(item, index) => index}
//           renderItem={({item}) => (
//             <TouchableOpacity
//               onPress={props.connectToDeviceHandler.bind(this, item)}>
//               <View
//                 style={{
//                   borderBottomWidth: 1,
//                   borderColor: '#CCC',
//                   display: 'flex',
//                   flexDirection: 'row',
//                 }}>
//                 <View style={{margin: 10, flex: 1}}>
//                   <Text
//                     style={{
//                       fontSize: 20,
//                       color: '#000',
//                     }}>
//                     {item.name}
//                   </Text>
//                 </View>
//                 <View
//                   style={{
//                     margin: 5,
//                     width: 40,
//                     display: 'flex',
//                     flexDirection: 'column',
//                     justifyContent: 'center',
//                   }}>
//                   {item.isConnected && (
//                     <Icon
//                       name="checkmark-circle-outline"
//                       type="ionicon"
//                       color="#02b016"
//                     />
//                   )}
//                   {item.inRange && !item.isConnected && (
//                     <Icon name="radio-outline" type="ionicon" color="#666" />
//                   )}
//                 </View>
//               </View>
//             </TouchableOpacity>
//           )}
//         />
//       </View>
//     );
//   };

//   render() {
//     return this.renderBody(this.props, this.state);
//   }
// }

// export default DevicesList;

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {Icon} from '@rneui/themed';

class DevicesList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showAvailableDevices: false,
      isScanning: false,
    };
  }

  toggleAvailableDevices = () => {
    const {startScanHandler} = this.props;

    this.setState(
      prevState => ({
        showAvailableDevices: !prevState.showAvailableDevices,
        isScanning: !prevState.showAvailableDevices, // Start scan when showing
      }),
      () => {
        if (this.state.showAvailableDevices && startScanHandler) {
          startScanHandler();

          // Stop "scanning" state after 20 seconds
          this.scanTimeout = setTimeout(() => {
            this.setState({isScanning: false});
          }, 20000);
        } else {
          // Reset scanning state when hiding
          if (this.scanTimeout) {
            clearTimeout(this.scanTimeout);
          }
          this.setState({isScanning: false});
        }
      },
    );
  };

  componentWillUnmount() {
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
    }
  }

  renderBondedDevices = () => {
    const {bondedDevices, connectToDeviceHandler} = this.props;

    return (
      <>
        <FlatList
          style={{maxHeight: 160, borderWidth: 1, borderColor: '#CCC'}}
          data={bondedDevices}
          keyExtractor={(item, index) => item.address || index.toString()}
          renderItem={({item}) => (
            <TouchableOpacity onPress={() => connectToDeviceHandler(item)}>
              <View
                style={{
                  borderBottomWidth: 1,
                  borderColor: '#CCC',
                  flexDirection: 'row',
                }}>
                <View style={{margin: 10, flex: 1}}>
                  <Text style={{fontSize: 20, color: '#000'}}>
                    {item.name || 'Unnamed Device'}
                  </Text>
                </View>
                <View
                  style={{
                    margin: 5,
                    width: 40,
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}>
                  {item.isConnected && (
                    <Icon
                      name="checkmark-circle-outline"
                      type="ionicon"
                      color="#02b016"
                    />
                  )}
                  {item.inRange && !item.isConnected && (
                    <Icon name="radio-outline" type="ionicon" color="#666" />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      </>
    );
  };

  renderAvailableDevices = () => {
    console.log('Rendering available devices');
    const {unpairedDevices, connectToUnpairedDeviceHandler} = this.props;
    const {isScanning} = this.state;

    if (!this.state.showAvailableDevices) {
      return null;
    }

    return (
      <View style={{marginTop: 20}}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#000',
            marginBottom: 10,
          }}>
          Available BLE Devices
        </Text>

        {isScanning && unpairedDevices.length === 0 && (
          <View style={{padding: 10, alignItems: 'center'}}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={{marginTop: 5, fontSize: 14, color: '#777'}}>
              Scanning for nearby devices...
            </Text>
          </View>
        )}

        {!isScanning && unpairedDevices.length === 0 && (
          <Text style={{fontSize: 14, color: '#888', paddingHorizontal: 10}}>
            No available devices found.
          </Text>
        )}

        <FlatList
          style={{maxHeight: 180, borderWidth: 1, borderColor: '#CCC'}}
          data={unpairedDevices}
          keyExtractor={(item, index) => item.id || index.toString()}
          renderItem={({item}) => (
            <TouchableOpacity
              onPress={() => connectToUnpairedDeviceHandler(item)}>
              <View
                style={{
                  borderBottomWidth: 1,
                  borderColor: '#EEE',
                  padding: 10,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}>
                <Text style={{fontSize: 16, color: '#333'}}>
                  {item.name || 'Unnamed Device'}
                </Text>
                <Icon name="bluetooth" type="ionicon" color="#007AFF" />
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };
  render() {
    return (
      <View style={{margin: 20, marginTop: 0}}>
        {/* <Text
          style={{
            marginBottom: 0,
            fontSize: 18,
            fontWeight: '700',
            color: '#000',
          }}>
          Devices List
        </Text> */}

        <TouchableOpacity onPress={this.toggleAvailableDevices}>
          <Text
            style={{
              marginVertical: 10,
              fontSize: 14,
              fontWeight: '500',
              color: '#007AFF',
            }}>
            Tap to connect nearby devices
          </Text>
        </TouchableOpacity>

        {this.renderBondedDevices()}
        {this.renderAvailableDevices()}
      </View>
    );
  }
}

DevicesList.propTypes = {
  bondedDevices: PropTypes.array.isRequired,
  unpairedDevices: PropTypes.array.isRequired,
  connectToDeviceHandler: PropTypes.func.isRequired,
  connectToUnpairedDeviceHandler: PropTypes.func.isRequired,
  startScanHandler: PropTypes.func.isRequired,
};

export default DevicesList;
