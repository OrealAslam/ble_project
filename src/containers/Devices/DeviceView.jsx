import React, { Component, useRef } from 'react'
import PropTypes from 'prop-types'
import { SafeAreaView, ScrollView, View, Dimensions, AppState, Alert } from 'react-native'

import BluetoothService from '../../services/BluetoothService'
import { connect } from 'react-redux'
import 'react-native-get-random-values'
import { v4 as uuidv4 } from 'uuid'
import { launchCamera } from 'react-native-image-picker'
import ViewShot, { captureRef } from 'react-native-view-shot'
import { DateTime } from 'luxon'
//import RNFS from 'react-native-fs'

import { startLogging, stopLogging, fetchLoggingSessions, saveLoggingSessionSamples } from '../../actions/LoggingActions'
import { updateValues, resetValues, updateBatteryStatus } from '../../actions/SensorDataActions'
import { setDeviceConnecting, setDeviceConnected, setDeviceDisconnecting, setDeviceDisconnected, clearConnectedDevice, setWiping,
  setSensorDataReceived, setSensorError, setDiscoveredDevices, setBondedDevices, addKnownDevices,
  fetchKnownDevices } from '../../actions/DeviceActions'

import TakePhotoDialog from '../../components/Devices/TakePhotoDialog'
import WaitingScreen from '../../components/Devices/WaitingScreen'
import LiveValues from '../../components/Devices/LiveValues'
import RangeIndicator from '../../components/Devices/RangeIndicator'
import LocationMap from '../../components/Devices/LocationMap'
import LocationNotFound from '../../components/Devices/LocationNotFound'
import LoggingButtons from '../../components/Devices/LoggingButtons'
import HeaderRightBatteryIndicator from '../../components/Devices/HeaderRightBatteryIndicator'

class DeviceView extends Component {

  constructor(props) {
    super(props)
    this.state = {
      connectedDevice: null,
      isLogging: false,
      loggingSessionSampleCount: 0,
      loggingSessionId: null,
      loggingSessionSamples: [],
      showTakePhotoDialog: false,
      goBackAfterPhoto: false,
    }
    this.mapViewRef = React.createRef()
  }

  componentDidMount() {
    console.log("XXX this.props",this.props)
    console.log("XXX this.props.route",this.props.route)
    console.log("XXX this.props.route?.params",this.props.route?.params)
    const { navigation, devices } = this.props
    this._navigationBeforeRemoveUnsubscribe = navigation.addListener("beforeRemove", (e) => {
      const { logging } = this.props
      if (logging.isLogging) {
        e.preventDefault()
        this.confirmAndEndLoggingAndConnection.call(this)
      } else {
        this.disconnectConnectedDevices.call(this)
      }
    })
    this.appStateChangeSubscription = AppState.addEventListener("change", nextAppState => {
      const { logging } = this.props
      if (logging.isLogging && nextAppState === "background") {
        this.confirmAndEndLoggingAndConnection.call(this)
      }
    })

    const { deviceDataObj } = this.props.route.params
    console.log("XXX deviceDataObj",deviceDataObj)
    console.log("XXX deviceDataObj.id",deviceDataObj.id)
    const deviceToConnect = devices.bondedDevicesRaw.find((o) => o.bleDevice.id === deviceDataObj.id)
    console.log("XXX deviceToConnect",deviceToConnect)

    BluetoothService.connectAndListen(deviceToConnect.bleDevice,this.onDataReceived)
    // //this.disconnectSubscription = RNBluetoothClassic.onDeviceDisconnected(this.onDeviceDisconnected)
    // BluetoothService.connectAndListen(deviceToConnect.bleDevice,this.onDataReceived)

  }

  componentDidUpdate() {

    const { navigation, sensorData } = this.props
    const batteryCharging = sensorData.batteryCharging
    const batteryVoltage = sensorData.batteryVoltage || 0

    navigation.setOptions({
      headerRight: () => (
        <HeaderRightBatteryIndicator
          batteryCharging={batteryCharging}
          batteryVoltage={batteryVoltage}
        />
      )
    })
  }

