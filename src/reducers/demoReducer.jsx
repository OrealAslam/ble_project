const initialState = {
  demoModeEnabled: false,
}

export default function (state = initialState, action) {

  switch(action.type) {

    case 'DEMO_SET_DEMO_MODE_ENABLED':
      return  { ...state, demoModeEnabled: action.meta.enabled }

    default:
      return state
  }

}
