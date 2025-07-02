/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect} from 'react';
import type {PropsWithChildren} from 'react';
import {useColorScheme, StyleSheet} from 'react-native';

import {NativeModules} from 'react-native';
import {createStore, applyMiddleware} from 'redux';
import {Provider} from 'react-redux';
import {createLogger} from 'redux-logger';
import {createPromise} from 'redux-promise-middleware';
const thunkMiddleware = require('redux-thunk').thunk;

import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import SplashScreen from 'react-native-splash-screen';

import combinedReducer from './src/reducers/index.jsx';

import {Colors} from 'react-native/Libraries/NewAppScreen';

const RootStack = createNativeStackNavigator();

import TabContainer from './src/components/TabContainer';
import {createTables, getDBConnection} from './src/utils/db.js';

const store = createStore(
  combinedReducer,
  applyMiddleware(createPromise(), thunkMiddleware, createLogger()),
);

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    const initDB = async () => {
      try {
        const db = await getDBConnection();
        await createTables(db);
        console.log('SQLite tables initialized');
      } catch (error) {
        console.error('Failed to initialize DB:', error);
      }
    };

    initDB();

    SplashScreen.hide();
  }, []);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <TabContainer />
      </SafeAreaProvider>
    </Provider>
  );
}
export default App;
