export function setDemoModeEnabled(enabled) {
  return (dispatch, getState) => {
    dispatch({
      type: 'DEMO_SET_DEMO_MODE_ENABLED',
      meta: {enabled},
    });
  };
}
