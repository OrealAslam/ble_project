// import React, {Component, useRef} from 'react';
// import PropTypes from 'prop-types';
// import {
//   SafeAreaView,
//   ScrollView,
//   View,
//   Dimensions,
//   AppState,
//   Alert,
// } from 'react-native';

// import BluetoothService from '../../services/BluetoothService';
// import {connect} from 'react-redux';
// import 'react-native-get-random-values';
// import {v4 as uuidv4} from 'uuid';
// import {launchCamera} from 'react-native-image-picker';
// import ViewShot, {captureRef} from 'react-native-view-shot';
// import {DateTime} from 'luxon';
// import RNFS from 'react-native-fs';

// import {
//   startLogging,
//   stopLogging,
//   fetchLoggingSessions,
//   saveLoggingSessionSamples,
// } from '../../actions/LoggingActions';
// import {
//   updateValues,
//   resetValues,
//   updateBatteryStatus,
// } from '../../actions/SensorDataActions';
// import {
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

// import {setDemoModeEnabled} from '../../actions/DemoActions';

// import TakePhotoDialog from '../../components/Devices/TakePhotoDialog';
// import WaitingScreen from '../../components/Devices/WaitingScreen';
// import LiveValues from '../../components/Devices/LiveValues';
// import RangeIndicator from '../../components/Devices/RangeIndicator';
// import LocationMap from '../../components/Devices/LocationMap';
// import LocationNotFound from '../../components/Devices/LocationNotFound';
// import LoggingButtons from '../../components/Devices/LoggingButtons';
// import HeaderRightBatteryIndicator from '../../components/Devices/HeaderRightBatteryIndicator';

// class DeviceView extends Component {
//   constructor(props) {
//     super(props);
//     this.state = {
//       connectedDevice: null,
//       isLogging: false,
//       loggingSessionSampleCount: 0,
//       loggingSessionId: null,
//       loggingSessionSamples: [],
//       showTakePhotoDialog: false,
//       goBackAfterPhoto: false,
//     };
//     this.mapViewRef = React.createRef();
//   }

//   intervalId = null;

//   componentDidMount() {
//     const {navigation, devices, dataReceivedHandler} = this.props;
//     console.log('XXXX DeviceView componentDidMount');
//   }

//   componentDidUpdate() {
//     const {navigation, sensorData} = this.props;
//     const batteryCharging = sensorData.batteryCharging;
//     const batteryLevel = sensorData.batteryLevel || 0;
//     const batteryRawVoltage = sensorData.batteryRawVoltage || 0;

//     console.log('GGG batteryRawVoltage', batteryRawVoltage);
//     console.log('GGG batteryLevel', batteryLevel);

//     navigation.setOptions({
//       headerRight: () => (
//         <HeaderRightBatteryIndicator
//           batteryLevel={batteryLevel}
//           batteryRawVoltage={batteryRawVoltage}
//           batteryCharging={batteryCharging}
//         />
//       ),
//     });
//   }

//   componentWillUnmount() {
//     console.log('XXXX componentWillUnmount');
//     // this._navigationBeforeRemoveUnsubscribe()
//     // this.appStateChangeSubscription.remove()
//     BluetoothService.disconnectConnectedDevice();

//     if (this.props.demo.demoModeEnabled) {
//       this.props.dispatch(setDemoModeEnabled(false));
//     }
//   }

//   sensorErrorTimeoutId = setTimeout(() => {
//     if (
//       !this.props.sensorData.turbidityEnabled &&
//       !this.props.sensorData.temperatureEnabled
//     ) {
//       this.props.dispatch(setSensorError(true));
//     }
//   }, 40000);

//   startLoggingHandler = () => {
//     const loggingSessionId = uuidv4();
//     this.setState({
//       loggingSessionId: loggingSessionId,
//       isLogging: true,
//       loggingSessionSamples: [],
//     });
//     const connectedDevice = this.props.devices.device;
//     const {sensorData} = this.props;
//     const {turbidityEnabled, temperatureEnabled} = sensorData;
//     const deviceId = connectedDevice?.bleDevice?.id || 'demo';
//     const deviceName = connectedDevice?.bleDevice?.name || 'DEMO';
//     const timezoneName = DateTime.now().toFormat('z');
//     const timezoneOffset = DateTime.now().toFormat('Z');
//     this.props.dispatch(
//       startLogging(
//         loggingSessionId,
//         deviceId,
//         deviceName,
//         timezoneName,
//         timezoneOffset,
//         turbidityEnabled,
//         temperatureEnabled,
//       ),
//     );
//     this.takeMapImageCapture();
//   };