  componentWillUnmount() {
    this._navigationBeforeRemoveUnsubscribe()
    this.appStateChangeSubscription.remove()
    this.disconnectSubscription.remove()
  }

  startLoggingHandler = () => {
    const loggingSessionId = uuidv4()
    this.setState({ loggingSessionId: loggingSessionId, isLogging: true, loggingSessionSamples: [] })
    const connectedDevice = this.props.devices.device
    const { sensorData } = this.props
    const { turbidityEnabled, temperatureEnabled } = sensorData
    const deviceId = connectedDevice.id
    const deviceName = connectedDevice.name
    const timezoneName = DateTime.now().toFormat('z')
    const timezoneOffset = DateTime.now().toFormat('Z')
    this.props.dispatch(startLogging(loggingSessionId, deviceId, deviceName, timezoneName, timezoneOffset, turbidityEnabled, temperatureEnabled ))
    this.takeMapImageCapture()
  }


  onDataReceived = (responseStr) => {

    const { props } = this
    const { dispatch, devices, logging } = props

    console.log("XXX responseStr",responseStr)

    const probesEnabled = []
    const probeDataMatch = responseStr.match(/(R\d),(\d+\.\d+),?(\d+\.\d+)?/)
    const statsMatch = responseStr.match(/~,stats,(\d+),(\d)/)

    if (!probeDataMatch && !statsMatch) {
      console.log("XXX UNMATCHED responseStr")
      console.log("XXX data is",responseStr)
      let responseStr = responseStr.split('')
      responseStr.forEach((char) => {
        console.log(char,char.charCodeAt(0))
      })
    }

    if (probeDataMatch) {
      console.log("XXX probeDataMatch",probeDataMatch)
      let turbidityEnabled = false
      let turbidityValue = null
      let temperatureEnabled = false
      let temperatureValue = null
      let rangeLabel

      const probeSetting = probeDataMatch[1]

      if (probeSetting=="R1") {
        rangeLabel = "Low range"
      } else if (probeSetting=="R2") {
        rangeLabel = "Medium range"
      } else if (probeSetting=="R3") {
        rangeLabel = "High range"
      }

      if (probeDataMatch[2]) {
        turbidityEnabled = true
        turbidityValue = parseFloat(probeDataMatch[2])
      }
      if (probeDataMatch[3] && (parseFloat(probeDataMatch[3]) > 0)) {
        temperatureEnabled = true
        temperatureValue = parseFloat(probeDataMatch[3])
      }
      const sampleDateObj = DateTime.now() //DateTime.fromMillis(Date.parse(event.timestamp))
      const tzOffsetStr = sampleDateObj.toFormat('Z')
      const tzOffsetMs = parseInt(tzOffsetStr) * 1000 * 60 * 60
      const dataObjTimestamp = sampleDateObj.toFormat('x') - tzOffsetMs
      dispatch(updateValues({
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
      }))
      if (logging.isLogging) {
        const loggingSessionId = logging.loggingSessionId
        const dataObj = {
          loggingSessionId: logging.loggingSessionId,
          timestamp: dataObjTimestamp,
          turbidityValue,
          temperatureValue,
          locationLat: this.state.locationLat,
          locationLng: this.state.locationLng,
        }
        dispatch(addDataToLoggingSession(loggingSessionId,dataObj))
      }
      if (devices.wiping) dispatch(setWiping(false))
      if (devices.sensorError) dispatch(setSensorError(false))
      if (!devices.sensorDataReceived) dispatch(setSensorDataReceived(true))
    } else if (statsMatch) {
      console.log("XXX statsMatch",statsMatch)
      const batteryVoltage = parseFloat(statsMatch[1])
      const batteryCharging = (statsMatch[2]==1) ? true : false
      dispatch(updateBatteryStatus({
        batteryVoltage,
        batteryCharging,
      }))
    }
  }

