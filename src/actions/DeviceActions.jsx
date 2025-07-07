// import AsyncStorage from '@react-native-async-storage/async-storage'
// import { BLUETOOTH_DEVICE_NAME_REGEX } from '../constants/constants'

// export function setDeviceConnecting(deviceDataObj) {
//   return (dispatch, getState) => {
//     dispatch({
//       type: 'DEVICE_CONNECTING',
//       meta: { ...deviceDataObj },
//     })
//   }
// }

// export function setDeviceConnected(deviceDataObj) {
//   return (dispatch, getState) => {
//     dispatch({
//       type: 'DEVICE_CONNECTED',
//       meta: { ...deviceDataObj },
//     })
//   }
// }

// export function setDeviceDisconnecting(deviceDataObj) {
//   return (dispatch, getState) => {
//     dispatch({
//       type: 'DEVICE_DISCONNECTING',
//       meta: { ...deviceDataObj },
//     })
//   }
// }

// export function setDeviceDisconnected(deviceDataObj) {
//   return (dispatch, getState) => {
//     dispatch({
//       type: 'DEVICE_DISCONNECTED',
//       meta: { ...deviceDataObj },
//     })
//   }
// }

// export function clearConnectedDevice() {
//   return (dispatch, getState) => {
//     dispatch({
//       type: 'DEVICE_CLEAR_CONNECTED_DEVICE',
//     })
//   }
// }

// export function setWiping(wiping) {
//   return (dispatch, getState) => {
//     dispatch({
//       type: 'DEVICE_SET_WIPING',
//       meta: { wiping },
//     })
//   }
// }

// export function setSensorDataReceived(sensorDataReceived) {
//   return (dispatch, getState) => {
//     dispatch({
//       type: 'DEVICE_SET_SENSOR_DATA_RECEIVED',
//       meta: { sensorDataReceived },
//     })
//   }
// }

// export function setSensorError(sensorError) {
//   return (dispatch, getState) => {
//     dispatch({
//       type: 'DEVICE_SET_SENSOR_ERROR',
//       meta: { sensorError },
//     })
//   }
// }

// export const setDiscoveredDevices = (discoveredDevices) => async dispatch => {
//   // console.log("XXX setDiscoveredDevices",discoveredDevices)
//   try {
//     const filteredDiscoveredDevices = discoveredDevices.filter(({ name }) => name?.match(BLUETOOTH_DEVICE_NAME_REGEX))
//     //const filteredDiscoveredDevices = { ...discoveredDevices }
//     // console.log("XXX setDiscoveredDevices filteredDiscoveredDevices",filteredDiscoveredDevices)
//     dispatch({
//       type: 'DEVICE_SET_DISCOVERED_DEVICES',
//       payload: { discoveredDevices: filteredDiscoveredDevices }
//     })
//   } catch (e) {
//     console.log('Error in setDiscoveredDevices', e)
//   }
// }

// export const setBondedDevices = (bondedDevices) => async dispatch => {
//   try {
//     dispatch({
//       type: 'DEVICE_SET_BONDED_DEVICES',
//       payload: { bondedDevices: bondedDevices }
//     })
//   } catch (e) {
//     console.log('Error in setBondedDevices', e)
//   }
// }

// export const addBondedDevice = (newBondedDevice) => async dispatch => {
//   try {
//     delete newBondedDevice.customName
//     delete newBondedDevice.oldCustomName
//     dispatch({
//       type: 'DEVICE_ADD_BONDED_DEVICE',
//       payload: { newBondedDevice }
//     })
//     const knownDevices = await AsyncStorage.getItem('knownDevices')
//       .then(knownDevicesJson => {
//         const ret = knownDevicesJson ? JSON.parse(knownDevicesJson) : []
//         return ret
//       })
//     const filteredKnownDevices = knownDevices
//       .filter(({name,address}) => (
//         (name?.match(BLUETOOTH_DEVICE_NAME_REGEX)) &&
//         (address !== newBondedDevice)
//       ))
//     filteredKnownDevices.push(newBondedDevice)
//     const sortedFilteredKnownDevices = filteredKnownDevices
//       .sort((a, b) => a.name > b.name ? 1 : -1)
//     console.log("XXX5555 sortedFilteredKnownDevices",sortedFilteredKnownDevices)
//     AsyncStorage.setItem('knownDevices',JSON.stringify(sortedFilteredKnownDevices))
//   } catch (e) {
//     console.log('Error in addBondedDevice', e)
//   }
// }

