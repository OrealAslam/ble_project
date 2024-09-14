import { combineReducers } from "redux"

import { reducer as formReducer } from 'redux-form'
import devicesReducer from './devicesReducer'
import sensorDataReducer from './sensorDataReducer'
import loggingReducer from './loggingReducer'

const reducers = {
  devices: devicesReducer,
  sensorData: sensorDataReducer,
  logging: loggingReducer,
}

export default combineReducers(reducers)