  takeMapImageCapture = () => {

    if (!this.mapViewRef.current) return null

    captureRef(this.mapViewRef, {
      format: "jpg",
      quality: 0.8,
    }).then(
      (uri) => {
        console.log("Image saved to x", uri)
        const loggingSessionId = this.state.loggingSessionId
        const timestamp = this.props.logging.loggingSession.timestamp
        const dateTime = DateTime.fromMillis(timestamp)
        const dirName = `${RNFS.DocumentDirectoryPath}/loggingSessionFiles/${loggingSessionId}/mapimage`
        RNFS.mkdir(dirName)
          .then((r) => {
            const filePath = `${dirName}/NEP-Link-map-${dateTime.toFormat("dd-LLL-yyyy_HHmmss")}.jpg`
            RNFS.copyFile(uri,filePath)
              .then(() => {
                console.log("XXX copyFile complete",filePath)
              })
              .catch(error => {
                console.log(`XXX copyFile of ${filePath} failed`,error)
              })
          })
          .catch( error => {
            console.log("XXX error RNFS.mkdir",error)
          })
        const rootDirName = `${RNFS.DocumentDirectoryPath}/loggingSessionThumnails`
        RNFS.mkdir(rootDirName)
          .then((r) => {
            const rootFilePath = `${rootDirName}/${loggingSessionId}.jpg`
            RNFS.copyFile(uri,rootFilePath)
              .then(() => {
                console.log("XXX copyFile complete",rootFilePath)
              })
              .catch(error => {
                console.log(`XXX copyFile of ${rootFilePath} failed`,error)
              })
          })
          .catch( error => {
            console.log("XXX error RNFS.mkdir",error)
          })
      },
      (error) => {
        //console.error("Oops, snapshot failed, trying again", error)
        setTimeout(() => {
          this.takeMapImageCapture()
        },1000)
      }
    )
  }

  confirmAndEndLoggingAndConnection = () => {
    const { dispatch, devices, logging, navigation } = this.props
    const { loggingSessionId, loggingSessionSamples } = logging
    const connectedDevice = devices.device
    if (!connectedDevice) return null
    const deviceName = connectedDevice?.name || ''
    Alert.alert(
      'End Logging and Disconnect?',
      `Do you want to end your logging session and disconnect from ${deviceName}?`,
      [
        {
          text: "Continue Logging",
          style: 'cancel',
          onPress: () => {
            console.log("XXX Continue Logging")
          }
        },{
          text: 'End Logging and Disconnect',
          style: 'destructive',
          onPress: () => {
            this.setState({ isLogging: false, loggingSessionSamples: [] })
            dispatch(stopLogging())
            this.disconnectConnectedDevices.call(this)
            this.takeMapImageCapture()
            dispatch(fetchLoggingSessions())
            dispatch(saveLoggingSessionSamples(loggingSessionId,loggingSessionSamples))
            this.setState({ showTakePhotoDialog: true, goBackAfterPhoto: true })
          }
        },
      ]
    )
  }

  onDeviceDisconnected = (event: BluetoothDeviceEvent) => {
    const { dispatch, logging, navigation } = this.props
    const { loggingSessionId, loggingSessionSamples } = logging
    if (logging.isLogging) {
      this.setState({ isLogging: false, loggingSessionSamples: [] })
      dispatch(stopLogging())
      this.disconnectConnectedDevices.call(this)
      this.takeMapImageCapture()
      dispatch(fetchLoggingSessions())
      dispatch(saveLoggingSessionSamples(loggingSessionId,loggingSessionSamples))
      this.setState({ showTakePhotoDialog: true, goBackAfterPhoto: true })
    } else {
      this.disconnectConnectedDevices.call(this)
      navigation.goBack()
    }
  }

  disconnectConnectedDevices = async () => {

    // await RNBluetoothClassic.getConnectedDevices()
    // .then((connected) => {
    //   connected.forEach((deviceToDisconnect) => {
    //     deviceToDisconnect.disconnect()
    //       .then((connection) => {
    //         console.log("XXX DeviceView disconnect 1",connection)
    //       })
    //       .catch(error => {
    //         console.log("XXX DeviceView Error - Couldn't disconnect 1",error)
    //       })
    //   })
    // })

  }

