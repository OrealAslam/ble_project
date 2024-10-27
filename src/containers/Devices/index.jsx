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

    //this.disconnectSubscription //= RNBluetoothClassic.onDeviceDisconnected(this.onDeviceDisconnected)
    // this.onDataReceivedSubscription = null

    // this.bluetoothEnabledSubscription //= RNBluetoothClassic.onBluetoothEnabled(this.onBluetoothStateChange)
    // this.bluetoothDisabledSubscription //= RNBluetoothClassic.onBluetoothDisabled(this.onBluetoothStateChange)

    await this.getBluetoothPermissionsAndStartBluetoothProcesses.call(this)
    this.locationUpdate.call(this)

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

  }

  componentDidUpdate(prevState,prevProps) {

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

    if ((demo.demoModeEnabled === false) && this.intervalId) clearInterval(this.intervalId)

  }

  componentWillUnmount() {
    // console.log("XXX Devices componentWillUnmount")
    //this.disconnectSubscription.remove()
    //if (this.onDataReceivedSubscription) this.onDataReceivedSubscription.remove()
    this.props.dispatch(resetValues())
  }

  locationUpdateId = null
  locationSubscription = null

  locationUpdate = async () => {

    console.log("KKK locationUpdate - Running...")

    this.locationUpdateId = setInterval(async () => {

      console.log("KKK locationUpdate setInterval 1")
      // console.log("XXX locationUpdate running PermissionsAndroid.request")
      const permissionsAndroidGranted = (Platform.OS === "android") ? await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION) : null
            // console.log("XXX locationUpdate finished running PermissionsAndroid.request",permissionsAndroidGranted)
      // console.log("XXX locationUpdate running RNLocation.requestPermission")
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
      await RNLocation.configure({
          distanceFilter: 5.0
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

    },10000)

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
    this.setState({ awaitingDevice: false, connectingDevice: deviceToConnect, connectedDevice: null })
    //BluetoothService.connectAndListen(deviceToConnect.bleDevice,this.onDataReceived)
    BluetoothService.connectAndListen(deviceToConnect.bleDevice,this.onDataReceived)
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

  onDataReceived = (responseStr) => {

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

    const turbidityRangeMin = 5
    const turbidityRangeMax = 5000
    turbidityValue = Math.round((((turbidityRangeMax-turbidityRangeMin) * Math.random()) + turbidityRangeMin) * 100) / 100


    const temperatureRangeMin = 5
    const temperatureRangeMax = 35
    temperatureValue = Math.round((((temperatureRangeMax-temperatureRangeMin) * Math.random()) + temperatureRangeMin) * 10) / 10

    console.log("XXX turbidityValue",turbidityValue)
    console.log("XXX temperatureValue",temperatureValue)

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

    if (!sensorData.batteryVoltage) {
      const batteryLevelRangeMin = 60
      const batteryLevelRangeMax = 100
      batteryVoltage = Math.round(((batteryLevelRangeMax-batteryLevelRangeMin) * Math.random()) + batteryLevelRangeMin)
      dispatch(updateBatteryStatus({
        batteryVoltage,
        batteryCharging: false,
      }))
    }

  }

  onDeviceDisconnected = (event: BluetoothDeviceEvent) => {
    const { devices } = this.props
    console.log("XXX Devices onDeviceDisconnected")
    const { dispatch } = this.props
    // if (this.onDataReceivedSubscription) {
    //   this.onDataReceivedSubscription.remove()
    // }
    const { connectedDevice } = this.state
    if (connectedDevice) {
      const deviceDataObj = devices.bondedDevicesFormatted.find((o) => o.address === connectedDevice.address)
      dispatch(setDeviceDisconnected(deviceDataObj))
    } else {
      dispatch(clearConnectedDevice())
    }
    dispatch(resetValues())
  }

  startDiscovery = async () => {
    RNBluetoothClassic.startDiscovery()
      .then((discoveredDevices) => {
        console.log("XXX startDiscovery",discoveredDevices)
        this.props.dispatch(setDiscoveredDevices(discoveredDevices))
        setTimeout(() => {
          try {
            RNBluetoothClassic.cancelDiscovery()
            .then(() => {
              console.log("cancelDiscovery then 1")
              setTimeout(() => {
                this.startDiscovery.call(this)
              },5000)
            })
            .catch(() => {
              console.log("cancelDiscovery catch 1")
            })
          } catch(error) {
            console.log("XXX RNBluetoothClassic.cancelDiscovery error 1",error)
          }
        },30000)
      })
      .catch((error1) => {
        console.log("XXX can't start discovery 1",error1)
        setTimeout(() => {
          this.startDiscovery.call(this)
        },2000)

        // try {
        //   RNBluetoothClassic.cancelDiscovery()
        //   .then(() => {
        //     console.log("XXX catch -> cancelDiscovery then")
        //     setTimeout(() => {
        //       this.startDiscovery.call(this)
        //     },2000)
        //   })
        //   .catch((error) => {
        //     console.log("XXX catch -> cancelDiscovery catch")
        //     this.setState({ bluetoothEnabled: false })
        //     setTimeout(() => {
        //       this.startDiscovery.call(this)
        //     },2000)
        //   })
        // } catch(error) {
        //   console.log("XXX RNBluetoothClassic.cancelDiscovery error 2",error)
        // }
      })
  }

  deviceDisconnect = () => {
    const { dispatch } = this.props
    const { connectedDevice } = this.state
    if (connectedDevice) {
      this.setState({
        connectingDevice: null,
        connectedDevice: null,
        connectionAttemptStarted: false,
      })
      dispatch(clearConnectedDevice())
      connectedDevice.disconnect()
        .then((connection) => {
          console.log("XXX disconnect 2",connection)
        })
        .catch(error => {
          console.log("Couldn't disconnect 2",error)
        })
    } else {
      RNBluetoothClassic.getConnectedDevices()
      .then((connected) => {
        connected.forEach((deviceToDisconnect) => {
          deviceToDisconnect.disconnect()
            .then((connection) => {
              console.log("XXX disconnect 3",connection)
            })
            .catch(error => {
              console.log("Couldn't disconnect 3",error)
            })
        })
      })
    }
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