//   takeMapImageCapture = () => {
//     if (!this.mapViewRef.current) {
//       return null;
//     }

//     captureRef(this.mapViewRef, {
//       format: 'jpg',
//       quality: 0.8,
//     }).then(
//       uri => {
//         console.log('Image saved to x', uri);
//         const loggingSessionId = this.state.loggingSessionId;
//         const timestamp = this.props.logging.loggingSession.timestamp;
//         const dateTime = DateTime.fromMillis(timestamp);
//         const dirName = `${RNFS.DocumentDirectoryPath}/loggingSessionFiles/${loggingSessionId}/mapimage`;
//         RNFS.mkdir(dirName)
//           .then(r => {
//             const filePath = `${dirName}/NEP-Link-map-${dateTime.toFormat(
//               'dd-LLL-yyyy_HHmmss',
//             )}.jpg`;
//             RNFS.copyFile(uri, filePath)
//               .then(() => {
//                 console.log('XXX copyFile complete', filePath);
//               })
//               .catch(error => {
//                 console.log(`XXX copyFile of ${filePath} failed`, error);
//               });
//           })
//           .catch(error => {
//             console.log('XXX error RNFS.mkdir', error);
//           });
//         const rootDirName = `${RNFS.DocumentDirectoryPath}/loggingSessionThumnails`;
//         RNFS.mkdir(rootDirName)
//           .then(r => {
//             const rootFilePath = `${rootDirName}/${loggingSessionId}.jpg`;
//             RNFS.copyFile(uri, rootFilePath)
//               .then(() => {
//                 console.log('XXX copyFile complete', rootFilePath);
//               })
//               .catch(error => {
//                 console.log(`XXX copyFile of ${rootFilePath} failed`, error);
//               });
//           })
//           .catch(error => {
//             console.log('XXX error RNFS.mkdir', error);
//           });
//       },
//       error => {
//         //console.error("Oops, snapshot failed, trying again", error)
//         setTimeout(() => {
//           this.takeMapImageCapture();
//         }, 1000);
//       },
//     );
//   };

//   confirmAndEndLoggingAndConnection = () => {
//     const {dispatch, devices, logging, navigation} = this.props;
//     const {loggingSessionId, loggingSessionSamples} = logging;
//     const connectedDevice = devices.device;
//     if (!connectedDevice) {
//       return null;
//     }
//     const deviceName = connectedDevice?.name || '';
//     Alert.alert(
//       'End Logging and Disconnect?',
//       `Do you want to end your logging session and disconnect from ${deviceName}?`,
//       [
//         {
//           text: 'Continue Logging',
//           style: 'cancel',
//           onPress: () => {
//             console.log('XXX Continue Logging');
//           },
//         },
//         {
//           text: 'End Logging and Disconnect',
//           style: 'destructive',
//           onPress: () => {
//             this.setState({isLogging: false, loggingSessionSamples: []});
//             dispatch(stopLogging());
//             this.disconnectConnectedDevices.call(this);
//             this.takeMapImageCapture();
//             dispatch(fetchLoggingSessions());
//             dispatch(
//               saveLoggingSessionSamples(
//                 loggingSessionId,
//                 loggingSessionSamples,
//               ),
//             );
//             this.setState({showTakePhotoDialog: true, goBackAfterPhoto: true});
//           },
//         },
//       ],
//     );
//   };

//   stopLoggingHandler = () => {
//     const {dispatch, logging} = this.props;
//     const {loggingSessionId, loggingSessionSamples} = logging;
//     dispatch(stopLogging());
//     this.setState({
//       isLogging: false,
//       loggingSessionSamples: [],
//       showTakePhotoDialog: true,
//     });
//     this.takeMapImageCapture();
//     dispatch(fetchLoggingSessions());
//     dispatch(
//       saveLoggingSessionSamples(loggingSessionId, loggingSessionSamples),
//     );
//   };

//   closeTakePhotoDialog = () => {
//     this.setState({showTakePhotoDialog: false});
//   };

