import Config from 'react-native-config';
import {
  BleManager,
  ConnectionPriority,
  LogLevel,
  ScanMode,
} from 'react-native-ble-plx';
import RNBluetoothClassic from 'react-native-bluetooth-classic';
import {PermissionsAndroid, Platform, Alert, Linking} from 'react-native';
import base64 from 'base-64';
import {setDiscoveredDevices} from '../actions/DeviceActions';

export default class BluetoothService {
  static init() {
    this.bleDevicesFound = [];
    this.bleDevicesFoundUpdateIntervalId = null;
    this.subscription = null;
    this.isScanning = false;
    this.bluetoothStateFunction = null;
    this.updateFunction = null;
    // ORIGINAL ARRAY
    // this.serviceIdsArray = [
    //   'c25d444c-2836-4cc0-8f2f-95f4c8fd7f8b',
    //   '86a324aa-4b2f-46c7-b4d8-949cae59e6d7',
    // ];

    // PRINTER ARRAY FOR TESTING PURPOSE
    this.serviceIdsArray = [
      '000018f0-0000-1000-8000-00805f9b34fb',
      'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
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
                this.reduxDispatch,
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

  static async ensureBleScanReady() {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      await this.requestBluetoothPermissions();
      return true;
    } catch (e) {
      Alert.alert(
        'BLE Setup Error',
        e.message || 'Bluetooth/Location permission check failed.',
      );
      return false;
    }
  }

  static async bondDevice(device, reduxDispatch) {
    try {
      console.log('yahan console kro', device);
      try {
        console.log('pairing device', device.id);
        const paired = await RNBluetoothClassic.pairDevice(device.id);
        console.log('✅ Device paired:', paired);
      } catch (pairError) {
        console.error('❌ Pairing failed:', pairError);
        throw new Error(
          'Pairing failed. Please ensure the device is discoverable.',
        );
      }

      // Ensure Redux is updated
      await this.updateBondedDevices(reduxDispatch);

      // Double check: does it have .connect()?
      if (paired && typeof paired.connect === 'function') {
        return paired;
      }

      console.warn(
        '⚠️ Paired device missing .connect(). Fetching from getBondedDevices...',
      );

      const bondedDevices = await RNBluetoothClassic.getBondedDevices();
      const fullDevice = bondedDevices.find(
        d => d.id === device.id || d.address === device.id,
      );

      if (fullDevice && typeof fullDevice.connect === 'function') {
        return fullDevice;
      }

      throw new Error('Bonded device not found or invalid');
    } catch (error) {
      console.error('❌ Failed to bond device:', error);
      throw error;
    }
  }

  static async updateBondedDevices(reduxDispatch) {
    try {
      const bondedDevices = await RNBluetoothClassic.getBondedDevices();
      console.log('📎 Synced bonded devices:', bondedDevices);

      if (reduxDispatch) {
        reduxDispatch({
          type: 'DEVICE_SET_BONDED_DEVICES',
          payload: {bondedDevices},
        });
      }
    } catch (error) {
      console.error('❌ Failed to get bonded devices:', error);
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

  static startScan = async (
    bluetoothStateFunction,
    updateFunction,
    reduxDispatch,
  ) => {
    const ready = await BluetoothService.ensureBleScanReady();
    if (!ready) {
      return;
    }

    if (this.bleDevicesFoundUpdateIntervalId) {
      clearInterval(this.bleDevicesFoundUpdateIntervalId);
      this.bleDevicesFoundUpdateIntervalId = null;
    }

    this.bluetoothStateFunction = bluetoothStateFunction;
    this.updateFunction = updateFunction;
    this.reduxDispatch = reduxDispatch;
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

          this.bleDevicesFound = this.bleDevicesFound.filter(
            ({timestamp}) => timestamp > now - 5000,
          );

          const alreadyAdded = this.bleDevicesFound.find(
            o => o.bleDevice.id === device.id,
          );

          const deviceName = device.name || device.localName;

          if (!alreadyAdded && deviceName) {
            console.log('📡 Found BLE device:', deviceName, device.id);

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

    this.subscription = this.manager.onStateChange(state => {
      console.log('BLE State:', state);
      if (bluetoothStateFunction) {
        bluetoothStateFunction(state);
      }
      if (state === 'PoweredOn') {
        scanFn();
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
    if (this.manager) {
      this.manager.stopDeviceScan();
    }
  };

  // In src/services/BluetoothService.js - Update connectAndListen method

  static connectAndListen = (
    device,
    onDeviceConnectedHandler,
    onSensorDataReceivedHandler,
    onBatteryDataReceivedHandler,
    onDeviceDisconnectedHandler = undefined,
  ) => {
    console.log('🔗 connectAndListen', device);

    // Get the actual BLE device object if we received a wrapper
    const actualDevice = device.bleDevice || device;
    const deviceId = actualDevice.id;

    if (!deviceId) {
      console.error('Invalid device object - missing ID:', device);
      return;
    }

    const connectedDiscoveredAction = connectedDevice => {
      // Use the connected device instance, not the original one
      connectedDevice.monitorCharacteristicForService(
        '86a324aa-4b2f-46c7-b4d8-949cae59e6d7',
        '266b64b4-19ee-4941-8253-650b4d7ab197',
        (error, characteristic) => {
          if (error) {
            console.error('Battery monitoring error:', error);
            return;
          }
          if (characteristic) {
            this.stopScan();
            try {
              const batteryData = JSON.parse(
                base64.decode(characteristic.value),
              );
              onBatteryDataReceivedHandler(batteryData);
            } catch (e) {
              console.error('Battery JSON parse error:', e);
            }
          }
        },
      );

      connectedDevice.monitorCharacteristicForService(
        '86a324aa-4b2f-46c7-b4d8-949cae59e6d7',
        '266b64b4-19ee-4941-8253-650b4d7ab197',
        (error, characteristic) => {
          if (error) {
            console.error('Sensor monitoring error:', error);
            return;
          }
          if (characteristic) {
            this.stopScan();
            try {
              const sensorData = base64.decode(characteristic.value);
              onSensorDataReceivedHandler(sensorData);
            } catch (e) {
              console.error('Sensor data error:', e);
            }
          }
        },
      );

      this.connectedDevice = connectedDevice;
    };

    this.manager.onDeviceDisconnected(deviceId, (error, d) => {
      console.log('Device disconnected event:', deviceId, error);
      if (onDeviceDisconnectedHandler) {
        onDeviceDisconnectedHandler();
      }
    });

    this.manager
      .isDeviceConnected(deviceId)
      .then(isConnected => {
        console.log(
          `Device ${deviceId} connection status:`,
          isConnected ? 'connected' : 'disconnected',
        );
        if (isConnected) {
          // If already connected, use the existing connection
          this.manager
            .connectToDevice(deviceId)
            .then(connectedDevice => {
              connectedDiscoveredAction(connectedDevice);
              onDeviceConnectedHandler();
            })
            .catch(error => {
              console.error('Error retrieving connected device:', error);
            });
        } else {
          // Connect to device with retry mechanism
          this.manager
            .connectToDevice(deviceId, {
              timeout: 15000,
              autoConnect: true,
              requestMTU: 200,
            })
            .then(connectedDevice => {
              console.log('Successfully connected to device:', deviceId);
              onDeviceConnectedHandler();
              this.manager
                .requestConnectionPriorityForDevice(
                  deviceId,
                  ConnectionPriority.High,
                )
                .then(() => {
                  connectedDevice
                    .discoverAllServicesAndCharacteristics()
                    .then(() => {
                      console.log('Services discovered for device:', deviceId);
                      connectedDiscoveredAction(connectedDevice);
                    })
                    .catch(error => {
                      console.error('Service discovery error:', error);
                    });
                })
                .catch(error => {
                  console.error('Connection priority error:', error);
                  // Try to continue anyway
                  connectedDevice
                    .discoverAllServicesAndCharacteristics()
                    .then(() => connectedDiscoveredAction(connectedDevice))
                    .catch(e =>
                      console.error(
                        'Service discovery error after priority error:',
                        e,
                      ),
                    );
                });
            })
            .catch(error => {
              console.error(`Connect error for device ${deviceId}:`, error);
            });
        }
      })
      .catch(error => {
        console.error(`Connection check error for device ${deviceId}:`, error);
      });
  };

  static disconnectConnectedDevice() {
    if (this.manager) {
      this.manager.connectedDevices(this.serviceIdsArray).then(devices => {
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
    if (this.subscription) {
      this.subscription.remove();
    }
    if (this.manager) {
      this.manager
        .connectedDevices(this.serviceIdsArray)
        .then(devices => {
          devices.forEach(d => d.cancelConnection());
          this.manager.destroy();
        })
        .catch(e => console.log('Destroy error:', e));
    }
  }
}
