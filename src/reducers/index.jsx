import { combineReducers } from "redux"

import { reducer as formReducer } from 'redux-form'
import demoReducer from './demoReducer'
import devicesReducer from './devicesReducer'
import sensorDataReducer from './sensorDataReducer'
import loggingReducer from './loggingReducer'

const reducers = {
  demo: demoReducer,
  devices: devicesReducer,
  sensorData: sensorDataReducer,
  logging: loggingReducer,
}

console.log("XXX reducers",reducers)

export default combineReducers(reducers)