//   execLaunchCamera = async () => {
//     const options = {cameraType: 'back'};
//     await launchCamera(options, async response => {
//       if (response.didCancel) {
//         console.log('XXX launchCamera cancelled');
//       } else if (response.error) {
//         console.log('XXX launchCamera Camera Error', response.error);
//       } else {
//         const loggingSessionId = this.state.loggingSessionId;
//         const timestamp = this.props.logging.loggingSession.timestamp;
//         const dateTime = DateTime.fromMillis(timestamp);
//         const dirName = `${RNFS.DocumentDirectoryPath}/loggingSessionFiles/${loggingSessionId}/images`;
//         await RNFS.mkdir(dirName)
//           .then(r => {
//             const filePath = `${dirName}/NEP-Link-image-${dateTime.toFormat(
//               'dd-LLL-yyyy_HHmmss',
//             )}.jpg`;
//             RNFS.copyFile(response.assets[0].uri, filePath)
//               .then(() => {
//                 console.log('XXX launchCamera copyFile complete', filePath);
//               })
//               .catch(error => {
//                 console.log(
//                   `XXX launchCamera copyFile of ${filePath} failed`,
//                   error,
//                 );
//               });
//           })
//           .catch(error => {
//             console.log('XXX launchCamera error RNFS.mkdir', error);
//           });
//       }
//     });
//     this.setState({showTakePhotoDialog: false});
//     if (this.state.goBackAfterPhoto) {
//       this.props.navigation.goBack();
//     }
//   };

//   renderBody = (props, state) => {
//     const mapHeight = parseInt(Dimensions.get('screen').width * 0.6);

//     if (props.devices.sensorError) {
//       return (
//         <SafeAreaView
//           style={{display: 'flex', flexDirection: 'column', flex: 1}}>
//           <WaitingScreen waitingText={'Sensor Error...'} />
//         </SafeAreaView>
//       );
//     }
//     if (props.devices.wiping) {
//       return (
//         <SafeAreaView
//           style={{display: 'flex', flexDirection: 'column', flex: 1}}>
//           <WaitingScreen waitingText={'Wiping...'} />
//         </SafeAreaView>
//       );
//     }
//     if (
//       !props.sensorData.turbidityEnabled &&
//       !props.sensorData.temperatureEnabled
//     ) {
//       return (
//         <SafeAreaView
//           style={{display: 'flex', flexDirection: 'column', flex: 1}}>
//           <WaitingScreen waitingText={'Waiting for data...'} />
//         </SafeAreaView>
//       );
//     }
//     return (
//       <SafeAreaView>
//         <TakePhotoDialog
//           visible={state.showTakePhotoDialog}
//           closeDialog={this.closeTakePhotoDialog}
//           showTakePhotoComponent={this.showTakePhotoComponent}
//           launchCamera={this.execLaunchCamera}
//         />
//         <ScrollView>
//           <LiveValues
//             turbidityValue={props.sensorData.turbidityValue}
//             temperatureEnabled={props.sensorData.temperatureEnabled}
//             temperatureValue={props.sensorData.temperatureValue}
//           />
//           <RangeIndicator rangeLabel={props.sensorData.rangeLabel} />
//           <View
//             ref={this.mapViewRef}
//             style={{
//               width: Dimensions.get('screen').width,
//               paddingLeft: 20,
//               paddingRight: 20,
//               backgroundColor: '#FFF0',
//             }}>
//             {props.sensorData.locationLat && props.sensorData.locationLng && (
//               <LocationMap
//                 ref={this.mapViewRef}
//                 lat={props.sensorData.locationLat}
//                 lng={props.sensorData.locationLng}
//                 mapHeight={mapHeight}
//               />
//             )}
//             {(!props.sensorData.locationEnabled ||
//               (!props.sensorData.locationLat &&
//                 !props.sensorData.locationLng)) && (
//               <LocationNotFound
//                 locationEnabled={props.sensorData.locationEnabled}
//                 lat={props.sensorData.locationLat}
//                 lng={props.sensorData.locationLng}
//                 mapHeight={mapHeight}
//               />
//             )}
//           </View>
//           <LoggingButtons
//             isLogging={props.logging.isLogging}
//             loggingSessionSampleCount={
//               props.logging.loggingSessionSamples.length
//             }
//             startLoggingHandler={this.startLoggingHandler}
//             stopLoggingHandler={this.stopLoggingHandler}
//           />
//         </ScrollView>
//       </SafeAreaView>
//     );
//   };

//   render() {
//     return this.renderBody(this.props, this.state);
//   }
// }

// export default connect(({demo, devices, sensorData, logging}) => ({
//   demo,
//   devices,
//   sensorData,
//   logging,
// }))(DeviceView);

