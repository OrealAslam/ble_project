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
  isScanning: false,
  scanError: null,
  availableDevices: [],
  connectingDevice: null,
  connectError: null,
  disconnecting: false,
  disconnectError: null,
};

export default function (state = initialState, action) {
  let newBondedDevicesFormatted;
  let filteredFormattedBondedDevices;
  let deviceIdNameHash;
  let newBondedDevice;

  switch (action.type) {
    case 'SCAN_START':
      return { ...state, isScanning: true, scanError: null, availableDevices: [] };
    case 'SCAN_STOP':
      return { ...state, isScanning: false };
    case 'SCAN_ERROR':
      return { ...state, isScanning: false, scanError: action.error };
    case 'SET_AVAILABLE_DEVICES':
      return { ...state, availableDevices: action.devices };
    case 'DEVICE_CONNECTING':
      return { ...state, connectingDevice: action.meta, connectError: null };
    case 'DEVICE_CONNECTED':
      // Make sure we properly set the device as connected in the state
      newBondedDevicesFormatted = state.bondedDevicesFormatted.map(device => {
        const newDevice = {...device};
        // Match by id or address to ensure we find the right device
        if (
          device.id === action.meta.id ||
          device.address === action.meta.address
        ) {
          newDevice.isConnected = true;
          console.log(
            `🟢 Device marked as connected in redux state: ${device.name}`,
          );
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
    case 'DEVICE_CONNECT_ERROR':
      return { ...state, connectingDevice: null, connectError: action.error };
    case 'DEVICE_DISCONNECTING':
      return { ...state, disconnecting: true, disconnectError: null };
    case 'DEVICE_DISCONNECTED':
    case 'DEVICE_CLEAR_CONNECTED_DEVICE':
      // Make sure to clean up the connected status for all devices
      newBondedDevicesFormatted = state.bondedDevicesFormatted.map(device => {
        const newDevice = {...device};
        // Remove isConnected flag from all devices
        if (newDevice.isConnected) {
          delete newDevice.isConnected;
          console.log(
            `🔴 Device marked as disconnected in redux state: ${device.name}`,
          );
        }
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
      console.log(`📱 Connected device ID: ${state.device?.id ?? 'None'}`);
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
      const newBonded = action.payload.bondedDevices;

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

      if (devicesAreSame(state.bondedDevicesRaw, newBonded)) {
        console.log('🔁 Reducer skipped DEVICE_SET_BONDED_DEVICES: same data');
        return state;
      }

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
        .filter(({bleDevice, address}) => {
          // Only show devices that have a name and are not already bonded
          const deviceName = bleDevice?.name || bleDevice?.localName;
          if (!deviceName) return false;
          
          const bondedDevice = state.bondedDevicesRaw.find(
            bondedDevice => bondedDevice.address === address || bondedDevice.id === address,
          );
          return !bondedDevice;
        })
        .forEach(discoveredDevice => {
          // Extract device info from the bleDevice property
          const deviceName = discoveredDevice.bleDevice?.name || discoveredDevice.bleDevice?.localName || 'Unnamed Device';
          const deviceId = discoveredDevice.bleDevice?.id || discoveredDevice.address;
          
          const newDevice = {
            id: deviceId,
            address: deviceId,
            name: deviceName,
            bleDevice: discoveredDevice.bleDevice,
            lastSeenAt: currentTimestamp,
          };
          
          unpairedDevices.push(newDevice);
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
  const normalizedDevices = devices.map(d => {
    if (d.bleDevice) {
      return {
        id: d.bleDevice.id,
        address: d.bleDevice.id,
        name: d.bleDevice.name || d.bleDevice.localName || '',
        origName: d.bleDevice.name || d.bleDevice.localName || '',
      };
    } else {
      return {
        id: d.id,
        address: d.address || d.id,
        name: d.name || '',
        origName: d.name || '',
      };
    }
  });

  const filtered = normalizedDevices
    .filter(({name}) => name && name.trim().length > 0) // Show all devices with names
    .map(device => {
      const customName = deviceIdNameHash[device.address];
      return {
        ...device,
        name: customName || device.name,
        inRange: true,
      };
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

  return filtered;
};
