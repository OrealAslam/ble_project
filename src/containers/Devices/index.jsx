import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {
  SafeAreaView,
  View,
  PermissionsAndroid,
  Platform,
  Alert,
} from 'react-native';

import BluetoothService from '../../services/BluetoothService';
import {connect} from 'react-redux';
import {CommonActions} from '@react-navigation/native';
import Geolocation from '@react-native-community/geolocation';

import RNBluetoothClassic from 'react-native-bluetooth-classic';

import {setDemoModeEnabled} from '../../actions/DemoActions';
import {
  setDeviceConnecting,
  setDeviceConnected,
  setDeviceDisconnecting,
  setDeviceDisconnected,
  clearConnectedDevice,
  setWiping,
  setSensorDataReceived,
  setSensorError,
  setDiscoveredDevices,
  setBondedDevices,
  addKnownDevices,
  fetchKnownDevices,
  addBondedDevice,
} from '../../actions/DeviceActions';
import {stopLogging} from '../../actions/LoggingActions';

import {
  updateValues,
  resetValues,
  updateBatteryStatus,
} from '../../actions/SensorDataActions';
import NepLinkHeader from '../../components/Devices/NepLinkHeader';
import BluetoothDisabledError from '../../components/Devices/BluetoothDisabledError';
import DevicesList from '../../components/Devices/DevicesList';
import DevicesListButtons from '../../components/Devices/DevicesListButtons';
import DeviceConnectingDialog from '../../components/Devices/DeviceConnectingDialog';
import {
  addDataToLoggingSession,
  saveLoggingSessionSamples,
} from '../../actions/LoggingActions';

class Devices extends Component {
  constructor(props) {
    super(props);
    this.state = {
      bluetoothAvailable: true,
      bluetoothEnabled: true,
      bluetoothPermissions: true,
      locationEnabled: true,
      awaitingDevice: false,
      connectionAttemptStarted: false,
      connectingDevice: null,
      connectedDevice: null,
      locationLat: null,
      locationLng: null,
      lastSaveLoggingSessionSamplesCount: 0,
      attemptingConnection: false,
      demoModeEnabled: false,
      availableDevices: [],
    };
  }

  async componentDidMount() {
    console.log('XXX Devices componentDidMount');

    BluetoothService.init();

    await this.getBluetoothPermissionsAndStartBluetoothProcesses.call(this);
    this.locationUpdate.call(this);
  }

  // connectToUnpairedDevice = device => {
  //   console.log('Connecting to unpaired device', device);
  //   // Optionally: pair or bond first if needed
  //   this.connectToDevice(device);
  // };

  connectToUnpairedDevice = async device => {
    try {
      console.log('🔌 Connecting to unpaired device:', device);

      // Step 1: Try to bond/pair with the device
      const bondedDevice = await BluetoothService.bondDevice(device.bleDevice);
      console.log('✅ Bonded device after pairing:', bondedDevice);

      // Step 2: Verify that the bondedDevice is valid and usable
      if (
        !bondedDevice ||
        !bondedDevice.id ||
        typeof bondedDevice.connect !== 'function'
      ) {
        console.warn('❌ Invalid bonded device returned:', bondedDevice);
        Alert.alert(
          'Pairing Failed',
          'The device was paired but cannot be connected.',
        );
        return;
      }

      // Step 3: Update Redux with newly bonded device
      this.updateBondedDevices([bondedDevice]);

      // Step 4: Wait until Redux `bondedDevicesFormatted` reflects the new bonded device
      const waitForReduxUpdate = () => {
        const updatedBondedDevice =
          this.props.devices.bondedDevicesFormatted.find(
            d =>
              d.id === bondedDevice.id ||
              d.address === bondedDevice.id || // classic device case
              d.address === bondedDevice.address,
          );

        if (updatedBondedDevice) {
          console.log(
            '📦 Device now available in Redux — connecting...',
            updatedBondedDevice,
          );
          clearInterval(this.reduxBondedCheckInterval);

          this.connectToDevice({
            ...updatedBondedDevice,
            bleDevice: bondedDevice, // still pass for connectAndListen
          });
        }
      };

      // Use interval instead of blind timeout
      this.reduxBondedCheckInterval = setInterval(waitForReduxUpdate, 300);

      // Optionally set timeout to clear interval if device isn't found
      setTimeout(() => {
        if (this.reduxBondedCheckInterval) {
          clearInterval(this.reduxBondedCheckInterval);
          console.warn('⏰ Timed out waiting for Redux update after bonding');
        }
      }, 4000);
    } catch (error) {
      console.warn('❌ Bonding failed:', error);
      Alert.alert('Bonding Failed', 'Could not pair with this device.');
    }
  };

  scanTimeout = null;

  // startScan = async () => {
  //   console.log('XXX startScan');

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
  //       console.log('XXX bluetoothStateFunction');
  //     },
  //     devicesFound => {
  //       console.log('XXX updateFunction', devicesFound);

