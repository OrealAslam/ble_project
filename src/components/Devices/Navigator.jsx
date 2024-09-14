import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Text, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { HeaderBackButton } from '@react-navigation/native-stack'
import { lightColors } from '@rneui/themed'

import Devices from '../../containers/Devices'
import DeviceView from '../../containers/Devices/DeviceView'
import AddEditDevicesView from '../../containers/Devices/AddEditDevicesView'
import EditUnpairDevice from '../../containers/Devices/EditUnpairDevice'

const RootStack = createNativeStackNavigator()

const DevicesScreen = ({ route, navigation }) => <Devices route={route} navigation={navigation} />
const DeviceViewScreen = ({ route, navigation }) => <DeviceView route={route} navigation={navigation} />
// const AddEditDevicesViewScreen  = ({ route, navigation }) => <AddEditDevicesView route={route} navigation={navigation} />
// const EditUnpairDeviceScreen  = ({ route, navigation }) => <EditUnpairDevice route={route} navigation={navigation} />

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
            <RootStack.Screen name="Devices" component={DevicesScreen} />
            <RootStack.Screen
              name="DeviceView"
              component={DeviceViewScreen}
              options={({ route }) => ({
                title: `Connected to ${route.params?.deviceName}`,
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