import React, {useEffect, useRef, useState} from 'react';
import {SafeAreaView, ScrollView, View, Dimensions, Alert} from 'react-native';
import {connect, useDispatch, useSelector} from 'react-redux';
import {CommonActions, useNavigation} from '@react-navigation/native';
import {launchCamera} from 'react-native-image-picker';
import ViewShot, {captureRef} from 'react-native-view-shot';
import RNFS from 'react-native-fs';
import uuid from 'react-native-uuid';

import BluetoothService from '../../services/BluetoothService1';

import {
  startLogging,
  stopLogging,
  fetchLoggingSessions,
  saveLoggingSessionSamples,
} from '../../actions/LoggingActions';
import {setSensorError} from '../../actions/DeviceActions';
import {setDemoModeEnabled} from '../../actions/DemoActions';

import TakePhotoDialog from '../../components/Devices/TakePhotoDialog';
import WaitingScreen from '../../components/Devices/WaitingScreen';
import LiveValues from '../../components/Devices/LiveValues';
import RangeIndicator from '../../components/Devices/RangeIndicator';
import LocationMap from '../../components/Devices/LocationMap';
import LocationNotFound from '../../components/Devices/LocationNotFound';
import LoggingButtons from '../../components/Devices/LoggingButtons';
import HeaderRightBatteryIndicator from '../../components/Devices/HeaderRightBatteryIndicator';

