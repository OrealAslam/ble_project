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
      const bondedDevice = await RNBluetoothClassic.pairDevice(device.id);
      console.log('✅ Device bonded successfully:', bondedDevice);
      await this.updateBondedDevices(reduxDispatch);
      return bondedDevice;
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

  static connectAndListen = (
    device,
    onDeviceConnectedHandler,
    onSensorDataReceivedHandler,
    onBatteryDataReceivedHandler,
    onDeviceDisconnectedHandler = undefined,
  ) => {
    console.log('🔗 connectAndListen', device);

    const connectedDiscoveredAction = () => {
      device.monitorCharacteristicForService(
        '86a324aa-4b2f-46c7-b4d8-949cae59e6d7',
        '266b64b4-19ee-4941-8253-650b4d7ab197',
        (error, characteristic) => {
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

      device.monitorCharacteristicForService(
        'c25d444c-2836-4cc0-8f2f-95f4c8fd7f8b',
        '9915b449-2b52-429b-bfd0-ab634002404d',
        (error, characteristic) => {
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

      this.connectedDevice = device;
    };

    this.manager.onDeviceDisconnected(device.id, (error, d) => {
      if (onDeviceDisconnectedHandler) {
        onDeviceDisconnectedHandler();
      }
    });

    this.manager
      .isDeviceConnected(device.id)
      .then(isConnected => {
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
              onDeviceConnectedHandler();
              this.manager
                .requestConnectionPriorityForDevice(
                  device.id,
                  ConnectionPriority.High,
                )
                .then(() => {
                  device.discoverAllServicesAndCharacteristics().then(() => {
                    connectedDiscoveredAction();
                  });
                });
            })
            .catch(error => {
              console.error('Connect error:', error);
            });
        }
      })
      .catch(error => {
        console.error('Connection check error:', error);
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
