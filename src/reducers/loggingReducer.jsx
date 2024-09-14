const initialState = {
  isLogging: false,
  loggingSessionId: null,
  loggingSession: null,
  loggingSessions: [],
  loggingSessionSamplesLoaded: false,
  loggingSessionSamples: [],
}

export default function (state = initialState, action) {

  switch(action.type) {

    case 'LOGGING_START_LOGGING':
      return  { ...state, loggingSessionId: action.meta.newSession.id, isLogging: true, loggingSession: action.meta.newSession, loggingSessionSamples: [] }

    case 'LOGGING_STOP_LOGGING':
      return  { ...state, isLogging: false, loggingSessionSamples: [] }

    case 'LOGGING_ADD_DATA_TO_SESSION':
      const loggingSessionSamples = [ ...state.loggingSessionSamples, ...[action.payload.dataSample] ]
      return  { ...state, loggingSessionSamples: loggingSessionSamples }

    case 'LOGGING_FETCH_LOGGING_SESSIONS':
    case 'LOGGING_DELETE_LOGGING_SESSION':
      return  { ...state, loggingSessions: action.payload.loggingSessions }

    case 'LOGGING_GET_LOGGING_SESSION':
    case 'LOGGING_UPDATE_LOGGING_SESSION_COMMENT':
      return  { ...state, loggingSessionId: action.payload.loggingSession.id, loggingSession: action.payload.loggingSession }

    case 'LOGGING_FETCH_LOGGING_SESSION_SAMPLES':
      return  { ...state, loggingSessionSamples: action.payload.loggingSessionSamples, loggingSessionSamplesLoaded: true }

    case 'LOGGING_CLEAR_LOGGING_SESSION':
      return  { ...state, loggingSessionSamples: [], loggingSessionId: null, loggingSession: null, loggingSessionSamplesLoaded: false }

    default:
      return state

  }
}
