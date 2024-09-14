export function updateValues(sensorDataObj) {
  return (dispatch, getState) => {
    dispatch({
      type: 'SENSOR_DATA_UPDATE_VALUES',
      meta: { ...sensorDataObj },
    })
  }
}

export function resetValues() {
  return (dispatch, getState) => {
    dispatch({
      type: 'SENSOR_DATA_RESET_VALUES',
    })
  }
}

export function updateBatteryStatus(batteryStatusObj) {
  return (dispatch, getState) => {
    dispatch({
      type: 'SENSOR_DATA_UPDATE_BATTERY_STATUS',
      meta: { ...batteryStatusObj },
    })
  }
}
