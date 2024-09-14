import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Text, View } from 'react-native'
import { lightColors } from '@rneui/themed'

const RootStack = createNativeStackNavigator()

import LoggingSessions from '../../containers/LoggingSessions'
import LoggingSessionView from '../../containers/LoggingSessions/LoggingSessionView'

const LoggingSessionsScreen = ({ route, navigation }) => <LoggingSessions route={route} navigation={navigation} />
const LoggingSessionViewScreen = ({ route, navigation }) => <LoggingSessionView route={route} navigation={navigation} />

class Navigator extends Component {

  renderBody = (props,state) => {
    return <View style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <NavigationContainer>
          <RootStack.Navigator screenOptions={{
            headerShown: true,
            headerStyle: {
              backgroundColor: lightColors.primary,
            },
            headerTintColor: '#FFF',
            headerTitleStyle: {
              fontWeight: '700',
              fontSize: 16,
            }
          }}>
            <RootStack.Screen name="Logging Sessions" component={LoggingSessionsScreen} />
            <RootStack.Screen
              name="Logging Session"
              component={LoggingSessionViewScreen}
              options={({ route }) => ({
                title: `Logging Session at ${route.params?.formattedDateTime}`,
                headerStyle: {
                  backgroundColor: lightColors.primary,
                },
                headerTintColor: '#FFF',
                headerTitleStyle: {
                  fontWeight: '300',
                  fontSize: 12,
                }
              })}
            />
          </RootStack.Navigator>
        </NavigationContainer>
    </View>
  }

  render() {
    return this.renderBody(this.props,this.state)
  }

}

export default Navigator
