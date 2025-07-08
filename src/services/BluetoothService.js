import Config from 'react-native-config';
import {
  BleManager,
  ConnectionPriority,
  LogLevel,
  ScanMode,
} from 'react-native-ble-plx';
import RNBluetoothClassic from 'react-native-bluetooth-classic';
import Geolocation from '@react-native-community/geolocation';
import {PermissionsAndroid, Platform, Alert, Linking} from 'react-native';
import base64 from 'base-64';
// import {DateTime} from 'luxon';
import {setDiscoveredDevices} from '../actions/DeviceActions';

export default class BluetoothService {
  static init() {
    this.bleDevicesFound = [];
    this.bleDevicesFoundUpdateIntervalId = null;
    this.subscription = null;
    this.isScanning = false;
    this.bluetoothStateFunction = null;
    this.updateFunction = null;
    this.serviceIdsArray = [
      'c25d444c-2836-4cc0-8f2f-95f4c8fd7f8b',
      '86a324aa-4b2f-46c7-b4d8-949cae59e6d7',
    ];

    this.manager = new BleManager();

    const onStateChangeSubscription = this.manager.onStateChange(state => {
      if (state === 'PoweredOn') {
        this.manager
          .connectedDevices(this.serviceIdsArray)
          .then(connectedDevicesArray => {
            connectedDevicesArray.forEach(device => {
              device.cancelConnection();
            });

            this.manager.setLogLevel(LogLevel.Verbose);

            if (
              this.isScanning &&
              this.bluetoothStateFunction &&
              this.updateFunction &&
              this.reduxDispatch
            ) {
              this.startScan(
                this.bluetoothStateFunction,
                this.updateFunction,
                this.reduxDispatch, // ✅ Pass redux dispatch
              );
            }
          })
          .catch(error => {
            console.log('Error while handling connected devices', error);
          });

        onStateChangeSubscription.remove();
      }
    }, true);
  }

  static async connectToDevice(device) {
    try {
      console.log('🔗 Connecting to BLE device:', device);
      
      // For BLE devices, we connect directly (no pairing needed like Classic Bluetooth)
      const connectedDevice = await this.manager.connectToDevice(device.id);
      console.log('✅ BLE device connected successfully:', connectedDevice);
      
      // Discover services after connection
      await connectedDevice.discoverAllServicesAndCharacteristics();
      console.log('✅ Services discovered for device:', connectedDevice.id);
      
      return connectedDevice;
    } catch (error) {
      console.error('❌ Failed to connect to BLE device:', error);
      throw error;
    }
  }

  static async bondDevice(device) {
    try {
      // For BLE devices, we should use connectToDevice instead of Classic Bluetooth pairing
      if (device.bleDevice) {
        return await this.connectToDevice(device.bleDevice);
      }
      
      // Fallback for Classic Bluetooth devices (if any)
      const bondedDevice = await RNBluetoothClassic.pairDevice(device.id);
      console.log('✅ Classic Bluetooth device bonded successfully:', bondedDevice);
      return bondedDevice;
    } catch (error) {
      console.error('❌ Failed to bond device:', error);
      throw error;
    }
  }

  static async ensureBleScanReady() {
    if (Platform.OS !== 'android') {
      return true; // iOS handles this differently
    }

    try {
      // 🔐 Request BLE + Location permissions
      const permissions = [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ];

      const granted = await PermissionsAndroid.requestMultiple(permissions);

      const allGranted = Object.values(granted).every(
        result => result === PermissionsAndroid.RESULTS.GRANTED,
      );

      if (!allGranted) {
        Alert.alert(
          'Permission Denied',
          'Please grant all required Bluetooth and Location permissions.',
        );
        return false;
      }

      // 📍 Check if location services (GPS) are turned ON
      // const gpsEnabled = await new Promise(resolve => {
      //   let resolved = false;

      //   Geolocation.getCurrentPosition(
      //     () => {
      //       resolved = true;
      //       resolve(true);
      //     },
      //     error => {
      //       console.warn('GPS error', error);
      //       if (!resolved) {
      //         resolve(false);
      //       }
      //     },
      //     {enableHighAccuracy: true, timeout: 5000, maximumAge: 0},
      //   );

      //   setTimeout(() => {
      //     if (!resolved) {
      //       resolve(false);
      //     } // fallback to avoid hanging forever
      //   }, 6000);
      // });

      // if (!gpsEnabled) {
      //   Alert.alert(
      //     'Enable GPS',
      //     'Please enable Location (GPS) services to scan for BLE devices.',
      //     [
      //       {text: 'Cancel', style: 'cancel'},
      //       {
      //         text: 'Open Settings',
      //         onPress: () => Linking.openSettings(),
      //       },
      //     ],
      //   );
      //   return false;
      // }

      return true;
    } catch (e) {
      console.error('ensureBleScanReady error:', e);
      Alert.alert(
        'BLE Setup Error',
        'Something went wrong checking Bluetooth/Location readiness.',
      );
      return false;
    }
  }

