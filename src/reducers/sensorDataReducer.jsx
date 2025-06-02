const initialState = {
  probeSetting: null,
  rangeLabel: null,
  turbidityEnabled: false,
  temperatureEnabled: false,
  turbidityValue: null,
  temperatureValue: null,
  sampleDateObj: null,
  locationEnabled: true,
  locationLat: null,
  locationLng: null,
  batteryLevel: null,
  batteryRawVoltage: null,
  batteryCharging: null,
}

export default function (state = initialState, action) {

  switch(action.type) {

    case 'SENSOR_DATA_UPDATE_VALUES':
      return  { ...state,
        probeSetting: action.meta.probeSetting,
        rangeLabel: action.meta.rangeLabel,
        turbidityEnabled: action.meta.turbidityEnabled,
        temperatureEnabled: action.meta.temperatureEnabled,
        turbidityValue: action.meta.turbidityValue,
        temperatureValue: action.meta.temperatureValue,
        sampleDateObj: action.meta.sampleDateObj,
        locationEnabled: action.meta.locationEnabled,
        locationLat: action.meta.locationLat,
        locationLng: action.meta.locationLng,
      }

    case 'SENSOR_DATA_UPDATE_BATTERY_STATUS':
      return  { ...state,
        batteryLevel: action.meta.batteryLevel,
        batteryRawVoltage: action.meta.batteryRawVoltage,
        batteryCharging: action.meta.batteryCharging,
      }

    case 'SENSOR_DATA_RESET_VALUES':
      const resetLocationEnabled = state.locationEnabled
      const resetLocationLat = state.locationLat
      const resetLocationLng = state.locaLngbled
      return  { ...initialState, locationEnabled: resetLocationEnabled, locationLat: resetLocationLat, locationLng: resetLocationLng }

    case 'SENSOR_START_LOGGING':
      return  { ...state, isLogging: true }

    case 'SENSOR_STOP_LOGGING':
      return  { ...state, isLogging: false }

    default:
      return state

  }
}
