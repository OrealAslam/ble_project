// import AsyncStorage from '@react-native-async-storage/async-storage'
// import RNFS from 'react-native-fs'

// export function startLogging(loggingSessionId,deviceId,deviceName,timezoneName,timezoneOffset,turbidityEnabled,temperatureEnabled) {
//   const newSession = {
//     id: loggingSessionId,
//     deviceId,
//     deviceName,
//     timestamp: new Date().getTime(),
//     timezoneName,
//     timezoneOffset,
//     turbidityEnabled,
//     temperatureEnabled,
//   }
//   AsyncStorage.getItem('loggingSessions')
//     .then(sessions => {
//       const newSessions = sessions ? JSON.parse(sessions) : []
//       newSessions.push(newSession)
//       AsyncStorage.setItem('loggingSessions',JSON.stringify(newSessions.sort((a,b) => (b.timestamp - a.timestamp))))
//     })
//   return (dispatch, getState) => {
//     dispatch({
//       type: 'LOGGING_START_LOGGING',
//       meta: { newSession },
//     })
//   }
// }

// export const addDataToLoggingSession = (loggingSessionId,dataObj) => async dispatch => {
//   try {
//     dispatch({
//       type: 'LOGGING_ADD_DATA_TO_SESSION',
//       payload: { dataSample: dataObj }
//     })
//   } catch (e) {
//       console.log('Error in addDataToLoggingSession', e)
//   }
// }

// export function saveLoggingSessionSamples(loggingSessionId,dataSamples) {
//   AsyncStorage.setItem(`loggingSessionsData_${loggingSessionId}`,JSON.stringify(dataSamples))
//   return (dispatch, getState) => {
//     dispatch({
//       type: 'LOGGING_SAVE_LOGGING_SESSION_SAMPLES',
//       payload: dataSamples
//     })
//   }
// }

// export function stopLogging() {
//   return (dispatch, getState) => {
//     dispatch({
//       type: 'LOGGING_STOP_LOGGING'
//     })
//   }
// }

// export const fetchLoggingSessions = () => async dispatch => {
//   try {
//     const loggingSessions = await AsyncStorage.getItem('loggingSessions')
//       .then(loggingSessionsJson => {
//         const ret = loggingSessionsJson ? JSON.parse(loggingSessionsJson).sort((a,b) => (b.timestamp - a.timestamp)) : []
//         return ret
//       })
//     dispatch({
//       type: 'LOGGING_FETCH_loggingSessionSamples',
//       payload: { loggingSessions },
//     })
//   } catch (e) {
//       console.log('Error in fetchLoggingSessions', e)
//   }
// }

// export const getLoggingSession = (loggingSessionId) => async dispatch => {
//   try {
//     const loggingSessions = await AsyncStorage.getItem('loggingSessions')
//       .then(loggingSessionsJson => {
//         const ret = loggingSessionsJson ? JSON.parse(loggingSessionsJson).sort((a,b) => (b.timestamp - a.timestamp)) : []
//         return ret
//       })
//     const loggingSession = loggingSessions.find(({ id }) => {
//       return (id === loggingSessionId)
//     })
//     dispatch({
//       type: 'LOGGING_GET_LOGGING_SESSION',
//       payload: { loggingSession },
//     })
//   } catch (e) {
//       console.log('Error in getLoggingSession', e)
//   }
// }

// export const fetchLoggingSessionSamples = (loggingSessionId) => async dispatch => {
//   try {
//     const loggingSessionSamples = await AsyncStorage.getItem(`loggingSessionsData_${loggingSessionId}`)
//       .then(dataSamples => {
//         const ret = dataSamples ? JSON.parse(dataSamples) : []
//         return ret
//       })
//     dispatch({
//       type: 'LOGGING_FETCH_LOGGING_SESSION_SAMPLES',
//       payload: { loggingSessionSamples },
//     })
//   } catch (e) {
//     console.log('Error in fetchLoggingSessionSamples', e)
//   }
// }