  static async requestBluetoothPermissions() {
    if (Platform.OS === 'android') {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ];

      const granted = await PermissionsAndroid.requestMultiple(permissions);

      const allGranted = Object.values(granted).every(
        res => res === PermissionsAndroid.RESULTS.GRANTED,
      );

      if (!allGranted) {
        throw new Error('Bluetooth permissions not granted.');
      }
    }
  }

  static restartBleManager() {
    if (this.manager) {
      this.manager.destroy();
    }
    this.init();
  }

  static destroyBleManager() {
    this.manager.destroy();
  }

  // startScan = async () => {
  //   console.log('📡 Attempting BLE Scan...');

  //   try {
  //     await requestBluetoothPermissions(); // ✅ Request required permissions
  //   } catch (e) {
  //     Alert.alert('Permission Error', e.message || 'Unable to get permissions');
  //     return;
  //   }

  //   const isBluetoothEnabled = await RNBluetoothClassic.isBluetoothEnabled();
  //   if (!isBluetoothEnabled) {
  //     Alert.alert(
  //       'Bluetooth Disabled',
  //       'Please turn on Bluetooth to scan for nearby devices.',
  //       [{text: 'OK'}],
  //     );
  //     return;
  //   }

  //   BluetoothService.startScan(
  //     () => {
  //       console.log('✅ BLE State: PoweredOn');
  //     },
  //     devicesFound => {
  //       console.log('📍 Devices found:', devicesFound);

  //       const bonded = devicesFound.filter(d => d.bonded === true);
  //       const unbonded = devicesFound.filter(d => d.bonded !== true);

  //       this.updateBondedDevices(bonded);
  //       this.setState({availableDevices: unbonded});

  //       // Alert when any device found
  //       if (devicesFound.length > 0) {
  //         Alert.alert(
  //           'Device Found',
  //           `${devicesFound.length} BLE device(s) found nearby.`,
  //         );
  //       }
  //     },
  //   );
  // };

  static startScan = async (
    bluetoothStateFunction,
    updateFunction,
    reduxDispatch,
  ) => {
    const ready = await BluetoothService.ensureBleScanReady(); // ✅ Bluetooth + GPS check
    if (!ready) {
      console.log('❌ BLE scan readiness check failed. Aborting scan.');
      return;
    }

    // Clean up any previous scan intervals
    if (this.bleDevicesFoundUpdateIntervalId) {
      clearInterval(this.bleDevicesFoundUpdateIntervalId);
      this.bleDevicesFoundUpdateIntervalId = null;
    }

    this.bluetoothStateFunction = bluetoothStateFunction;
    this.updateFunction = updateFunction;
    this.bleDevicesFound = [];

    const scanFn = () => {
      this.manager.startDeviceScan(
        null,
        {allowDuplicates: true, scanMode: ScanMode.LowLatency},
        (error, device) => {
          if (error) {
            console.log('BLE scan error:', error);
            return;
          }

          this.isScanning = true;

          const now = Date.now();

          // Remove stale devices older than 5s
          this.bleDevicesFound = this.bleDevicesFound.filter(
            ({timestamp}) => timestamp > now - 5000,
          );

          // Check for duplicates
          const alreadyAdded = this.bleDevicesFound.find(
            o => o.bleDevice.id === device.id,
          );

          if (!alreadyAdded && device.name) {
            console.log('📡 Found BLE device:', device.name, device.id);

            const newEntry = {
              bleDevice: device,
              key: this.bleDevicesFound.length.toString(),
              timestamp: now,
            };

            this.bleDevicesFound = [...this.bleDevicesFound, newEntry];

            if (reduxDispatch) {
              reduxDispatch(setDiscoveredDevices(this.bleDevicesFound));
            }

            if (updateFunction) {
              updateFunction(this.bleDevicesFound);
            }
          }
        },
      );
    };

    // Periodic cleanup of stale devices
    this.bleDevicesFoundUpdateIntervalId = setInterval(() => {
      const now = Date.now();
      this.bleDevicesFound = this.bleDevicesFound.filter(
        ({timestamp}) => timestamp > now - 5000,
      );

      if (reduxDispatch) {
        reduxDispatch(setDiscoveredDevices(this.bleDevicesFound));
      }
      if (updateFunction) {
        updateFunction(this.bleDevicesFound);
      }
    }, 10000);

    // Watch for Bluetooth state and trigger scan
    this.subscription = this.manager.onStateChange(state => {
      console.log('BLE State:', state);
      if (bluetoothStateFunction) {
        bluetoothStateFunction.call(this, state);
      }
      if (state === 'PoweredOn') {
        scanFn.call(this);
      }
    }, true);
  };

  static stopScan = () => {
    this.isScanning = false;
    this.bleDevicesFound = [];
    if (this.bleDevicesFoundUpdateIntervalId) {
      clearInterval(this.bleDevicesFoundUpdateIntervalId);
      this.bleDevicesFoundUpdateIntervalId = null;
    }
    if (!this.manager) {
      return true;
    }
    this.manager.stopDeviceScan();
  };

  static connectAndListen = (
    device,
    onDeviceConnectedHandler,
    onSensorDataReceivedHandler,
    onBatteryDataReceivedHandler,
    onDeviceDisconnectedHandler = undefined,
  ) => {
    console.log('XXX connectAndListen device', device);

    const connectedDiscoveredAction = () => {
      device.monitorCharacteristicForService(
        '86a324aa-4b2f-46c7-b4d8-949cae59e6d7',
        '266b64b4-19ee-4941-8253-650b4d7ab197',
        (error, characteristic) => {
          if (characteristic) {
            this.stopScan();
            const batteryReponseJsonStr = base64.decode(characteristic.value);
            try {
              const batteryDataObj = JSON.parse(batteryReponseJsonStr);
              onBatteryDataReceivedHandler.call(this, batteryDataObj);
            } catch (e) {
              console.error('Error', e);
            }
          }
        },
      );

      device.monitorCharacteristicForService(
        'c25d444c-2836-4cc0-8f2f-95f4c8fd7f8b',
        '9915b449-2b52-429b-bfd0-ab634002404d',
        (error, characteristic) => {
          if (characteristic) {
            this.stopScan();
            const responseStr = base64.decode(characteristic.value);

            console.log(`responseStr ${responseStr}`);
            try {
              onSensorDataReceivedHandler.call(this, responseStr);
            } catch (e) {
              console.error('Error', e);
            }
          }
        },
      );

      this.connectedDevice = device;
    };

    this.manager.onDeviceDisconnected(device.id, (error, device) => {
      if (onDeviceDisconnectedHandler !== undefined) {
        onDeviceDisconnectedHandler();
      } else {
        console.error('onDeviceDisconnectedHandler is undefined');
      }
    });

    this.manager
      .isDeviceConnected(device.id)
      .then(isConnected => {
        console.log('XXXXX isConnected', isConnected);
        if (isConnected) {
          connectedDiscoveredAction();
        } else {
          this.manager
            .connectToDevice(device.id, {
              timeout: 15000,
              autoConnect: true,
              requestMTU: 200,
            })
            .then(device => {
              onDeviceConnectedHandler.call(this);
              console.log(
                'Connected, running requestConnectionPriorityForDevice...',
                device,
              );
              this.manager
                .requestConnectionPriorityForDevice(
                  device.id,
                  ConnectionPriority.High,
                )
                .then(device => {
                  console.log(
                    'requestConnectionPriorityForDevice, discovering...',
                    device,
                  );
                  // if (updateFn) updateFn.call(this,{ status: 'connected' })
                  device
                    .discoverAllServicesAndCharacteristics()
                    .then(device => {
                      connectedDiscoveredAction();
                    })
                    .catch(error => {
                      //console.log('Error on discoverAllServicesAndCharacteristics',error)
                      reject(
                        `Error on discoverAllServicesAndCharacteristics: ${error}`,
                      );
                    });
                })
                .catch(error => {
                  //console.log("Can't run requestConnectionPriorityForDevice",error)
                });
            })
            .catch(error => {
              //console.log('Error on connectToDevice',error)
              if (updateFn) {
                //console.log("XXX running updateFn")
                updateFn.call(this, {status: 'connecterror'});
              }
              reject(error);
            });
        }
      })
      .catch(error => {
        console.log('Error Uk2', error);
      });
  };

  static disconnectConnectedDevice() {
    if (this.manager) {
      this.manager.connectedDevices(this.serviceIdsArray).then(devices => {
        console.log('KKKKK connectedDevices', devices);
        devices.forEach(device => {
          device.cancelConnection();
        });
      });
    }
    if (this.connectedDevice) {
      this.connectedDevice.cancelConnection();
      this.connectedDevice = null;
    }
  }

  static disconnectConnectedRestartBle() {
    this.restartBleManager();
  }

  static stopScanningDisconnectConnectedDestroyBleManager() {
    this.stopScan();
    if (!this.manager) {
      return true;
    }
    if (this.subscription) {
      this.subscription.remove();
    }
    this.manager
      .connectedDevices(this.serviceIdsArray)
      .then(connectedDevicesArray => {
        connectedDevicesArray.forEach(device => {
          device.cancelConnection();
        });
        this.manager.destroy();
      })
      .catch(error => {
        console.log('Error Uk2', error);
      });
  }
}