  stopLoggingHandler = () => {
    const { dispatch, logging } = this.props
    const { loggingSessionId, loggingSessionSamples } = logging
    dispatch(stopLogging())
    this.setState({ isLogging: false, loggingSessionSamples: [], showTakePhotoDialog: true })
    this.takeMapImageCapture()
    dispatch(fetchLoggingSessions())
    dispatch(saveLoggingSessionSamples(loggingSessionId,loggingSessionSamples))
  }

  closeTakePhotoDialog = () => {
    this.setState({ showTakePhotoDialog: false })
  }

  launchCamera = async () => {
    this.setState({ showTakePhotoDialog: false })
    const options = {}
    await launchCamera(options, async response => {
      if (response.didCancel) {
        console.log("XXX launchCamera cancelled")
      } else if (response.error) {
        console.log('Camera Error', response.error)
      } else {
        const loggingSessionId = this.state.loggingSessionId
        const timestamp = this.props.logging.loggingSession.timestamp
        const dateTime = DateTime.fromMillis(timestamp)
        const dirName = `${RNFS.DocumentDirectoryPath}/loggingSessionFiles/${loggingSessionId}/images`
        await RNFS.mkdir(dirName)
          .then((r) => {
            const filePath = `${dirName}/NEP-Link-image-${dateTime.toFormat("dd-LLL-yyyy_HHmmss")}.jpg`
            RNFS.copyFile(response.assets[0].uri,filePath)
              .then(() => {
                console.log("XXX copyFile complete",filePath)
              })
              .catch(error => {
                console.log(`XXX copyFile of ${filePath} failed`,error)
              })
          })
          .catch( error => {
            console.log("XXX error RNFS.mkdir",error)
          })
      }
    })
    if (this.state.goBackAfterPhoto) {
      this.props.navigation.goBack()
    }
  }

  renderBody = (props,state) => {
    if (props.devices.sensorError) {
      return <SafeAreaView style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <WaitingScreen waitingText={"Sensor Error..."}/>
      </SafeAreaView>
    }
    if (props.devices.wiping) {
      return <SafeAreaView style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <WaitingScreen waitingText={"Wiping..."}/>
      </SafeAreaView>
    }
    if (!props.sensorData.turbidityEnabled && !props.sensorData.temperatureEnabled) {
      return <SafeAreaView style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <WaitingScreen waitingText={"Waiting for data..."}/>
      </SafeAreaView>
    }
    return <SafeAreaView>
      <TakePhotoDialog
        visible={state.showTakePhotoDialog}
        closeDialog={this.closeTakePhotoDialog}
        showTakePhotoComponent={this.showTakePhotoComponent}
        launchCamera={this.launchCamera}
      />
      <ScrollView>
        <LiveValues
          turbidityEnabled={props.sensorData.turbidityEnabled}
          turbidityValue={props.sensorData.turbidityValue}
          temperatureEnabled={props.sensorData.temperatureEnabled}
          temperatureValue={props.sensorData.temperatureValue}
        />
        <RangeIndicator
          rangeLabel={props.sensorData.rangeLabel}
        />
        <View ref={this.mapViewRef} style={{ width: Dimensions.get('screen').width, paddingLeft: 20, paddingRight: 20, backgroundColor: '#FFF0' }}>
        {(props.sensorData.locationLat && props.sensorData.locationLng) &&
          <LocationMap
            ref={this.mapViewRef}
            lat={props.sensorData.locationLat}
            lng={props.sensorData.locationLng}
          />
        }
        {((!props.sensorData.locationEnabled) || (!props.sensorData.locationLat && !props.sensorData.locationLng)) && <LocationNotFound
            locationEnabled={props.sensorData.locationEnabled}
            lat={props.sensorData.locationLat}
            lng={props.sensorData.locationLng}
          />
        }
        </View>
        <LoggingButtons
          isLogging={props.logging.isLogging}
          loggingSessionSampleCount={props.logging.loggingSessionSamples.length}
          startLoggingHandler={this.startLoggingHandler}
          stopLoggingHandler={this.stopLoggingHandler}
        />
      </ScrollView>
    </SafeAreaView>
  }

  render() {
    return this.renderBody(this.props,this.state)
  }

}

export default connect(({ devices, sensorData, logging }) => ({ devices, sensorData, logging }))(DeviceView)
