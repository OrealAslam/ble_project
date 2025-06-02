import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { SafeAreaView, View, PermissionsAndroid, Platform } from 'react-native'

import BluetoothService from '../../services/BluetoothService'
import { connect } from 'react-redux'
import { CommonActions } from '@react-navigation/native'
import RNLocation from 'react-native-location'
import { DateTime } from 'luxon'

import { setDemoModeEnabled } from '../../actions/DemoActions'
import { setDeviceConnecting, setDeviceConnected, setDeviceDisconnecting, setDeviceDisconnected, clearConnectedDevice, setWiping,
  setSensorDataReceived, setSensorError, setDiscoveredDevices, setBondedDevices, addKnownDevices,
  fetchKnownDevices } from '../../actions/DeviceActions'
import { stopLogging } from '../../actions/LoggingActions'

import { updateValues, resetValues, updateBatteryStatus } from '../../actions/SensorDataActions'
import NepLinkHeader from '../../components/Devices/NepLinkHeader'
import BluetoothDisabledError from '../../components/Devices/BluetoothDisabledError'
import DevicesList from '../../components/Devices/DevicesList'
import DevicesListButtons from '../../components/Devices/DevicesListButtons'
import DeviceConnectingDialog from '../../components/Devices/DeviceConnectingDialog'
import { addDataToLoggingSession, saveLoggingSessionSamples } from '../../actions/LoggingActions'

class Devices extends Component {

