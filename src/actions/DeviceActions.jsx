import AsyncStorage from '@react-native-async-storage/async-storage'
import { BLUETOOTH_DEVICE_NAME_REGEX } from '../constants/constants'

export function setDeviceConnecting(deviceDataObj) {
  return (dispatch, getState) => {
    dispatch({
      type: 'DEVICE_CONNECTING',
      meta: { ...deviceDataObj },
    })
  }
}

export function setDeviceConnected(deviceDataObj) {
  return (dispatch, getState) => {
    dispatch({
      type: 'DEVICE_CONNECTED',
      meta: { ...deviceDataObj },
    })
  }
}

export function setDeviceDisconnecting(deviceDataObj) {
  return (dispatch, getState) => {
    dispatch({
      type: 'DEVICE_DISCONNECTING',
      meta: { ...deviceDataObj },
    })
  }
}

export function setDeviceDisconnected(deviceDataObj) {
  return (dispatch, getState) => {
    dispatch({
      type: 'DEVICE_DISCONNECTED',
      meta: { ...deviceDataObj },
    })
  }
}

export function clearConnectedDevice() {
  return (dispatch, getState) => {
    dispatch({
      type: 'DEVICE_CLEAR_CONNECTED_DEVICE',
    })
  }
}

export function setWiping(wiping) {
  return (dispatch, getState) => {
    dispatch({
      type: 'DEVICE_SET_WIPING',
      meta: { wiping },
    })
  }
}

export function setSensorDataReceived(sensorDataReceived) {
  return (dispatch, getState) => {
    dispatch({
      type: 'DEVICE_SET_SENSOR_DATA_RECEIVED',
      meta: { sensorDataReceived },
    })
  }
}

export function setSensorError(sensorError) {
  return (dispatch, getState) => {
    dispatch({
      type: 'DEVICE_SET_SENSOR_ERROR',
      meta: { sensorError },
    })
  }
}

export const setDiscoveredDevices = (discoveredDevices) => async dispatch => {
  // console.log("XXX setDiscoveredDevices",discoveredDevices)
  try {
    const filteredDiscoveredDevices = discoveredDevices.filter(({ name }) => name?.match(BLUETOOTH_DEVICE_NAME_REGEX))
    //const filteredDiscoveredDevices = { ...discoveredDevices }
    // console.log("XXX setDiscoveredDevices filteredDiscoveredDevices",filteredDiscoveredDevices)
    dispatch({
      type: 'DEVICE_SET_DISCOVERED_DEVICES',
      payload: { discoveredDevices: filteredDiscoveredDevices }
    })
  } catch (e) {
    console.log('Error in setDiscoveredDevices', e)
  }
}

export const setBondedDevices = (bondedDevices) => async dispatch => {
  try {
    dispatch({
      type: 'DEVICE_SET_BONDED_DEVICES',
      payload: { bondedDevices: bondedDevices }
    })
  } catch (e) {
    console.log('Error in setBondedDevices', e)
  }
}

export const addBondedDevice = (newBondedDevice) => async dispatch => {
  try {
    delete newBondedDevice.customName
    delete newBondedDevice.oldCustomName
    dispatch({
      type: 'DEVICE_ADD_BONDED_DEVICE',
      payload: { newBondedDevice }
    })
    const knownDevices = await AsyncStorage.getItem('knownDevices')
      .then(knownDevicesJson => {
        const ret = knownDevicesJson ? JSON.parse(knownDevicesJson) : []
        return ret
      })
    const filteredKnownDevices = knownDevices
      .filter(({name,address}) => (
        (name?.match(BLUETOOTH_DEVICE_NAME_REGEX)) &&
        (address !== newBondedDevice)
      ))
    filteredKnownDevices.push(newBondedDevice)
    const sortedFilteredKnownDevices = filteredKnownDevices
      .sort((a, b) => a.name > b.name ? 1 : -1)
    console.log("XXX5555 sortedFilteredKnownDevices",sortedFilteredKnownDevices)
    AsyncStorage.setItem('knownDevices',JSON.stringify(sortedFilteredKnownDevices))
  } catch (e) {
    console.log('Error in addBondedDevice', e)
  }
}

export const addKnownDevices = (devices) => async dispatch => {
  try {
    const knownDevices = await AsyncStorage.getItem('knownDevices')
      .then(knownDevicesJson => {
        const knownDevices = knownDevicesJson ? JSON.parse(knownDevicesJson) : []
        devices.forEach((newDevice) => {
          const existingDevice = knownDevices.find(({ id }) => (newDevice.id === id) )
          if (!existingDevice) knownDevices.push(newDevice)
        })
        const newKnownDevices = []
        knownDevices.forEach((device) => {
          const existingDevice = newKnownDevices.find(({ id }) => (device.id === id) )
          if (!existingDevice) newKnownDevices.push(device)
        })
        const sortedFilteredKnownDevices = newKnownDevices
          .filter(({name}) => (name?.match(BLUETOOTH_DEVICE_NAME_REGEX)))
          .sort((a, b) => a.name > b.name ? 1 : -1)
        AsyncStorage.setItem('knownDevices',JSON.stringify(sortedFilteredKnownDevices))
        return sortedFilteredKnownDevices
      })
    dispatch({
      type: 'DEVICE_ADD_KNOWN_DEVICES',
      payload: { knownDevices }
    })
  } catch (e) {
    console.log('Error in addKnownDevices', e)
  }
}

export const fetchKnownDevices = () => async dispatch => {
  try {
    const knownDevices = await AsyncStorage.getItem('knownDevices')
      .then(knownDevicesJson => {
        const ret = knownDevicesJson ? JSON.parse(knownDevicesJson) : []
        return ret
      })
    dispatch({
      type: 'DEVICE_FETCH_KNOWN_DEVICES',
      payload: { knownDevices }
    })
  } catch (e) {
    console.log('Error in fetchKnownDevices', e)
  }
}

export const saveDeviceName = (deviceId,deviceName) => async dispatch => {
  try {
    const knownDevices = await AsyncStorage.getItem('knownDevices')
      .then(knownDevicesJson => {
          const ret = knownDevicesJson ? JSON.parse(knownDevicesJson) : []
        return ret
      })
    const deviceToEdit = knownDevices.find(({id}) => (deviceId===id))
    deviceToEdit['customName'] = deviceName
    AsyncStorage.setItem('knownDevices',JSON.stringify(knownDevices.sort((a, b) => a.name > b.name ? 1 : -1)))
    dispatch({
      type: 'DEVICE_SAVE_DEVICE_NAME',
      payload: { knownDevices }
    })
  } catch (e) {
    console.log('Error in saveDeviceName', e)
  }
}