// export const updateLoggingSessionComment = (loggingSessionId,comment) => async dispatch => {
//   // console.log("XXXX updateLoggingSessionComment",comment)
//   try {
//     const loggingSessions = await AsyncStorage.getItem('loggingSessions')
//       .then(loggingSessionsJson => {
//         const ret = loggingSessionsJson ? JSON.parse(loggingSessionsJson).sort((a,b) => (b.timestamp - a.timestamp)) : []
//         return ret
//       })
//     const loggingSession = loggingSessions.find(({ id }) => {
//       return (id === loggingSessionId)
//     })
//     loggingSession['comment'] = comment
//     AsyncStorage.setItem('loggingSessions',JSON.stringify(loggingSessions.sort((a,b) => (b.timestamp - a.timestamp))))
//     dispatch({
//       type: 'LOGGING_UPDATE_LOGGING_SESSION_COMMENT',
//       payload: { loggingSession },
//     })
//   } catch (e) {
//       console.log('Error in getLoggingSession', e)
//   }
// }

// export function clearLoggingSession() {
//   return (dispatch, getState) => {
//     dispatch({
//       type: 'LOGGING_CLEAR_LOGGING_SESSION',
//     })
//   }
// }

// export const deleteLoggingSession = (loggingSessionId) => async dispatch => {
//   try {
//     const loggingSessions = await AsyncStorage.getItem('loggingSessions')
//       .then(sessions => {
//         const newLoggingSessions = JSON.parse(sessions).filter(({id}) => (id!==loggingSessionId))
//         AsyncStorage.setItem('loggingSessions',JSON.stringify(newLoggingSessions.sort((a,b) => (b.timestamp - a.timestamp))))
//         return newLoggingSessions
//       })
//       .catch((e) => {
//         console.log("KKK Error here",e)
//       })
//     AsyncStorage.removeItem(`loggingSessionsData_${loggingSessionId}`)
//     RNFS.unlink(`${RNFS.DocumentDirectoryPath}/loggingSessionFiles/${loggingSessionId}`).catch((e) => { console.log("RNFS.unlink error",e)})
//     RNFS.unlink(`${RNFS.DocumentDirectoryPath}/loggingSessionFiles/${loggingSessionId}`).catch((e) => { console.log("RNFS.unlink error",e)})
//     RNFS.unlink(`${RNFS.DocumentDirectoryPath}/loggingSessionThumnails/${loggingSessionId}.jpg`).catch((e) => { console.log("RNFS.unlink error",e)})
//     dispatch({
//       type: 'LOGGING_DELETE_LOGGING_SESSION',
//       payload: { loggingSessions },
//     })
//   } catch (e) {
//     console.log('Error in deleteLoggingSession',e)
//   }
// }

// USING SQLITE DATABASE

import RNFS from 'react-native-fs';
import {getDBConnection, createLoggingTables} from '../utils/db.js';

export const startLogging = (
  loggingSessionId,
  deviceId,
  deviceName,
  timezoneName,
  timezoneOffset,
  turbidityEnabled,
  temperatureEnabled,
) => {
  const newSession = {
    id: loggingSessionId,
    deviceId,
    deviceName,
    timestamp: new Date().getTime(),
    timezoneName,
    timezoneOffset,
    turbidityEnabled,
    temperatureEnabled,
    comment: '',
  };

  return async dispatch => {
    const db = await getDBConnection();
    await db.executeSql(
      'INSERT INTO loggingSessions (id, deviceId, deviceName, timestamp, timezoneName, timezoneOffset, turbidityEnabled, temperatureEnabled, comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        newSession.id,
        newSession.deviceId,
        newSession.deviceName,
        newSession.timestamp,
        newSession.timezoneName,
        newSession.timezoneOffset,
        newSession.turbidityEnabled ? 1 : 0,
        newSession.temperatureEnabled ? 1 : 0,
        '',
      ],
    );
    dispatch({
      type: 'LOGGING_START_LOGGING',
      meta: {newSession},
    });
  };
};

export const addDataToLoggingSession =
  (loggingSessionId, dataObj) => async dispatch => {
    try {
      console.log('dTAOBJ', JSON.stringify(dataObj));
      const db = await getDBConnection();
      await db.executeSql(
        'INSERT INTO loggingSessionSamples (sessionId, timestamp, turbidityValue, temperatureValue, locationLat, locationLng, batteryLevel, batteryRawVoltage) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          loggingSessionId,
          dataObj.timestamp,
          dataObj.turbidityValue,
          dataObj.temperatureValue,
          dataObj.locationLat,
          dataObj.locationLng,
          dataObj.batteryLevel,
          dataObj.batteryRawVoltage,
        ],
      );
      dispatch({
        type: 'LOGGING_ADD_DATA_TO_SESSION',
        payload: {dataSample: dataObj},
      });
    } catch (e) {
      console.log('Error in addDataToLoggingSession', e);
    }
  };