// export const addKnownDevices = (devices) => async dispatch => {
//   try {
//     const knownDevices = await AsyncStorage.getItem('knownDevices')
//       .then(knownDevicesJson => {
//         const knownDevices = knownDevicesJson ? JSON.parse(knownDevicesJson) : []
//         devices.forEach((newDevice) => {
//           const existingDevice = knownDevices.find(({ id }) => (newDevice.id === id) )
//           if (!existingDevice) knownDevices.push(newDevice)
//         })
//         const newKnownDevices = []
//         knownDevices.forEach((device) => {
//           const existingDevice = newKnownDevices.find(({ id }) => (device.id === id) )
//           if (!existingDevice) newKnownDevices.push(device)
//         })
//         const sortedFilteredKnownDevices = newKnownDevices
//           .filter(({name}) => (name?.match(BLUETOOTH_DEVICE_NAME_REGEX)))
//           .sort((a, b) => a.name > b.name ? 1 : -1)
//         AsyncStorage.setItem('knownDevices',JSON.stringify(sortedFilteredKnownDevices))
//         return sortedFilteredKnownDevices
//       })
//     dispatch({
//       type: 'DEVICE_ADD_KNOWN_DEVICES',
//       payload: { knownDevices }
//     })
//   } catch (e) {
//     console.log('Error in addKnownDevices', e)
//   }
// }

// export const fetchKnownDevices = () => async dispatch => {
//   try {
//     const knownDevices = await AsyncStorage.getItem('knownDevices')
//       .then(knownDevicesJson => {
//         const ret = knownDevicesJson ? JSON.parse(knownDevicesJson) : []
//         return ret
//       })
//     dispatch({
//       type: 'DEVICE_FETCH_KNOWN_DEVICES',
//       payload: { knownDevices }
//     })
//   } catch (e) {
//     console.log('Error in fetchKnownDevices', e)
//   }
// }

// export const saveDeviceName = (deviceId,deviceName) => async dispatch => {
//   try {
//     const knownDevices = await AsyncStorage.getItem('knownDevices')
//       .then(knownDevicesJson => {
//           const ret = knownDevicesJson ? JSON.parse(knownDevicesJson) : []
//         return ret
//       })
//     const deviceToEdit = knownDevices.find(({id}) => (deviceId===id))
//     deviceToEdit['customName'] = deviceName
//     AsyncStorage.setItem('knownDevices',JSON.stringify(knownDevices.sort((a, b) => a.name > b.name ? 1 : -1)))
//     dispatch({
//       type: 'DEVICE_SAVE_DEVICE_NAME',
//       payload: { knownDevices }
//     })
//   } catch (e) {
//     console.log('Error in saveDeviceName', e)
//   }
// }

// USING SQLITE DATABASE

import {BLUETOOTH_DEVICE_NAME_REGEX} from '../constants/constants';
import {getDBConnection} from '../utils/db';

// In src/actions/DeviceActions.jsx

export function setDeviceConnecting(deviceDataObj) {
  console.log('🔵 Device connecting action triggered', deviceDataObj);
  return dispatch => {
    dispatch({type: 'DEVICE_CONNECTING', meta: {...deviceDataObj}});
  };
}

export function setDeviceConnected(deviceDataObj) {
  console.log('🟢 Device connected action triggered', deviceDataObj);
  return dispatch => {
    dispatch({type: 'DEVICE_CONNECTED', meta: {...deviceDataObj}});
  };
}

export function setDeviceDisconnecting(deviceDataObj) {
  console.log('🟠 Device disconnecting action triggered', deviceDataObj);
  return dispatch => {
    dispatch({type: 'DEVICE_DISCONNECTING', meta: {...deviceDataObj}});
  };
}

export function setDeviceDisconnected(deviceDataObj) {
  console.log('🔴 Device disconnected action triggered', deviceDataObj);
  return dispatch => {
    dispatch({type: 'DEVICE_DISCONNECTED', meta: {...deviceDataObj}});
  };
}

export function clearConnectedDevice() {
  return dispatch => {
    dispatch({type: 'DEVICE_CLEAR_CONNECTED_DEVICE'});
  };
}

export function setWiping(wiping) {
  return dispatch => {
    dispatch({type: 'DEVICE_SET_WIPING', meta: {wiping}});
  };
}

export function setSensorDataReceived(sensorDataReceived) {
  return dispatch => {
    dispatch({
      type: 'DEVICE_SET_SENSOR_DATA_RECEIVED',
      meta: {sensorDataReceived},
    });
  };
}

