import Config from 'react-native-config';
import {
  BleManager,
  ConnectionPriority,
  LogLevel,
  ScanMode,
} from 'react-native-ble-plx';
import base64 from 'base-64';
import {DateTime} from 'luxon';

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

            if (this.isScanning) {
              this.startScan(this.bluetoothStateFunction, this.updateFunction);
            }
          })
          .catch(error => {
            //console.log("Error Uk1",error)
          });

        onStateChangeSubscription.remove();
      }
    }, true);
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

  static startScan = (bluetoothStateFunction, updateFunction) => {
    //console.log('startScan: bluetoothStateFunction',bluetoothStateFunction)

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
          // console.log("XXX startDeviceScan",new Date())

          if (device.name?.match(/NEP-LINK/)) {
            console.log('XXX NEP-LINK device', [device.name, device.id]);
          }

          if (error) {
            console.log('XXX error - returning', error);
            return; //console.log('ERROR', error)
          }

          this.isScanning = true;

          //if (device.name?.match(/NEP-LINK/)) console.log("XXX device",device)

          console.log(
            'XXXX this.bleDevicesFound BEFORE',
            this.bleDevicesFound.map(({bleDevice}) => bleDevice.name),
          );

          this.bleDevicesFound = this.bleDevicesFound.filter(
            ({timestamp}) => timestamp > new Date().getTime() - 5000,
          );

          console.log(
            'XXXX this.bleDevicesFound AFTER',
            this.bleDevicesFound.map(({bleDevice}) => bleDevice.name),
          );

          if (device.name?.match(/NEP-LINK/)) {
            [
              'serviceData',
              'isConnectable',
              'id',
              'solicitedServiceUUIDs',
              'manufacturerData',
              'serviceUUIDs',
              'overflowServiceUUIDs',
              'txPowerLevel',
              'rssi',
              'mtu',
              'rawScanRecord',
              'name',
              'localName',
              '_manager',
            ];
            // console.log("XXX device.name",device.name)
            // console.log("XXX device.localName",device.localName)
            // console.log("XXX device.serviceData",device.serviceData)
            // console.log("XXX device.isConnectable",device.isConnectable)
            // console.log("XXX device.serviceUUIDs",device.serviceUUIDs)

            const newBleDevicesFound = this.bleDevicesFound.find(
              o => o.bleDevice.id === device.id,
            )
              ? this.bleDevicesFound
              : [
                  ...this.bleDevicesFound,
                  {
                    bleDevice: device,
                    key: this.bleDevicesFound.length.toString(),
                    timestamp: new Date().getTime(),
                  },
                ];
            this.bleDevicesFound = newBleDevicesFound;
            updateFunction(this.bleDevicesFound);
          }
        },
      );
    };

    this.bleDevicesFoundUpdateIntervalId = setInterval(() => {
      this.bleDevicesFound = this.bleDevicesFound.filter(
        ({timestamp}) => timestamp > new Date().getTime() - 5000,
      );
      updateFunction(this.bleDevicesFound);
    }, 10000);

    this.subscription = this.manager.onStateChange(state => {
      console.log('XXX state', state);
      bluetoothStateFunction.call(this, state);
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
        //console.log("Error Uk2",error)
      });
  }
}
