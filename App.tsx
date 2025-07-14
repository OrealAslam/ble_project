/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect} from 'react';

import {createStore, applyMiddleware} from 'redux';
import {Provider} from 'react-redux';
import {createLogger} from 'redux-logger';
import {createPromise} from 'redux-promise-middleware';
const thunkMiddleware = require('redux-thunk').thunk;

import {SafeAreaProvider} from 'react-native-safe-area-context';
// import SplashScreen from 'react-native-splash-screen';
import BootSplash from 'react-native-bootsplash';

import combinedReducer from './src/reducers/index.jsx';

import TabContainer from './src/components/TabContainer';
import {createTables, getDBConnection} from './src/utils/db.js';

const store = createStore(
  combinedReducer,
  applyMiddleware(createPromise(), thunkMiddleware, createLogger()),
);

function App(): React.JSX.Element {
  useEffect(() => {
    const initDB = async () => {
      try {
        const db = await getDBConnection();
        await createTables(db);
        console.log('SQLite tables initialized');
      } catch (error) {
        console.error('Failed to initialize DB:', error);
      }
      console.log('hiding splash screen');
      // SplashScreen.hide();
      await BootSplash.hide({fade: true}); // Hide the splash screen with a fade effect
    };

    initDB();
  }, []);

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <TabContainer />
      </SafeAreaProvider>
    </Provider>
  );
}
export default App;
