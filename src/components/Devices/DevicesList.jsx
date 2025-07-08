import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {Icon} from '@rneui/themed';

const styles = StyleSheet.create({
  deviceRow: {
    borderBottomWidth: 1,
    borderColor: '#EEE',
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  deviceAddress: {
    fontSize: 12,
    color: '#888',
  },
  deviceRssi: {
    fontSize: 12,
    color: '#888',
  },
  rescanButton: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#007AFF',
    borderRadius: 6,
    alignItems: 'center',
  },
  rescanButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    marginVertical: 8,
    textAlign: 'center',
  },
});

class DevicesList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showAvailableDevices: false,
      isScanning: false,
      connectingDeviceId: null,
      error: null,
    };
  }

  toggleAvailableDevices = () => {
    const {startScanHandler, stopScanHandler} = this.props;
    this.setState(
      prevState => ({
        showAvailableDevices: !prevState.showAvailableDevices,
        isScanning: !prevState.showAvailableDevices,
        error: null,
      }),
      () => {
        if (this.state.showAvailableDevices && startScanHandler) {
          startScanHandler();
          this.scanTimeout = setTimeout(() => {
            this.setState({isScanning: false});
            if (stopScanHandler) stopScanHandler();
          }, 10000);
        } else {
          if (this.scanTimeout) clearTimeout(this.scanTimeout);
          if (stopScanHandler) stopScanHandler();
          this.setState({isScanning: false});
        }
      },
    );
  };

  handleRescan = () => {
    if (this.props.startScanHandler) {
      this.setState({isScanning: true, error: null});
      this.props.startScanHandler();
      if (this.scanTimeout) clearTimeout(this.scanTimeout);
      this.scanTimeout = setTimeout(() => {
        this.setState({isScanning: false});
        if (this.props.stopScanHandler) this.props.stopScanHandler();
      }, 10000);
    }
  };

  handleConnect = async device => {
    this.setState({connectingDeviceId: device.id, error: null});
    try {
      await this.props.connectToUnpairedDeviceHandler(device);
      this.setState({connectingDeviceId: null});
    } catch (e) {
      this.setState({connectingDeviceId: null, error: 'Failed to connect. Try again.'});
    }
  };

  componentWillUnmount() {
    if (this.scanTimeout) clearTimeout(this.scanTimeout);
    if (this.props.stopScanHandler) this.props.stopScanHandler();
  }

  renderAvailableDevices = () => {
    const {
      unpairedDevices,
      isScanning,
      connectingDevice,
      connectError,
    } = this.props;
    if (!this.state.showAvailableDevices) return null;
    return (
      <View style={{marginTop: 20}}>
        <Text style={{fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 10}}>
          Available BLE Devices
        </Text>
        <TouchableOpacity style={styles.rescanButton} onPress={this.handleRescan}>
          <Text style={styles.rescanButtonText}>Rescan</Text>
        </TouchableOpacity>
        {connectError && <Text style={styles.errorText}>{connectError}</Text>}
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
          style={{maxHeight: 220, borderWidth: 1, borderColor: '#CCC'}}
          data={unpairedDevices}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <TouchableOpacity
              onPress={() => this.props.connectToUnpairedDeviceHandler(item)}
              disabled={!!connectingDevice}
            >
              <View style={styles.deviceRow}>
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName}>{item.name || 'Unnamed Device'}</Text>
                  <Text style={styles.deviceAddress}>{item.address}</Text>
                  {item.bleDevice && typeof item.bleDevice.rssi === 'number' && (
                    <Text style={styles.deviceRssi}>RSSI: {item.bleDevice.rssi}</Text>
                  )}
                </View>
                {connectingDevice && connectingDevice.id === item.id ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                  <Icon name="bluetooth" type="ionicon" color="#007AFF" />
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  renderBondedDevices = () => {
    const {bondedDevices, connectToDeviceHandler, disconnectDeviceHandler} = this.props;
    return (
      <FlatList
        style={{maxHeight: 160, borderWidth: 1, borderColor: '#CCC'}}
        data={bondedDevices}
        keyExtractor={item => item.address}
        renderItem={({item}) => (
          <View style={styles.deviceRow}>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>{item.name || 'Unnamed Device'}</Text>
              <Text style={styles.deviceAddress}>{item.address}</Text>
            </View>
            {item.isConnected ? (
              <>
                <TouchableOpacity onPress={() => disconnectDeviceHandler(item)} style={{marginRight: 10}}>
                  <Text style={{color: '#d00', fontWeight: 'bold'}}>Disconnect</Text>
                </TouchableOpacity>
                <Icon name="checkmark-circle-outline" type="ionicon" color="#02b016" />
              </>
            ) : (
              <TouchableOpacity onPress={() => connectToDeviceHandler(item)}>
                <Icon name="radio-outline" type="ionicon" color="#666" />
              </TouchableOpacity>
            )}
          </View>
        )}
      />
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
  disconnectDeviceHandler: PropTypes.func, // <-- add this
  startScanHandler: PropTypes.func.isRequired,
  stopScanHandler: PropTypes.func,
};

export default DevicesList;