  constructor(props) {
    super(props)
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
      demoModeEnabled: false
    }
  }

  async componentDidMount() {

    console.log("XXX Devices componentDidMount")

    BluetoothService.init()

    await this.getBluetoothPermissionsAndStartBluetoothProcesses.call(this)
    this.locationUpdate.call(this)

  }

  startScan = () => {
    console.log("XXX startScan")
    BluetoothService.startScan(() => {
      console.log("XXX bluetoothStateFunction")
    },
    (devicesFound) => {
      console.log("XXX updateFunction",devicesFound)
      this.updateBondedDevices(devicesFound)
    })
  }

  getBluetoothPermissionsAndStartBluetoothProcesses = async () => {

   let fineLocationPermission = true
      bluetoothScanPermission = true,
      bluetoothConnectPermission = true

    if (Platform.OS === 'android') {
      if (Platform.Version < 31) {
        fineLocationPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        ).catch(error => {
          console.log("XXX can't run PermissionsAndroid.request PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION",error)
        })
      } else {
        const requestMultiplePermissionsResult = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ])
        if (!requestMultiplePermissionsResult) {
          fineLocationPermission = false
          bluetoothScanPermission = false
          bluetoothConnectPermission = false
        }
      }
    }

    if (bluetoothScanPermission && bluetoothConnectPermission && fineLocationPermission) {
      if (!this.state.bluetoothPermissions) {
        this.setState({
          bluetoothPermissions: true,
        })
      }
    } else if (this.state.bluetoothPermissions) {
      this.setState({
        bluetoothPermissions: false,
      })
      return false
    }

    console.log("KKK getBluetoothPermissionsAndStartBluetoothProcesses passed")
    console.log("KKK fineLocationPermission",fineLocationPermission)
    console.log("KKK bluetoothScanPermission",bluetoothScanPermission)
    console.log("KKK bluetoothConnectPermission",bluetoothConnectPermission)

    this.startScan.call(this)

  }

  componentDidUpdate(prevProps,prevState) {

    const { logging, dispatch, demo } = this.props
    const { loggingSessionId, loggingSessionSamples } = logging
    if ((loggingSessionSamples.length-this.state.lastSaveLoggingSessionSamplesCount) >= 10) {
      this.setState({
        lastSaveLoggingSessionSamplesCount: logging.loggingSessionSamples.length
      })
      dispatch(saveLoggingSessionSamples(loggingSessionId,loggingSessionSamples))
    }

    if (!prevState.demoModeEnabled && this.state.demoModeEnabled) {
      if (this.intervalId) clearInterval(this.intervalId)
      this.intervalId = setInterval(() => {
        this.createDemoDataReading.call(this)
      },1000)
    }

    if (prevProps.demo.demoModeEnabled && (demo.demoModeEnabled === false)) {

      this.currentTurbidityValue = null
      this.currentTemperatureValue = null

      this.setState({ demoModeEnabled: false })

      this.props.dispatch(resetValues())

    }

    if (!demo.demoModeEnabled && this.intervalId) clearInterval(this.intervalId)

  }

  componentWillUnmount() {
    this.props.dispatch(resetValues())
  }

  locationUpdateId = null
  locationSubscription = null

  locationUpdate = async () => {

    console.log("KKK locationUpdate - Running...")

    this.locationUpdateId = setInterval(async () => {

      const permissionsAndroidGranted = (Platform.OS === "android") ? await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION) : null

      const requestPermissionResponse = await RNLocation.requestPermission({
        ios: "whenInUse",
        android: {
          detail: "fine"
        }
      })
      .catch(error => {
        console.log("KKK locationUpdate Error running RNLocation.requestPermission",error)
        this.setState({ locationEnabled: false })
      })
      console.log("KKK locationUpdate finished RNLocation.requestPermission",requestPermissionResponse)
      // console.log("XXX locationUpdate running RNLocation.configure")
      console.log("KKK locationUpdate setInterval 2")
      const cret = RNLocation.configure({
          distanceFilter: 5.0,
          desiredAccuracy: {
            ios: "nearestTenMeters",
            android: "balancedPowerAccuracy"
          }
        })

      console.log("KKK locationUpdate setInterval 3")
      const getCurrentPermissionResponse = await RNLocation.getCurrentPermission()
      console.log("KKK locationUpdate finished checking location permission",getCurrentPermissionResponse)
      console.log("KKK locationUpdate",{lat: this.state.locationLat, lng: this.state.locationLng})
      console.log("KKK locationUpdate trying location again")
      if (this.state.locationLat && this.state.locationLng) {
        clearInterval(this.locationUpdateId)
        console.log("KKKK locationUpdate returning")
        return
      }
      // console.log("XXX locationUpdate clearing locationSubscription")
      if (this.locationSubscription) {
        await this.locationSubscription()
      }

      // console.log("KKKKK locationUpdate getLatestLocationInterval trying RNLocation.getLatestLocation at",new Date())
      await RNLocation.getLatestLocation({ timeout: 40000 })
        .then(location => {
          console.log("KKKKK locationUpdate getLatestLocationInterval latestLocation",location)
          if (location && (typeof location.latitude === 'number')) {
          console.log("KKK setting state 1")
            this.setState({
              locationEnabled: true,
              locationLat: location.latitude,
              locationLng: location.longitude,
            },() => {
              //console.warn("KKKK locationUpdate RNLocation.getLatestLocation update",{ lat: this.state.locationLat, lng: this.state.locationLng })
              console.log("KKKK locationUpdate RNLocation.getLatestLocation update",{ lat: this.state.locationLat, lng: this.state.locationLng })
            })
          }
        })
        .catch(error => {
          // console.log("XXX locationUpdate getLatestLocationInterval error",error)
          this.setState({ locationEnabled: false })
        })

      // console.log("XXX locationUpdate getLatestLocationInterval completed this RNLocation.getLatestLocation at",new Date())
      // console.warn("XXX locationUpdate getLatestLocationInterval current lat/lng",{lat: this.state.locationLat, lng: this.state.locationLng})
      // console.log("XXX locationUpdate getLatestLocationInterval current lat/lng",{lat: this.state.locationLat, lng: this.state.locationLng})

      this.locationSubscription = RNLocation.subscribeToLocationUpdates(locations => {
        //console.warn("LOCATIONS",locations)
        const location = locations[0]
        console.log("KKKK locationUpdate locations.length 2 ---",locations.length)
        console.log("KKKK locationUpdate locations 2",locations)
        console.log("KKKK locationUpdate location 2",location)
        if (location && (typeof location.latitude === 'number')) {
          console.log("KKK setting state 2")
          this.setState({
            locationEnabled: true,
            locationLat: location.latitude,
            locationLng: location.longitude,
          },() => {
            //console.warn("KKKK locationUpdate RNLocation.subscribeToLocationUpdates update",{ lat: this.state.locationLat, lng: this.state.locationLng })
            console.log("KKKK locationUpdate RNLocation.subscribeToLocationUpdates update",{ lat: this.state.locationLat, lng: this.state.locationLng })
            clearInterval(this.locationUpdateId)
          })
        }
      })

    },30000)

  }

  getConnectedDevices = () => {
    RNBluetoothClassic.getConnectedDevices()
      .then((connected) => {
        console.log("XXX connected",connected)
        this.updateConnectedDevices.call(this,connected)
        setTimeout(() => {
          this.getConnectedDevices.call(this)
        },3000)
      })
      .catch(error => {
        console.log("RNBluetoothClassic.getConnectedDevices error",error)
      })
  }

  getDevicesInRange = () => {
    const { dispatch } = this.props
    const bondedDevicesFormatted = [ ...this.state.bondedDevicesFormatted ]
    bondedDevicesFormatted.forEach((bondedDevice) => {
      bondedDevice['inRange'] = (this.state.devicesInRangeAddresses.indexOf(bondedDevice.address) > -1)
    })
    this.setState({ bondedDevicesFormatted })
  }

  updateBondedDevices = (bondedDevices) => {
    this.props.dispatch(setBondedDevices(bondedDevices))
    this.props.dispatch(addKnownDevices(bondedDevices))
  }

  updateConnectedDevices = (connectedDevices) => {

    const { dispatch, devices } = this.props

    const connectedDevicesFormatted = connectedDevices.map(({id,address,name}) => {
      return {
        id,
        address,
        name,
        inRange: false,
      }
    })
    .sort((a, b) => a.name > b.name ? 1 : -1)

    if (connectedDevices.length && !this.state.connectedDevice) {
      const connectedDevice = connectedDevices[0]
      const deviceDataObj = devices.bondedDevicesFormatted.find((o) => o.address === connectedDevice.address)
      this.setState({
        connectedDevicesRaw: connectedDevices,
        connectedDevicesFormatted,
        connectedDevice: connectedDevice,
        connectingDevice: null,
      })
      dispatch(setDeviceConnected(deviceDataObj))
      const routeToDeviceView = CommonActions.navigate({
        name: 'DeviceView',
        params: {
          deviceName: deviceDataObj.name
        }
      })
      this.props.navigation.dispatch(routeToDeviceView)
    } else if (!connectedDevices.length) {
      if (this.state.connectedDevicesRaw.length || this.state.connectedDevice) {
        this.setState({
          connectedDevicesRaw: [],
          connectedDevicesFormatted: [],
          connectedDevice: null,
        })
      }
      if (devices.connectedDevice) dispatch(clearConnectedDevice())
    }
    console.log("XXX connectedDevices",connectedDevices)
  }

  connectToDevice = (device) => {
    BluetoothService.stopScan()
    const { props } = this
    const { dispatch, navigation, devices } = props
    const deviceToConnect = devices.bondedDevicesRaw.find((o) => o.bleDevice.id === device.id)
    const deviceDataObj = devices.bondedDevicesFormatted.find((o) => o.id === device.id)
    // console.log("XXX device.id",device.id)
    // console.log("XXX devices.bondedDevicesRaw",devices.bondedDevicesRaw)
    // console.log("XXX deviceToConnect",deviceToConnect)
    this.setState({ awaitingDevice: true, connectingDevice: null, connectedDevice: null })
    if (!deviceToConnect) {// || !deviceToConnect.isConnected) {
      this.setState({ awaitingDevice: true, connectingDevice: null, connectedDevice: null })
      setTimeout(() => {
        console.log("XXX running again")
        this.connectToDevice.call(this,device)
      },1000)
      return
    }
    dispatch(setWiping(false))
    dispatch(setSensorError(false))
    dispatch(setSensorDataReceived(false))
    this.setState({ awaitingDevice: false, connectingDevice: deviceToConnect, connectedDevice: null })
    BluetoothService.connectAndListen(deviceToConnect.bleDevice,this.onConnected,this.onSensorDataReceived,this.onBatteryDataReceived,this.onDeviceDisconnected)
    dispatch(setDeviceConnected(deviceToConnect))
    const routeToDeviceView = CommonActions.navigate({
      name: 'DeviceView',
      params: {
        deviceDataObj,
        deviceName: deviceDataObj.name
      }
    })
    this.props.navigation.dispatch(routeToDeviceView)
  }

  onConnected = () => {
    const { props } = this
    const { dispatch, navigation, devices } = props
    dispatch(setWiping(true))
    setTimeout(() => {
      dispatch(setWiping(false))
    },10000)
  }

  onBatteryDataReceived = (batteryDataObj) => {

    console.log("XXX onBatteryDataReceived",batteryDataObj)

    const { props } = this
    const { dispatch, devices, logging } = props

    const batteryPercentage = !isNaN(batteryDataObj['percentage']) ? parseInt(batteryDataObj['percentage']) : 0
    const batteryRawVoltage = !isNaN(batteryDataObj['rawVoltage']) ? parseInt(batteryDataObj['rawVoltage']) : 0
    const batteryLevel = (batteryPercentage > 0) ? batteryPercentage : 0
    const batteryCharging = (batteryDataObj['isCharging'] === 1)

    dispatch(updateBatteryStatus({
      batteryLevel,
      batteryCharging,
      batteryRawVoltage,
    }))

  }

  onSensorDataReceived = (responseStr) => {

    const { props } = this
    const { dispatch, devices, logging } = props

    console.log("XXX onDataReceived responseStr",responseStr)

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
      if (probeDataMatch[3] && (parseFloat(probeDataMatch[3]) !== 0.00) && (parseFloat(probeDataMatch[3]) > -100)) {
        temperatureEnabled = true
        temperatureValue = parseFloat(probeDataMatch[3])
        }
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
      console.log("JJJJJ this.props.sensorData",this.props.sensorData)
      if (logging.isLogging) {
        const loggingSessionId = logging.loggingSessionId
        const dataObj = {
          loggingSessionId: logging.loggingSessionId,
          timestamp: dataObjTimestamp,
          turbidityValue,
          temperatureValue,
          locationLat: this.state.locationLat,
          locationLng: this.state.locationLng,
          batteryLevel: this.props.sensorData.batteryLevel,
          batteryRawVoltage: this.props.sensorData.batteryRawVoltage,
        }
        dispatch(addDataToLoggingSession(loggingSessionId,dataObj))
      }
      if (devices.wiping) dispatch(setWiping(false))
      if (devices.sensorError) dispatch(setSensorError(false))
      if (!devices.sensorDataReceived) dispatch(setSensorDataReceived(true))
    } else if (statsMatch) {
      console.log("XXX statsMatch",statsMatch)
      const batteryLevel = parseFloat(statsMatch[1])
      const batteryCharging = (statsMatch[2]==1) ? true : false
      dispatch(updateBatteryStatus({
        batteryLevel,
        batteryCharging,
      }))
    }
  }

  currentTurbidityValue = null
  currentTemperatureValue = null

  createDemoDataReading = () => {

    const { props } = this
    const { dispatch, demo, sensorData, devices, logging } = props

    let turbidityEnabled = true
    let turbidityValue = null
    let temperatureEnabled = true
    let temperatureValue = null
    let batteryLevel
    let probeSetting
    let rangeLabel

    if (this.currentTurbidityValue === null) {
      const turbidityRangeMin = 5
      const turbidityRangeMax = 5000
      turbidityValue = Math.round((((turbidityRangeMax-turbidityRangeMin) * Math.random()) + turbidityRangeMin) * 100) / 100
    } else {
      const turbidityAdjustFactor = Math.random()
      const turbidityAdjust = (300 * turbidityAdjustFactor) - 150
      turbidityValue = this.currentTurbidityValue + turbidityAdjust
      turbidityValue = Math.round(turbidityValue * 100)/100
    }

    this.currentTurbidityValue = turbidityValue

    if (this.currentTemperatureValue === null) {
      const temperatureRangeMin = 5
      const temperatureRangeMax = 35
      temperatureValue = Math.round((((temperatureRangeMax-temperatureRangeMin) * Math.random()) + temperatureRangeMin) * 10) / 10
    } else {
      const temperatureAdjustFactor = Math.random()
      const temperatureAdjust = (4 * temperatureAdjustFactor) - 2
      temperatureValue = this.currentTemperatureValue + temperatureAdjust
      temperatureValue = Math.round(temperatureValue * 10)/10
    }

    this.currentTemperatureValue = temperatureValue

    probeSetting=="R3"
    rangeLabel = "High range"

    if (turbidityValue < 1000) {
      probeSetting=="R2"
      rangeLabel = "Medium range"
    } else if (turbidityValue < 10) {
      probeSetting=="R1"
      rangeLabel = "Low range"
    }

    const sampleDateObj = DateTime.now()
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
        demoModeEnabled: this.state.demoModeEnabled,
      }
      dispatch(addDataToLoggingSession(loggingSessionId,dataObj))
    }

    if (devices.wiping) dispatch(setWiping(false))
    if (!devices.sensorDataReceived) dispatch(setSensorDataReceived(true))

    if (!sensorData.batteryLevel) {
      const batteryLevelRangeMin = 60
      const batteryLevelRangeMax = 100
      batteryLevel = Math.round(((batteryLevelRangeMax-batteryLevelRangeMin) * Math.random()) + batteryLevelRangeMin)
      dispatch(updateBatteryStatus({
        batteryLevel,
        batteryCharging: false,
      }))
    }

  }

  onDeviceDisconnected = () => {
    console.log("XXX Devices onDeviceDisconnected")
    const { devices, dispatch, navigation } = this.props
    const { connectedDevice } = this.state
    if (connectedDevice) {
      const deviceDataObj = devices.bondedDevicesFormatted.find((o) => o.address === connectedDevice.address)
      dispatch(setDeviceDisconnected(deviceDataObj))
    } else {
      dispatch(clearConnectedDevice())
    }
    dispatch(resetValues())
    if (navigation.canGoBack()) navigation.goBack()
    console.log("XXX Devices onDeviceDisconnected DONE")
  }

  deviceDisconnect = () => {
    const { dispatch } = this.props
  }

  cancelConnectToDevice = () => {
    this.setState({
      connectingDevice: null,
      connectedDevice: null,
      connectionAttemptStarted: false,
      awaitingDevice: false,
    })
  }

  onBluetoothStateChange = (event) => {
    console.log("XXX onBluetoothStateChange",event.enabled)
    this.setState({ bluetoothEnabled: event.enabled })
  }

  enterDemoModeButtonPress = () => {
    this.props.dispatch(setDemoModeEnabled(true))
    this.setState({ demoModeEnabled: true })
    const routeToDeviceView = CommonActions.navigate({
      name: 'DeviceView',
      params: {
        deviceDataObj: null,
        demoModeEnabled: true,
        //deviceName: "NEP-LINK BLE",
        deviceName: "DEMO",
      }
    })
    this.props.navigation.dispatch(routeToDeviceView)
  }

  renderBody = (props,state) => {

    console.log("XXX this.enterDemoModeButtonPress",this.enterDemoModeButtonPress)

    const { devices } = props
    const connectingDeviceLabel = state.connectingDevice ? state.connectingDevice.name : null
    const deviceAddress = state.connectingDevice ? state.connectingDevice.address : null
    const dialogVisible = ((this.state.connectingDevice !== null) || (this.state.awaitingDevice))

    return <SafeAreaView>
      <DeviceConnectingDialog
        visible={dialogVisible}
        awaitingDevice={this.state.awaitingDevice}
        deviceStatus={props.devices.status}
        deviceLabel={connectingDeviceLabel}
        deviceAddress={deviceAddress}
        connectingDevice={state.connectingDevice}
        connectionAttemptStarted={ state.connectionAttemptStarted}
        connectToDeviceHandler={this.connectToDevice}
        cancelConnectToDeviceHandler={this.cancelConnectToDevice}
      />
      <View>
        <NepLinkHeader />
        {(!( this.state.bluetoothAvailable && this.state.bluetoothEnabled && this.state.bluetoothPermissions )) ?
          <BluetoothDisabledError
            bluetoothAvailable={this.state.bluetoothAvailable}
            bluetoothEnabled={this.state.bluetoothEnabled}
            bluetoothPermissions={this.state.bluetoothPermissions}
           /> :
          <>
            <DevicesList
              bondedDevices={devices.bondedDevicesFormatted}
              //bondedDevices={[{ name: 'NEP-LINK BLE', id: 'demo', inRange: true }]}
              connectToDeviceHandler={this.connectToDevice}
            />
            <DevicesListButtons
              enterDemoModeButtonPressHandler={this.enterDemoModeButtonPress}
            />
          </>
        }
      </View>
    </SafeAreaView>
  }

  render() {
    return this.renderBody(this.props,this.state)
  }

}

export default connect(({ demo, devices, logging, sensorData }) => ({ demo, devices, logging, sensorData }))(Devices)