export function setSensorError(sensorError) {
  return dispatch => {
    dispatch({type: 'DEVICE_SET_SENSOR_ERROR', meta: {sensorError}});
  };
}

export const setDiscoveredDevices = discoveredDevices => async dispatch => {
  try {
    const filtered = discoveredDevices.filter(({name}) =>
      name?.match(BLUETOOTH_DEVICE_NAME_REGEX),
    );
    dispatch({
      type: 'DEVICE_SET_DISCOVERED_DEVICES',
      payload: {discoveredDevices: filtered},
    });
  } catch (e) {
    console.log('Error in setDiscoveredDevices', e);
  }
};

export const setBondedDevices = bondedDevices => async (dispatch, getState) => {
  try {
    if (!bondedDevices || bondedDevices.length === 0) {
      console.log('⏭️ Skipping DEVICE_SET_BONDED_DEVICES: empty list');
      return;
    }

    const {
      devices: {bondedDevicesRaw: currentBonded},
    } = getState();

    const devicesAreSame = (a, b) => {
      if (a.length !== b.length) {
        return false;
      }
      return a.every(deviceA =>
        b.some(
          deviceB =>
            deviceA.id === deviceB.id &&
            (deviceA.name === deviceB.name || !deviceA.name || !deviceB.name),
        ),
      );
    };

    const isSame = devicesAreSame(bondedDevices, currentBonded);
    console.log('isSame check result:', isSame);

    if (isSame) {
      console.log('⏭️ Skipping DEVICE_SET_BONDED_DEVICES: identical list');
      return;
    }

    dispatch({type: 'DEVICE_SET_BONDED_DEVICES', payload: {bondedDevices}});
  } catch (e) {
    console.log('Error in setBondedDevices:', e);
  }
};

export const addBondedDevice = newBondedDevice => async dispatch => {
  try {
    const db = await getDBConnection();
    await db.executeSql(
      'REPLACE INTO knownDevices (id, name, address) VALUES (?, ?, ?)',
      [newBondedDevice.id, newBondedDevice.name, newBondedDevice.id],
    );
    dispatch({type: 'DEVICE_ADD_BONDED_DEVICE', payload: {newBondedDevice}});
  } catch (e) {
    console.log('Error in addBondedDevice', e);
  }
};

export const addKnownDevices = devices => async (dispatch, getState) => {
  try {
    const db = await getDBConnection();
    for (const device of devices) {
      await db.executeSql(
        'REPLACE INTO knownDevices (id, name, address) VALUES (?, ?, ?)',
        [device.id, device.name, device.id],
      );
    }

    const [results] = await db.executeSql('SELECT * FROM knownDevices');
    const knownDevices = [];
    for (let i = 0; i < results.rows.length; i++) {
      knownDevices.push(results.rows.item(i));
    }

    const {
      devices: {knownDevices: currentKnownDevices},
    } = getState();

    const isSame =
      knownDevices.length === currentKnownDevices.length &&
      knownDevices.every(
        (d, i) =>
          d.id === currentKnownDevices[i]?.id &&
          d.name === currentKnownDevices[i]?.name,
      );

    // if (isSame) {
    //   console.log('⏭️ Skipping DEVICE_ADD_KNOWN_DEVICES: no change');
    //   return;
    // }

    dispatch({type: 'DEVICE_ADD_KNOWN_DEVICES', payload: {knownDevices}});
  } catch (e) {
    console.log('Error in addKnownDevices', e);
  }
};

export const fetchKnownDevices = () => async dispatch => {
  try {
    const db = await getDBConnection();
    const [results] = await db.executeSql('SELECT * FROM knownDevices');
    const knownDevices = [];
    for (let i = 0; i < results.rows.length; i++) {
      knownDevices.push(results.rows.item(i));
    }
    dispatch({type: 'DEVICE_FETCH_KNOWN_DEVICES', payload: {knownDevices}});
  } catch (e) {
    console.log('Error in fetchKnownDevices', e);
  }
};

export const saveDeviceName = (deviceId, deviceName) => async dispatch => {
  try {
    const db = await getDBConnection();
    await db.executeSql('UPDATE knownDevices SET customName = ? WHERE id = ?', [
      deviceName,
      deviceId,
    ]);

    const [results] = await db.executeSql('SELECT * FROM knownDevices');
    const knownDevices = [];
    for (let i = 0; i < results.rows.length; i++) {
      knownDevices.push(results.rows.item(i));
    }

    dispatch({type: 'DEVICE_SAVE_DEVICE_NAME', payload: {knownDevices}});
  } catch (e) {
    console.log('Error in saveDeviceName', e);
  }
};