  //       // Filter bonded and unbonded devices
  //       const bonded = devicesFound.filter(d => d.bonded === true);
  //       const unbonded = devicesFound.filter(d => d.bonded !== true);

  //       // Update bonded devices via Redux
  //       this.updateBondedDevices(bonded);

  //       // Update unpaired/available devices in component state
  //       this.setState({availableDevices: unbonded});
  //     },
  //   );
  // };

  startScan = async () => {
    console.log('📡 Starting BLE scan...');

    const isBluetoothEnabled = await RNBluetoothClassic.isBluetoothEnabled();
    if (!isBluetoothEnabled) {
      Alert.alert(
        'Bluetooth Disabled',
        'Please turn on Bluetooth to scan for nearby devices.',
        [{text: 'OK'}],
      );
      return;
    }

    BluetoothService.startScan(
      () => {
        console.log('🟢 Bluetooth scan started.');
      },
      devicesFound => {
        console.log('📍 Devices found:', devicesFound);

        const bonded = devicesFound.filter(d => d.bonded === true);
        const unbonded = devicesFound.filter(d => d.bonded !== true);

        // Update bonded devices via Redux
        this.updateBondedDevices(bonded);

        // Update unpaired devices in state
        this.setState({availableDevices: unbonded});

        // 🔔 Show alert if at least one unpaired BLE device is found
        if (unbonded.length > 0) {
          const firstDeviceName = unbonded[0].name || 'Unnamed Device';
        } else {
          console.log('❌ No unpaired devices found.');
        }
      },
    );
  };

