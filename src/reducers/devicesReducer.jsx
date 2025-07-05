import {BLUETOOTH_DEVICE_NAME_REGEX} from '../constants/constants';

const initialState = {
  connectionStateChanging: false,
  wiping: false,
  sensorDataReceived: false,
  sensorError: false,
  bondedDevicesRaw: [],
  bondedDevicesFormatted: [],
  devicesInRange: [],
  unpairedDevices: [],
  knownDevices: [],
  deviceIdNameHash: {},
  device: null,
  status: 'disconnected',
};

export default function (state = initialState, action) {
  let newBondedDevicesFormatted;
  let filteredFormattedBondedDevices;
  let deviceIdNameHash;
  let newBondedDevice;

  switch (action.type) {
    case 'DEVICE_CONNECTING':
      return {
        ...state,
        connectionStateChanging: true,
        device: action.meta,
        status: 'connecting',
      };

    case 'DEVICE_CONNECTED':
      newBondedDevicesFormatted = state.bondedDevicesFormatted.map(device => {
        const newDevice = {...device};
        if (device.address === action.meta.address) {
          newDevice.isConnected = true;
        }
        return newDevice;
      });
      return {
        ...state,
        connectionStateChanging: false,
        device: action.meta,
        status: 'connected',
        bondedDevicesFormatted: newBondedDevicesFormatted,
      };

    case 'DEVICE_DISCONNECTING':
      return {
        ...state,
        connectionStateChanging: true,
        device: action.meta,
        status: 'disconnecting',
      };

    case 'DEVICE_DISCONNECTED':
    case 'DEVICE_CLEAR_CONNECTED_DEVICE':
      newBondedDevicesFormatted = state.bondedDevicesFormatted.map(device => {
        const {isConnected, ...newDevice} = device;
        return newDevice;
      });
      return {
        ...state,
        connectionStateChanging: false,
        device: null,
        status: 'disconnected',
        bondedDevicesFormatted: newBondedDevicesFormatted,
        wiping: false,
        sensorDataReceived: false,
        sensorError: false,
      };

    case 'DEVICE_SET_WIPING':
      return {...state, wiping: action.meta.wiping};

    case 'DEVICE_SET_SENSOR_DATA_RECEIVED':
      return {...state, sensorDataReceived: action.meta.sensorDataReceived};

    case 'DEVICE_SET_SENSOR_ERROR':
      return {...state, sensorError: action.meta.sensorError};

    case 'DEVICE_ADD_KNOWN_DEVICES':
      console.log(`MY DEVICE ABC ${state.device}`);
    case 'DEVICE_FETCH_KNOWN_DEVICES':
    case 'DEVICE_SAVE_DEVICE_NAME':
      deviceIdNameHash = {};
      const knownDevices = action.payload.knownDevices;
      knownDevices.forEach(device => {
        deviceIdNameHash[device.id] = device.customName || device.name;
      });
      newBondedDevicesFormatted = [...state.bondedDevicesFormatted];
      newBondedDevicesFormatted.forEach(bondedDevice => {
        const customName = deviceIdNameHash[bondedDevice.address];
        bondedDevice.name = customName || bondedDevice.name;
        bondedDevice.origName = bondedDevice.name;
      });
      return {
        ...state,
        bondedDevicesFormatted: newBondedDevicesFormatted,
        knownDevices,
        deviceIdNameHash,
      };

    case 'DEVICE_SET_BONDED_DEVICES':
      filteredFormattedBondedDevices = filterAndSortDevices(
        action.payload.bondedDevices,
        state.deviceIdNameHash,
        state,
      );
      return {
        ...state,
        bondedDevicesRaw: action.payload.bondedDevices,
        devicesInRange: filteredFormattedBondedDevices,
        bondedDevicesFormatted: filteredFormattedBondedDevices,
      };

    case 'DEVICE_ADD_BONDED_DEVICE':
      newBondedDevice = {...action.payload.newBondedDevice};
      const newBondedDevicesRaw = [...state.bondedDevicesRaw, newBondedDevice];
      deviceIdNameHash = {...state.deviceIdNameHash};
      deviceIdNameHash[action.payload.newBondedDevice.address] =
        action.payload.newBondedDevice.name;
      filteredFormattedBondedDevices = filterAndSortDevices(
        newBondedDevicesRaw,
        deviceIdNameHash,
        state,
      );
      return {
        ...state,
        bondedDevicesRaw: newBondedDevicesRaw,
        bondedDevicesFormatted: filteredFormattedBondedDevices,
        deviceIdNameHash,
      };

    case 'DEVICE_SET_DISCOVERED_DEVICES':
      const unpairedDevices = [];
      const currentTimestamp = new Date().getTime();
      const devicesInRange = [...action.payload.discoveredDevices];
      console.log(
        'XXX action.payload.discoveredDevices',
        action.payload.discoveredDevices,
      );
      action.payload.discoveredDevices
        .filter(({name, address}) => {
          const bondedDevice = state.bondedDevicesRaw.find(
            bondedDevice => bondedDevice.address === address,
          );
          return !bondedDevice && name?.match(BLUETOOTH_DEVICE_NAME_REGEX);
        })
        .forEach(newDevice => {
          newDevice.lastSeenAt = currentTimestamp;
          unpairedDevices.push({...newDevice});
        });
      console.log('XXXX unpairedDevices 1', unpairedDevices);
      unpairedDevices.forEach(unpairedDevice => {
        unpairedDevice.oldCustomName =
          state.deviceIdNameHash[unpairedDevice.address];
      });
      const bondedDevices = [];
      state.bondedDevicesFormatted.forEach(bondedDevice => {
        deviceInRange = devicesInRange.find(
          deviceInRange => deviceInRange.address === bondedDevice.address,
        );
        newBondedDevice = {...bondedDevice};
        if (deviceInRange) {
          newBondedDevice.inRange = true;
          newBondedDevice.inRangeSince = currentTimestamp;
        } else if (
          newBondedDevice.inRangeSince &&
          currentTimestamp < newBondedDevice.inRangeSince < 120000
        ) {
          newBondedDevice.inRange = true;
        } else {
          newBondedDevice.inRange = false;
          newBondedDevice.inRangeSince = null;
        }
        bondedDevices.push(newBondedDevice);
      });
      state.unpairedDevices.forEach(oldUnpairedDevice => {
        const newDevice = unpairedDevices.find(
          ({address}) => oldUnpairedDevice.address === address,
        );
        if (!newDevice) {
          if (currentTimestamp - oldUnpairedDevice.lastSeenAt < 120000) {
            unpairedDevices.push({...oldUnpairedDevice});
          }
        }
      });
      unpairedDevices.sort((a, b) => (a.name > b.name ? 1 : -1));
      devicesInRange.sort((a, b) => (a.name > b.name ? 1 : -1));
      bondedDevices.sort((a, b) => (a.name > b.name ? 1 : -1));

      console.log('XXXX unpairedDevices 2', unpairedDevices);

      return {...state, unpairedDevices, devicesInRange, bondedDevices};

    default:
      return state;
  }
}

const filterAndSortDevices = (devices, deviceIdNameHash, state) => {
  const bleDevices = devices.map(({bleDevice}) => bleDevice);

  const ret = bleDevices
    .filter(({name}) => name?.match(BLUETOOTH_DEVICE_NAME_REGEX))
    .map(({id, name}) => {
      const customName = deviceIdNameHash[id];
      // let deviceInRange = state.devicesInRange.find((deviceInRange) => (deviceInRange.address === address))
      const ret = {
        id,
        address: id,
        name: customName || name,
        origName: name,
        inRange: true, //(typeof deviceInRange !== 'undefined')
      };
      // if (state.device?.address===address) {
      //   ret['isConnected'] = true
      // }
      return ret;
    })
    .sort((a, b) => {
      let sortVal = 0;
      if (a.name > b.name) {
        sortVal += 1;
      } else {
        sortVal -= 1;
      }
      if (a.inRange) {
        sortVal -= 1000;
      }
      return sortVal;
    });

  return ret;
};
