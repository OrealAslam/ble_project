// import React from 'react';
// import {NavigationContainer} from '@react-navigation/native';
// import {createNativeStackNavigator} from '@react-navigation/native-stack';
// import {View} from 'react-native';
// import {lightColors} from '@rneui/themed';

// import LoggingSessions from '../../containers/LoggingSessions';
// import LoggingSessionView from '../../containers/LoggingSessions/LoggingSessionView';

// const RootStack = createNativeStackNavigator();

// const LoggingSessionsScreen = ({route, navigation}) => (
//   <LoggingSessions route={route} navigation={navigation} />
// );

// const LoggingSessionViewScreen = ({route, navigation}) => (
//   <LoggingSessionView route={route} navigation={navigation} />
// );

// const Navigator = () => {
//   return (
//     <View style={{display: 'flex', flexDirection: 'column', flex: 1}}>
//       <NavigationContainer>
//         <RootStack.Navigator
//           screenOptions={{
//             headerShown: true,
//             headerStyle: {
//               backgroundColor: lightColors.primary,
//             },
//             headerTintColor: '#FFF',
//             headerTitleStyle: {
//               fontWeight: '700',
//               color: '#000',
//               fontSize: 16,
//             },
//           }}>
//           <RootStack.Screen
//             name="Logging Sessions"
//             component={LoggingSessionsScreen}
//           />
//           <RootStack.Screen
//             name="Logging Session"
//             component={LoggingSessionViewScreen}
//             options={({route}) => ({
//               title: `Logging Session at ${route.params?.formattedDateTime}`,
//               headerStyle: {
//                 backgroundColor: lightColors.primary,
//               },
//               headerTintColor: '#FFF',
//               headerTitleStyle: {
//                 fontWeight: '300',
//                 fontSize: 12,
//               },
//             })}
//           />
//         </RootStack.Navigator>
//       </NavigationContainer>
//     </View>
//   );
// };

// export default Navigator;

import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {View} from 'react-native';
import {lightColors} from '@rneui/themed';

import LoggingSessions from '../../containers/LoggingSessions';
import LoggingSessionView from '../../containers/LoggingSessions/LoggingSessionView';

const RootStack = createNativeStackNavigator();

const Navigator = () => {
  return (
    <View style={{flex: 1}}>
      <NavigationContainer>
        <RootStack.Navigator
          screenOptions={{
            headerShown: true,
            headerStyle: {backgroundColor: lightColors.primary},
            headerTintColor: '#FFF',
            headerTitleStyle: {
              fontWeight: '700',
              fontSize: 16,
              color: '#000',
            },
          }}>
          <RootStack.Screen
            name="Logging Sessions"
            component={LoggingSessions}
          />
          <RootStack.Screen
            name="Logging Session"
            component={LoggingSessionView}
            options={({route}) => ({
              title: `Logging Session at ${route.params?.formattedDateTime}`,
              headerStyle: {backgroundColor: lightColors.primary},
              headerTintColor: '#FFF',
              headerTitleStyle: {
                fontWeight: '300',
                fontSize: 12,
                color: '#000',
              },
            })}
          />
        </RootStack.Navigator>
      </NavigationContainer>
    </View>
  );
};

export default Navigator;