export const saveLoggingSessionSamples = (loggingSessionId, dataSamples) => {
  return dispatch => {
    dispatch({
      type: 'LOGGING_SAVE_LOGGING_SESSION_SAMPLES',
      payload: dataSamples,
    });
  };
};

export const stopLogging = () => {
  return dispatch => {
    dispatch({
      type: 'LOGGING_STOP_LOGGING',
    });
  };
};

export const fetchLoggingSessions = () => async dispatch => {
  try {
    const db = await getDBConnection();
    const [results] = await db.executeSql(
      'SELECT * FROM loggingSessions ORDER BY timestamp DESC',
    );

    const loggingSessions = [];
    for (let i = 0; i < results.rows.length; i++) {
      loggingSessions.push(results.rows.item(i));
    }

    dispatch({
      // type: 'LOGGING_FETCH_loggingSessionSamples',
      type: 'LOGGING_FETCH_LOGGING_SESSIONS',
      payload: {loggingSessions},
    });
  } catch (e) {
    console.log('Error in fetchLoggingSessions', e);
  }
};

export const getLoggingSession = loggingSessionId => async dispatch => {
  try {
    const db = await getDBConnection();
    const [results] = await db.executeSql(
      'SELECT * FROM loggingSessions WHERE id = ?',
      [loggingSessionId],
    );
    const loggingSession = results.rows.length ? results.rows.item(0) : null;
    dispatch({
      type: 'LOGGING_GET_LOGGING_SESSION',
      payload: {loggingSession},
    });
  } catch (e) {
    console.log('Error in getLoggingSession', e);
  }
};

export const fetchLoggingSessionSamples =
  loggingSessionId => async dispatch => {
    try {
      const db = await getDBConnection();
      const [results] = await db.executeSql(
        'SELECT * FROM loggingSessionSamples WHERE sessionId = ? ORDER BY timestamp ASC',
        [loggingSessionId],
      );
      const loggingSessionSamples = [];
      for (let i = 0; i < results.rows.length; i++) {
        loggingSessionSamples.push(results.rows.item(i));
      }
      dispatch({
        type: 'LOGGING_FETCH_LOGGING_SESSION_SAMPLES',
        payload: {loggingSessionSamples},
      });
    } catch (e) {
      console.log('Error in fetchLoggingSessionSamples', e);
    }
  };

export const updateLoggingSessionComment =
  (loggingSessionId, comment) => async dispatch => {
    try {
      const db = await getDBConnection();
      await db.executeSql(
        'UPDATE loggingSessionSamples SET comment = ? WHERE id = ?',
        [comment, loggingSessionId],
      );
      const [results] = await db.executeSql(
        'SELECT * FROM loggingSessionSamples WHERE id = ?',
        [loggingSessionId],
      );
      const loggingSession = results.rows.length ? results.rows.item(0) : null;
      dispatch({
        type: 'LOGGING_UPDATE_LOGGING_SESSION_COMMENT',
        payload: {loggingSession},
      });
    } catch (e) {
      console.log('Error in updateLoggingSessionComment', e);
    }
  };

export const clearLoggingSession = () => {
  return dispatch => {
    dispatch({
      type: 'LOGGING_CLEAR_LOGGING_SESSION',
    });
  };
};

export const deleteLoggingSession = loggingSessionId => async dispatch => {
  try {
    const db = await getDBConnection();
    await db.executeSql(
      'DELETE FROM loggingSessionSamples WHERE sessionId = ?',
      [loggingSessionId],
    );
    await db.executeSql('DELETE FROM loggingSessionSamples WHERE id = ?', [
      loggingSessionId,
    ]);

    RNFS.unlink(
      `${RNFS.DocumentDirectoryPath}/loggingSessionFiles/${loggingSessionId}`,
    ).catch(e => console.log('RNFS.unlink error', e));
    RNFS.unlink(
      `${RNFS.DocumentDirectoryPath}/loggingSessionThumnails/${loggingSessionId}.jpg`,
    ).catch(e => console.log('RNFS.unlink error', e));

    dispatch({
      type: 'LOGGING_DELETE_LOGGING_SESSION',
      payload: {loggingSessionId},
    });
  } catch (e) {
    console.log('Error in deleteLoggingSession', e);
  }
};