  getBluetoothPermissionsAndStartBluetoothProcesses = async () => {
    let fineLocationPermission = true;
    let bluetoothScanPermission = true;
    let bluetoothConnectPermission = true;

    if (Platform.OS === 'android') {
      if (Platform.Version < 31) {
        fineLocationPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ).catch(error => {
          console.log(
            "XXX can't run PermissionsAndroid.request PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION",
            error,
          );
        });
      } else {
        const requestMultiplePermissionsResult =
          await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ]);
        if (!requestMultiplePermissionsResult) {
          fineLocationPermission = false;
          bluetoothScanPermission = false;
          bluetoothConnectPermission = false;
        }
      }
    }

    if (
      bluetoothScanPermission &&
      bluetoothConnectPermission &&
      fineLocationPermission
    ) {
      if (!this.state.bluetoothPermissions) {
        this.setState({
          bluetoothPermissions: true,
        });
      }
    } else if (this.state.bluetoothPermissions) {
      this.setState({
        bluetoothPermissions: false,
      });
      return false;
    }

    console.log('KKK getBluetoothPermissionsAndStartBluetoothProcesses passed');
    console.log('KKK fineLocationPermission', fineLocationPermission);
    console.log('KKK bluetoothScanPermission', bluetoothScanPermission);
    console.log('KKK bluetoothConnectPermission', bluetoothConnectPermission);

    this.startScan.call(this);
  };

  componentDidUpdate(prevProps, prevState) {
    const {logging, dispatch, demo} = this.props;
    const {loggingSessionId, loggingSessionSamples} = logging;
    if (
      loggingSessionSamples.length -
        this.state.lastSaveLoggingSessionSamplesCount >=
      10
    ) {
      this.setState({
        lastSaveLoggingSessionSamplesCount:
          logging.loggingSessionSamples.length,
      });
      dispatch(
        saveLoggingSessionSamples(loggingSessionId, loggingSessionSamples),
      );
    }

    if (!prevState.demoModeEnabled && this.state.demoModeEnabled) {
      if (this.intervalId) {
        clearInterval(this.intervalId);
      }
      this.intervalId = setInterval(() => {
        this.createDemoDataReading.call(this);
      }, 1000);
    }

    if (prevProps.demo.demoModeEnabled && demo.demoModeEnabled === false) {
      this.currentTurbidityValue = null;
      this.currentTemperatureValue = null;

      this.setState({demoModeEnabled: false});

      this.props.dispatch(resetValues());
    }

    if (!demo.demoModeEnabled && this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  componentWillUnmount() {
    this.props.dispatch(resetValues());
  }

  locationUpdateId = null;
  locationSubscription = null;

  locationUpdate = async () => {
    console.log('KKK locationUpdate - Running...');

    this.locationUpdateId = setInterval(() => {
      Geolocation.getCurrentPosition(
        position => {
          const {latitude, longitude} = position.coords;
          if (latitude && longitude) {
            this.setState(
              {
                locationEnabled: true,
                locationLat: latitude,
                locationLng: longitude,
              },
              () => {
                console.log(
                  'KKKK locationUpdate Geolocation.getCurrentPosition update',
                  {lat: latitude, lng: longitude},
                );
                clearInterval(this.locationUpdateId);
              },
            );
          }
        },
        error => {
          console.log('KKK locationUpdate Geolocation error', error);
          this.setState({locationEnabled: false});
        },
        {enableHighAccuracy: true, timeout: 40000, maximumAge: 10000},
      );
    }, 30000);
  };

  getConnectedDevices = () => {
    RNBluetoothClassic.getConnectedDevices()
      .then(connected => {
        console.log('XXX connected', connected);
        this.updateConnectedDevices.call(this, connected);
        setTimeout(() => {
          this.getConnectedDevices.call(this);
        }, 3000);
      })
      .catch(error => {
        console.log('RNBluetoothClassic.getConnectedDevices error', error);
      });
  };

  getDevicesInRange = () => {
    const {dispatch} = this.props;
    const bondedDevicesFormatted = [...this.state.bondedDevicesFormatted];
    bondedDevicesFormatted.forEach(bondedDevice => {
      bondedDevice.inRange =
        this.state.devicesInRangeAddresses.indexOf(bondedDevice.address) > -1;
    });
    this.setState({bondedDevicesFormatted});
  };

  updateBondedDevices = bondedDevices => {
    this.props.dispatch(setBondedDevices(bondedDevices));
    this.props.dispatch(addKnownDevices(bondedDevices));
  };

  updateConnectedDevices = connectedDevices => {
    const {dispatch, devices} = this.props;

    const connectedDevicesFormatted = connectedDevices
      .map(({id, address, name}) => {
        return {
          id,
          address,
          name,
          inRange: false,
        };
      })
      .sort((a, b) => (a.name > b.name ? 1 : -1));

    if (connectedDevices.length && !this.state.connectedDevice) {
      const connectedDevice = connectedDevices[0];
      const deviceDataObj = devices.bondedDevicesFormatted.find(
        o => o.address === connectedDevice.address,
      );
      this.setState({
        connectedDevicesRaw: connectedDevices,
        connectedDevicesFormatted,
        connectedDevice: connectedDevice,
        connectingDevice: null,
      });
      dispatch(setDeviceConnected(deviceDataObj));
      const routeToDeviceView = CommonActions.navigate({
        name: 'DeviceView',
        params: {
          deviceName: deviceDataObj.name,
        },
      });
      this.props.navigation.dispatch(routeToDeviceView);
    } else if (!connectedDevices.length) {
      if (this.state.connectedDevicesRaw.length || this.state.connectedDevice) {
        this.setState({
          connectedDevicesRaw: [],
          connectedDevicesFormatted: [],
          connectedDevice: null,
        });
      }
      if (devices.connectedDevice) {
        dispatch(clearConnectedDevice());
      }
    }
    console.log('XXX connectedDevices', connectedDevices);
  };

  // connectToDevice = device => {
  //   BluetoothService.stopScan();
  //   const {props} = this;
  //   const {dispatch, navigation, devices} = props;
  //   const deviceToConnect = devices.bondedDevicesRaw.find(
  //     o => o.bleDevice.id === device.id,
  //   );
  //   const deviceDataObj = devices.bondedDevicesFormatted.find(
  //     o => o.id === device.id,
  //   );
  //   // console.log("XXX device.id",device.id)
  //   // console.log("XXX devices.bondedDevicesRaw",devices.bondedDevicesRaw)
  //   // console.log("XXX deviceToConnect",deviceToConnect)
  //   this.setState({
  //     awaitingDevice: true,
  //     connectingDevice: null,
  //     connectedDevice: null,
  //   });
  //   if (!deviceToConnect) {
  //     // || !deviceToConnect.isConnected) {
  //     this.setState({
  //       awaitingDevice: true,
  //       connectingDevice: null,
  //       connectedDevice: null,
  //     });
  //     setTimeout(() => {
  //       console.log('XXX running again');
  //       this.connectToDevice.call(this, device);
  //     }, 1000);
  //     return;
  //   }
  //   dispatch(setWiping(false));
  //   dispatch(setSensorError(false));
  //   dispatch(setSensorDataReceived(false));
  //   this.setState({
  //     awaitingDevice: false,
  //     connectingDevice: deviceToConnect,
  //     connectedDevice: null,
  //   });
  //   BluetoothService.connectAndListen(
  //     deviceToConnect.bleDevice,
  //     this.onConnected,
  //     this.onSensorDataReceived,
  //     this.onBatteryDataReceived,
  //     this.onDeviceDisconnected,
  //   );
  //   dispatch(setDeviceConnected(deviceToConnect));
  //   const routeToDeviceView = CommonActions.navigate({
  //     name: 'DeviceView',
  //     params: {
  //       deviceDataObj,
  //       deviceName: deviceDataObj.name,
  //     },
  //   });
  //   this.props.navigation.dispatch(routeToDeviceView);
  // };

  connectToDevice = (device, retryCount = 0) => {
    if (!device || typeof device !== 'object') {
      console.warn('Invalid device passed to connectToDevice:', device);
      return;
    }

    BluetoothService.stopScan();

    const {dispatch, navigation, devices} = this.props;

    // Set state to connecting first
    dispatch(setDeviceConnecting(device));

    // Determine the actual BLE device and metadata
    const deviceToConnect = device.bleDevice || device;

    // Try all possible fallback strategies to get usable metadata
    const deviceDataObj = device.deviceDataObj ||
      devices.bondedDevicesFormatted.find(
        o =>
          o.id === device.id ||
          o.id === device.bleDevice?.id ||
          o.address === device.bleDevice?.id,
      ) || {
        id: deviceToConnect.id,
        name: deviceToConnect.name || deviceToConnect.localName,
        address: deviceToConnect.id,
        rssi: deviceToConnect.rssi || -99,
      }; // fallback object with just basics

    console.log('✅ Final deviceDataObj:', deviceDataObj);
    console.log('✅ Connecting to device:', deviceToConnect);

    if (!deviceToConnect || !deviceToConnect.id) {
      if (retryCount >= 5) {
        Alert.alert('Connection Timeout', 'Unable to connect to the device.');
        this.setState({
          awaitingDevice: false,
          connectingDevice: null,
          connectionAttemptStarted: false,
        });
        return;
      }

      this.setState({
        awaitingDevice: true,
        connectingDevice: device,
        connectionAttemptStarted: true,
      });

      setTimeout(() => {
        console.log(`🔁 Retrying connection... (${retryCount + 1})`);
        this.connectToDevice(device, retryCount + 1);
      }, 1000);

      return;
    }

    // Proceed with connection
    dispatch(setWiping(false));
    dispatch(setSensorError(false));
    dispatch(setSensorDataReceived(false));

    this.setState({
      awaitingDevice: false,
      connectingDevice: deviceToConnect,
      connectedDevice: deviceToConnect, // Save the connected device in state
      connectionAttemptStarted: true,
    });

    BluetoothService.connectAndListen(
      deviceToConnect,
      this.onConnected,
      this.onSensorDataReceived,
      this.onBatteryDataReceived,
      this.onDeviceDisconnected,
    );

    // Only update Redux state after successful connection in onConnected
    // This happens in the onConnected callback now

    const routeToDeviceView = CommonActions.navigate({
      name: 'DeviceView',
      params: {
        deviceDataObj,
        deviceName: deviceDataObj?.name || 'Unnamed Device',
      },
    });

    navigation.dispatch(routeToDeviceView);
  };

  onConnected = () => {
    const {dispatch} = this.props;
    const {connectedDevice} = this.state;

    console.log('DEVICE CONNECTED.. HURRAY!!...', connectedDevice);

    if (connectedDevice) {
      // Now that connection is successful, update Redux state
      dispatch(setDeviceConnected(connectedDevice));
      dispatch(setWiping(true));

      setTimeout(() => {
        dispatch(setWiping(false));
      }, 10000);
    } else {
      console.warn('Device connected but no device in state');
    }
  };

  onBatteryDataReceived = batteryDataObj => {
    console.log('XXX onBatteryDataReceived', batteryDataObj);

    const {props} = this;
    const {dispatch, devices, logging} = props;

    const batteryPercentage = !isNaN(batteryDataObj.percentage)
      ? parseInt(batteryDataObj.percentage)
      : 0;
    const batteryRawVoltage = !isNaN(batteryDataObj.rawVoltage)
      ? parseInt(batteryDataObj.rawVoltage)
      : 0;
    const batteryLevel = batteryPercentage > 0 ? batteryPercentage : 0;
    const batteryCharging = batteryDataObj.isCharging === 1;

    dispatch(
      updateBatteryStatus({
        batteryLevel,
        batteryCharging,
        batteryRawVoltage,
      }),
    );
  };

  onSensorDataReceived = responseStr => {
    const {props} = this;
    const {dispatch, devices, logging} = props;

    console.log('XXX onDataReceived responseStr', responseStr);

    const probesEnabled = [];
    const probeDataMatch = responseStr.match(/(R\d),(\d+\.\d+),?(\d+\.\d+)?/);
    const statsMatch = responseStr.match(/~,stats,(\d+),(\d)/);

    if (!probeDataMatch && !statsMatch) {
      console.log('XXX UNMATCHED responseStr');
      console.log('XXX data is', responseStr);
      let responseStr = responseStr.split('');
      responseStr.forEach(char => {
        console.log(char, char.charCodeAt(0));
      });
    }

    if (probeDataMatch) {
      console.log('XXX probeDataMatch', probeDataMatch);
      let turbidityEnabled = false;
      let turbidityValue = null;
      let temperatureEnabled = false;
      let temperatureValue = null;
      let rangeLabel;

      const probeSetting = probeDataMatch[1];

      if (probeSetting == 'R1') {
        rangeLabel = 'Low range';
      } else if (probeSetting == 'R2') {
        rangeLabel = 'Medium range';
      } else if (probeSetting == 'R3') {
        rangeLabel = 'High range';
      }

      if (probeDataMatch[2]) {
        turbidityEnabled = true;
        turbidityValue = parseFloat(probeDataMatch[2]);
      }
      if (
        probeDataMatch[3] &&
        parseFloat(probeDataMatch[3]) !== 0.0 &&
        parseFloat(probeDataMatch[3]) > -100
      ) {
        temperatureEnabled = true;
        temperatureValue = parseFloat(probeDataMatch[3]);
      }
      const sampleDateObj = Date.now(); // Fixed: was new Date().now()
      const tzOffsetMs = 0; // Simplified timezone handling
      const dataObjTimestamp = sampleDateObj - tzOffsetMs;
      dispatch(
        updateValues({
          probeSetting,
          rangeLabel,
          temperatureEnabled,
          turbidityEnabled,
          turbidityValue,
          temperatureValue,
          locationEnabled: this.state.locationEnabled,
          locationLat: this.state.locationLat,
          locationLng: this.state.locationLng,
          sampleDateObj,
        }),
      );
      console.log('JJJJJ this.props.sensorData', this.props.sensorData);
      if (logging.isLogging) {
        const loggingSessionId = logging.loggingSessionId;
        const dataObj = {
          loggingSessionId: logging.loggingSessionId,
          timestamp: dataObjTimestamp,
          turbidityValue,
          temperatureValue,
          locationLat: this.state.locationLat,
          locationLng: this.state.locationLng,
          batteryLevel: this.props.sensorData.batteryLevel,
          batteryRawVoltage: this.props.sensorData.batteryRawVoltage,
        };

        console.log(`adding data insidse DB ${JSON.stringify(dataObj)}`);
        dispatch(addDataToLoggingSession(loggingSessionId, dataObj));
      }
      if (devices.wiping) {
        dispatch(setWiping(false));
      }
      if (devices.sensorError) {
        dispatch(setSensorError(false));
      }
      if (!devices.sensorDataReceived) {
        dispatch(setSensorDataReceived(true));
      }
    } else if (statsMatch) {
      console.log('XXX statsMatch', statsMatch);
      const batteryLevel = parseFloat(statsMatch[1]);
      const batteryCharging = statsMatch[2] == 1 ? true : false;
      dispatch(
        updateBatteryStatus({
          batteryLevel,
          batteryCharging,
        }),
      );
    }
  };

  currentTurbidityValue = null;
  currentTemperatureValue = null;

  createDemoDataReading = () => {
    const {props} = this;
    const {dispatch, demo, sensorData, devices, logging} = props;

    let turbidityEnabled = true;
    let turbidityValue = null;
    let temperatureEnabled = true;
    let temperatureValue = null;
    let batteryLevel;
    let probeSetting = 'R3'; // Fixed: was probeSetting=="R3"
    let rangeLabel;

    if (this.currentTurbidityValue === null) {
      const turbidityRangeMin = 5;
      const turbidityRangeMax = 5000;
      turbidityValue =
        Math.round(
          ((turbidityRangeMax - turbidityRangeMin) * Math.random() +
            turbidityRangeMin) *
            100,
        ) / 100;
    } else {
      const turbidityAdjustFactor = Math.random();
      const turbidityAdjust = 300 * turbidityAdjustFactor - 150;
      turbidityValue = this.currentTurbidityValue + turbidityAdjust;
      turbidityValue = Math.round(turbidityValue * 100) / 100;
    }

    this.currentTurbidityValue = turbidityValue;

    if (this.currentTemperatureValue === null) {
      const temperatureRangeMin = 5;
      const temperatureRangeMax = 35;
      temperatureValue =
        Math.round(
          ((temperatureRangeMax - temperatureRangeMin) * Math.random() +
            temperatureRangeMin) *
            10,
        ) / 10;
    } else {
      const temperatureAdjustFactor = Math.random();
      const temperatureAdjust = 4 * temperatureAdjustFactor - 2;
      temperatureValue = this.currentTemperatureValue + temperatureAdjust;
      temperatureValue = Math.round(temperatureValue * 10) / 10;
    }

    this.currentTemperatureValue = temperatureValue;

    probeSetting = 'R3';
    rangeLabel = 'High range';

    if (turbidityValue < 1000) {
      probeSetting = 'R2';
      rangeLabel = 'Medium range';
    } else if (turbidityValue < 10) {
      probeSetting = 'R1';
      rangeLabel = 'Low range';
    }

    const sampleDateObj = Date.now(); // Fixed: was new DateTime().now()
    const tzOffsetMs = 0; // Simplified timezone handling
    const dataObjTimestamp = sampleDateObj - tzOffsetMs;
    dispatch(
      updateValues({
        probeSetting,
        rangeLabel,
        temperatureEnabled,
        turbidityEnabled,
        turbidityValue,
        temperatureValue,
        locationEnabled: this.state.locationEnabled,
        locationLat: this.state.locationLat,
        locationLng: this.state.locationLng,
        sampleDateObj,
      }),
    );

    if (logging.isLogging) {
      const loggingSessionId = logging.loggingSessionId;
      const dataObj = {
        loggingSessionId: logging.loggingSessionId,
        timestamp: dataObjTimestamp,
        turbidityValue,
        temperatureValue,
        locationLat: this.state.locationLat,
        locationLng: this.state.locationLng,
        demoModeEnabled: this.state.demoModeEnabled,
      };
      dispatch(addDataToLoggingSession(loggingSessionId, dataObj));
    }

    if (devices.wiping) {
      dispatch(setWiping(false));
    }
    if (!devices.sensorDataReceived) {
      dispatch(setSensorDataReceived(true));
    }

    if (!sensorData.batteryLevel) {
      const batteryLevelRangeMin = 60;
      const batteryLevelRangeMax = 100;
      batteryLevel = Math.round(
        (batteryLevelRangeMax - batteryLevelRangeMin) * Math.random() +
          batteryLevelRangeMin,
      );
      dispatch(
        updateBatteryStatus({
          batteryLevel,
          batteryCharging: false,
        }),
      );
    }
  };

  onDeviceDisconnected = () => {
    console.log('Device disconnected callback');
    const {dispatch} = this.props;
    const {connectedDevice} = this.state;

    if (connectedDevice) {
      console.log('Device disconnected, updating state:', connectedDevice.id);

      // Update Redux state
      dispatch(setDeviceDisconnected(connectedDevice));
      dispatch(clearConnectedDevice());

      // Update component state
      this.setState({
        connectingDevice: null,
        connectedDevice: null,
        connectionAttemptStarted: false,
      });
    } else {
      console.log('Device disconnected but no connected device in state');
      dispatch(clearConnectedDevice());
    }

    console.log('Device disconnection processing complete');
  };
  deviceDisconnect = () => {
    const {dispatch} = this.props;
    const {connectedDevice} = this.state;

    console.log('Disconnecting device:', connectedDevice);

    if (connectedDevice) {
      // First update the Redux state
      dispatch(setDeviceDisconnecting(connectedDevice));

      // Then perform the actual disconnection
      BluetoothService.disconnectConnectedDevice()
        .then(() => {
          console.log('Device disconnected successfully');
          dispatch(setDeviceDisconnected(connectedDevice));
          dispatch(clearConnectedDevice());

          // Update component state
          this.setState({
            connectingDevice: null,
            connectedDevice: null,
            connectionAttemptStarted: false,
            awaitingDevice: false,
          });
        })
        .catch(error => {
          console.error('Error disconnecting device:', error);
          // Still update the Redux state to disconnected even if there was an error
          dispatch(setDeviceDisconnected(connectedDevice));
          dispatch(clearConnectedDevice());
        });
    } else {
      console.warn('No connected device to disconnect');
      dispatch(clearConnectedDevice());
    }
  };

  cancelConnectToDevice = () => {
    this.setState({
      connectingDevice: null,
      connectedDevice: null,
      connectionAttemptStarted: false,
      awaitingDevice: false,
    });
  };

  onBluetoothStateChange = event => {
    console.log('XXX onBluetoothStateChange', event.enabled);
    this.setState({bluetoothEnabled: event.enabled});
  };

  enterDemoModeButtonPress = () => {
    this.props.dispatch(setDemoModeEnabled(true));
    this.setState({demoModeEnabled: true});
    const routeToDeviceView = CommonActions.navigate({
      name: 'DeviceView',
      params: {
        deviceDataObj: null,
        demoModeEnabled: true,
        //deviceName: "NEP-LINK BLE",
        deviceName: 'DEMO',
      },
    });
    this.props.navigation.dispatch(routeToDeviceView);
  };

  renderBody = (props, state) => {
    // console.log(
    //   'XXX this.enterDemoModeButtonPress',
    //   this.enterDemoModeButtonPress,
    // );

    const {devices} = props;
    const connectingDeviceLabel = state.connectingDevice
      ? state.connectingDevice.name
      : null;
    const deviceAddress = state.connectingDevice
      ? state.connectingDevice.address
      : null;
    const dialogVisible =
      this.state.connectingDevice !== null || this.state.awaitingDevice;

    return (
      <SafeAreaView>
        <DeviceConnectingDialog
          visible={dialogVisible}
          awaitingDevice={this.state.awaitingDevice}
          deviceStatus={props.devices.status}
          deviceLabel={connectingDeviceLabel}
          deviceAddress={deviceAddress}
          connectingDevice={state.connectingDevice}
          connectionAttemptStarted={state.connectionAttemptStarted}
          connectToDeviceHandler={this.connectToDevice}
          cancelConnectToDeviceHandler={this.cancelConnectToDevice}
        />
        <View>
          <NepLinkHeader />
          {!(
            this.state.bluetoothAvailable &&
            this.state.bluetoothEnabled &&
            this.state.bluetoothPermissions
          ) ? (
            <BluetoothDisabledError
              bluetoothAvailable={this.state.bluetoothAvailable}
              bluetoothEnabled={this.state.bluetoothEnabled}
              bluetoothPermissions={this.state.bluetoothPermissions}
            />
          ) : (
            <>
              {/* <DevicesList
                bondedDevices={devices.bondedDevicesFormatted}
                //bondedDevices={[{ name: 'NEP-LINK BLE', id: 'demo', inRange: true }]}
                connectToDeviceHandler={this.connectToDevice}
              /> */}
              <DevicesList
                bondedDevices={devices.bondedDevicesFormatted}
                connectToDeviceHandler={this.connectToDevice}
                unpairedDevices={this.state.availableDevices}
                connectToUnpairedDeviceHandler={this.connectToUnpairedDevice}
                startScanHandler={this.startScan} // ✅ required!
              />
              <DevicesListButtons
                enterDemoModeButtonPressHandler={this.enterDemoModeButtonPress}
              />
            </>
          )}
        </View>
      </SafeAreaView>
    );
  };

  render() {
    return this.renderBody(this.props, this.state);
  }
}

export default connect(({demo, devices, logging, sensorData}) => ({
  demo,
  devices,
  logging,
  sensorData,
}))(Devices);

// FUNCTIONAL BASED COMPONENT VERSION

// import React, {useState, useEffect, useRef, useCallback} from 'react';
// import {SafeAreaView, View, PermissionsAndroid, Platform} from 'react-native';
// import {useDispatch, useSelector} from 'react-redux';
// import {CommonActions, useNavigation} from '@react-navigation/native';
// import Geolocation from '@react-native-community/geolocation';
// import RNBluetoothClassic from 'react-native-bluetooth-classic';

// import BluetoothService from '../../services/BluetoothService';

// import NepLinkHeader from '../../components/Devices/NepLinkHeader';
// import BluetoothDisabledError from '../../components/Devices/BluetoothDisabledError';
// import DevicesList from '../../components/Devices/DevicesList';
// import DevicesListButtons from '../../components/Devices/DevicesListButtons';
// import DeviceConnectingDialog from '../../components/Devices/DeviceConnectingDialog';

// import {
//   setDemoModeEnabled,
//   setDeviceConnecting,
//   setDeviceConnected,
//   setDeviceDisconnecting,
//   setDeviceDisconnected,
//   clearConnectedDevice,
//   setWiping,
//   setSensorDataReceived,
//   setSensorError,
//   setDiscoveredDevices,
//   setBondedDevices,
//   addKnownDevices,
//   fetchKnownDevices,
// } from '../../actions/DeviceActions';
// import {
//   stopLogging,
//   addDataToLoggingSession,
//   saveLoggingSessionSamples,
// } from '../../actions/LoggingActions';
// import {
//   updateValues,
//   resetValues,
//   updateBatteryStatus,
// } from '../../actions/SensorDataActions';

// const Devices = () => {
//   const dispatch = useDispatch();
//   const navigation = useNavigation();

//   const demo = useSelector(state => state.demo);
//   const devices = useSelector(state => state.devices);
//   const logging = useSelector(state => state.logging);
//   const sensorData = useSelector(state => state.sensorData);

//   const [bluetoothAvailable, setBluetoothAvailable] = useState(true);
//   const [bluetoothEnabled, setBluetoothEnabled] = useState(true);
//   const [bluetoothPermissions, setBluetoothPermissions] = useState(true);
//   const [locationEnabled, setLocationEnabled] = useState(true);
//   const [awaitingDevice, setAwaitingDevice] = useState(false);
//   const [connectionAttemptStarted, setConnectionAttemptStarted] = useState(false);
//   const [connectingDevice, setConnectingDevice] = useState(null);
//   const [connectedDevice, setConnectedDevice] = useState(null);
//   const [locationLat, setLocationLat] = useState(null);
//   const [locationLng, setLocationLng] = useState(null);
//   const [lastSaveLoggingSessionSamplesCount, setLastSaveLoggingSessionSamplesCount] = useState(0);
//   const [demoModeEnabled, setDemoModeEnabledLocal] = useState(false);

//   const intervalId = useRef(null);
//   const locationUpdateId = useRef(null);
//   const currentTurbidityValue = useRef(null);
//   const currentTemperatureValue = useRef(null);

//   useEffect(() => {
//     BluetoothService.init();
//     getBluetoothPermissionsAndStartBluetoothProcesses();
//     locationUpdate();
//   }, []);

//   useEffect(() => {
//     if (logging.loggingSessionSamples.length - lastSaveLoggingSessionSamplesCount >= 10) {
//       setLastSaveLoggingSessionSamplesCount(logging.loggingSessionSamples.length);
//       dispatch(saveLoggingSessionSamples(logging.loggingSessionId, logging.loggingSessionSamples));
//     }
//   }, [logging.loggingSessionSamples]);

//   useEffect(() => {
//     if (demoModeEnabled) {
//       if (intervalId.current) clearInterval(intervalId.current);
//       intervalId.current = setInterval(() => {
//         createDemoDataReading();
//       }, 1000);
//     } else if (!demo.demoModeEnabled) {
//       clearInterval(intervalId.current);
//       currentTurbidityValue.current = null;
//       currentTemperatureValue.current = null;
//       dispatch(resetValues());
//     }
//   }, [demoModeEnabled, demo.demoModeEnabled]);

//   useEffect(() => {
//     return () => {
//       dispatch(resetValues());
//       clearInterval(intervalId.current);
//       clearInterval(locationUpdateId.current);
//     };
//   }, []);

//   const getBluetoothPermissionsAndStartBluetoothProcesses = async () => {
//     let fineLocationPermission = true;
//     let bluetoothScanPermission = true;
//     let bluetoothConnectPermission = true;

//     if (Platform.OS === 'android') {
//       if (Platform.Version < 31) {
//         fineLocationPermission = await PermissionsAndroid.request(
//           PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
//         );
//       } else {
//         const result = await PermissionsAndroid.requestMultiple([
//           PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
//           PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
//           PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//         ]);

//         bluetoothScanPermission = result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === 'granted';
//         bluetoothConnectPermission = result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === 'granted';
//         fineLocationPermission = result[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === 'granted';
//       }
//     }

//     if (bluetoothScanPermission && bluetoothConnectPermission && fineLocationPermission) {
//       setBluetoothPermissions(true);
//     } else {
//       setBluetoothPermissions(false);
//       return;
//     }

//     startScan();
//   };

//   const locationUpdate = () => {
//     locationUpdateId.current = setInterval(() => {
//       Geolocation.getCurrentPosition(
//         position => {
//           const {latitude, longitude} = position.coords;
//           setLocationLat(latitude);
//           setLocationLng(longitude);
//           setLocationEnabled(true);
//           clearInterval(locationUpdateId.current);
//         },
//         error => {
//           console.log('Location error:', error);
//           setLocationEnabled(false);
//         },
//         {enableHighAccuracy: true, timeout: 40000, maximumAge: 10000}
//       );
//     }, 30000);
//   };

//   const startScan = () => {
//     BluetoothService.startScan(
//       () => {},
//       devicesFound => {
//         updateBondedDevices(devicesFound);
//       }
//     );
//   };

//   const updateBondedDevices = bondedDevices => {
//     dispatch(setBondedDevices(bondedDevices));
//     dispatch(addKnownDevices(bondedDevices));
//   };

//   const onSensorDataReceived = useCallback(responseStr => {
//     // sensor data parsing logic here...
//   }, [dispatch, locationLat, locationLng, demoModeEnabled, logging, sensorData]);

//   const createDemoDataReading = () => {
//     // your createDemoDataReading logic as-is...
//   };

//   const enterDemoModeButtonPress = () => {
//     dispatch(setDemoModeEnabled(true));
//     setDemoModeEnabledLocal(true);
//     navigation.dispatch(
//       CommonActions.navigate({
//         name: 'DeviceView',
//         params: {
//           deviceDataObj: null,
//           demoModeEnabled: true,
//           deviceName: 'DEMO',
//         },
//       })
//     );
//   };

//   const cancelConnectToDevice = () => {
//     setConnectingDevice(null);
//     setConnectedDevice(null);
//     setConnectionAttemptStarted(false);
//     setAwaitingDevice(false);
//   };

//   const connectingDeviceLabel = connectingDevice ? connectingDevice.name : null;
//   const deviceAddress = connectingDevice ? connectingDevice.address : null;
//   const dialogVisible = !!connectingDevice || awaitingDevice;

//   return (
//     <SafeAreaView>
//       <DeviceConnectingDialog
//         visible={dialogVisible}
//         awaitingDevice={awaitingDevice}
//         deviceStatus={devices.status}
//         deviceLabel={connectingDeviceLabel}
//         deviceAddress={deviceAddress}
//         connectingDevice={connectingDevice}
//         connectionAttemptStarted={connectionAttemptStarted}
//         connectToDeviceHandler={() => {}} // implement this
//         cancelConnectToDeviceHandler={cancelConnectToDevice}
//       />
//       <View>
//         <NepLinkHeader />
//         {!(bluetoothAvailable && bluetoothEnabled && bluetoothPermissions) ? (
//           <BluetoothDisabledError
//             bluetoothAvailable={bluetoothAvailable}
//             bluetoothEnabled={bluetoothEnabled}
//             bluetoothPermissions={bluetoothPermissions}
//           />
//         ) : (
//           <>
//             <DevicesList
//               bondedDevices={devices.bondedDevicesFormatted}
//               connectToDeviceHandler={() => {}} // implement this
//             />
//             <DevicesListButtons
//               enterDemoModeButtonPressHandler={enterDemoModeButtonPress}
//             />
//           </>
//         )}
//       </View>
//     </SafeAreaView>
//   );
// };

// export default Devices;