const DeviceView = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const devices = useSelector(state => state.devices);
  const sensorData = useSelector(state => state.sensorData);
  const logging = useSelector(state => state.logging);
  const demo = useSelector(state => state.demo);

  const [loggingSessionId, setLoggingSessionId] = useState(null);
  const [showTakePhotoDialog, setShowTakePhotoDialog] = useState(false);
  const [goBackAfterPhoto, setGoBackAfterPhoto] = useState(false);

  const mapViewRef = useRef();

  const mapHeight = parseInt(Dimensions.get('screen').width * 0.6);

  useEffect(() => {
    const batteryLevel = sensorData.batteryLevel || 0;
    const batteryRawVoltage = sensorData.batteryRawVoltage || 0;

    navigation.setOptions({
      headerRight: () => (
        <HeaderRightBatteryIndicator
          batteryLevel={batteryLevel}
          batteryRawVoltage={batteryRawVoltage}
          batteryCharging={sensorData.batteryCharging}
        />
      ),
    });
  }, [navigation, sensorData]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!sensorData.turbidityEnabled && !sensorData.temperatureEnabled) {
        dispatch(setSensorError(true));
      }
    }, 40000);
    return () => clearTimeout(timeoutId);
  }, [dispatch, sensorData]);

  useEffect(() => {
    return () => {
      BluetoothService.disconnectConnectedDevice();
      if (demo.demoModeEnabled) {
        dispatch(setDemoModeEnabled(false));
      }
    };
  }, [demo, dispatch]);

  const takeMapImageCapture = () => {
    if (!mapViewRef.current) {
      return;
    }

    captureRef(mapViewRef, {
      format: 'jpg',
      quality: 0.8,
    })
      .then(async uri => {
        const timestamp = logging?.loggingSession?.timestamp || Date.now();
        const dateTime = new Date(timestamp);
        const sessionId = loggingSessionId;

        const formattedDate = `${dateTime.getDate()}-${dateTime.toLocaleString(
          'default',
          {month: 'short'},
        )}-${dateTime.getFullYear()}_${dateTime.getHours()}${dateTime.getMinutes()}${dateTime.getSeconds()}`;

        const dirPath = `${RNFS.DocumentDirectoryPath}/loggingSessionFiles/${sessionId}/mapimage`;
        const filePath = `${dirPath}/NEP-Link-map-${formattedDate}.jpg`;

        await RNFS.mkdir(dirPath);
        await RNFS.copyFile(uri, filePath);

        const thumbPath = `${RNFS.DocumentDirectoryPath}/loggingSessionThumnails/${sessionId}.jpg`;
        await RNFS.mkdir(
          `${RNFS.DocumentDirectoryPath}/loggingSessionThumnails`,
        );
        await RNFS.copyFile(uri, thumbPath);
      })
      .catch(() => {
        setTimeout(() => takeMapImageCapture(), 1000);
      });
  };

  const startLoggingHandler = () => {
    // const id = uuidv4();
    const id = uuid.v4();

    // console.log('Starting logging session with ID:', id);
    setLoggingSessionId(id);

    const connectedDevice = devices.device;
    const deviceId = connectedDevice?.bleDevice?.id || 'demo';
    const deviceName = connectedDevice?.bleDevice?.name || 'DEMO';

    const now = new Date();
    const timezoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timezoneOffset = (now.getTimezoneOffset() / -60).toFixed(2);

    dispatch(
      startLogging(
        id,
        deviceId,
        deviceName,
        timezoneName,
        timezoneOffset,
        sensorData.turbidityEnabled,
        sensorData.temperatureEnabled,
      ),
    );

    takeMapImageCapture();
  };

  const stopLoggingHandler = () => {
    dispatch(stopLogging());
    dispatch(fetchLoggingSessions());
    dispatch(
      saveLoggingSessionSamples(
        logging.loggingSessionId,
        logging.loggingSessionSamples,
      ),
    );
    takeMapImageCapture();
    setShowTakePhotoDialog(true);
  };

  const confirmAndEndLoggingAndConnection = () => {
    const connectedDevice = devices.device;
    if (!connectedDevice) {
      return;
    }

    Alert.alert(
      'End Logging and Disconnect?',
      `Do you want to end your logging session and disconnect from ${
        connectedDevice?.name || ''
      }?`,
      [
        {text: 'Continue Logging', style: 'cancel'},
        {
          text: 'End Logging and Disconnect',
          style: 'destructive',
          onPress: () => {
            dispatch(stopLogging());
            BluetoothService.disconnectConnectedDevice();
            takeMapImageCapture();
            dispatch(fetchLoggingSessions());
            dispatch(
              saveLoggingSessionSamples(
                logging.loggingSessionId,
                logging.loggingSessionSamples,
              ),
            );
            setShowTakePhotoDialog(true);
            setGoBackAfterPhoto(true);
          },
        },
      ],
    );
  };

  const execLaunchCamera = async () => {
    await launchCamera({cameraType: 'back'}, async response => {
      if (!response.didCancel && !response.error && response.assets?.[0]?.uri) {
        const timestamp = logging?.loggingSession?.timestamp || Date.now();
        const dateTime = new Date(timestamp);
        const formattedDate = `${dateTime.getDate()}-${dateTime.toLocaleString(
          'default',
          {month: 'short'},
        )}-${dateTime.getFullYear()}_${dateTime.getHours()}${dateTime.getMinutes()}${dateTime.getSeconds()}`;

        const dirPath = `${RNFS.DocumentDirectoryPath}/loggingSessionFiles/${loggingSessionId}/images`;
        const filePath = `${dirPath}/NEP-Link-image-${formattedDate}.jpg`;

        await RNFS.mkdir(dirPath);
        await RNFS.copyFile(response.assets[0].uri, filePath);
      }
    });
    setShowTakePhotoDialog(false);
    if (goBackAfterPhoto) {
      navigation.goBack();
    }
  };

  if (devices.sensorError) {
    return <WaitingScreen waitingText="Sensor Error..." />;
  }

  if (devices.wiping) {
    return <WaitingScreen waitingText="Wiping..." />;
  }

  if (!sensorData.turbidityEnabled && !sensorData.temperatureEnabled) {
    return <WaitingScreen waitingText="Waiting for data..." />;
  }

  return (
    <SafeAreaView style={{flex: 1}}>
      <TakePhotoDialog
        visible={showTakePhotoDialog}
        closeDialog={() => setShowTakePhotoDialog(false)}
        launchCamera={execLaunchCamera}
      />
      <ScrollView>
        <LiveValues
          turbidityValue={sensorData.turbidityValue}
          temperatureEnabled={sensorData.temperatureEnabled}
          temperatureValue={sensorData.temperatureValue}
        />
        <RangeIndicator rangeLabel={sensorData.rangeLabel} />
        <View
          ref={mapViewRef}
          style={{
            width: 300,
            paddingLeft: 20,
            paddingRight: 20,
            backgroundColor: '#FFF0',
          }}>
          {sensorData.locationLat && sensorData.locationLng ? (
            <LocationMap
              ref={mapViewRef}
              lat={sensorData.locationLat}
              lng={sensorData.locationLng}
              mapHeight={mapHeight}
            />
          ) : (
            <LocationNotFound
              locationEnabled={sensorData.locationEnabled}
              lat={sensorData.locationLat}
              lng={sensorData.locationLng}
              mapHeight={mapHeight}
            />
          )}
        </View>
        <LoggingButtons
          isLogging={logging.isLogging}
          loggingSessionSampleCount={logging.loggingSessionSamples.length}
          startLoggingHandler={startLoggingHandler}
          stopLoggingHandler={stopLoggingHandler}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default DeviceView;
