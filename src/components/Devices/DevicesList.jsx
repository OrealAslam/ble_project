import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {
  Text,
  View,
  TouchableOpacity,
  FlatList,
  useColorScheme,
} from 'react-native';
import {Icon} from '@rneui/themed';

class DevicesList extends Component {
  renderBody = (props, state) => {
    return (
      <View style={{margin: 20, marginTop: 0}}>
        <Text
          style={{
            marginBottom: 0,
            fontSize: 18,
            fontWeight: 700,
            color: '#000',
          }}>
          Devices List
        </Text>
        <TouchableOpacity>
          <Text
            style={{
              marginBottom: 6,
              fontSize: 14,
              fontWeight: 500,
              color: '#000',
            }}>
            Tap to connect
          </Text>
        </TouchableOpacity>
        <FlatList
          style={{height: 160, borderWidth: 1, borderColor: '#CCC'}}
          data={props.bondedDevices}
          keyExtractor={(item, index) => index}
          renderItem={({item}) => (
            <TouchableOpacity
              onPress={props.connectToDeviceHandler.bind(this, item)}>
              <View
                style={{
                  borderBottomWidth: 1,
                  borderColor: '#CCC',
                  display: 'flex',
                  flexDirection: 'row',
                }}>
                <View style={{margin: 10, flex: 1}}>
                  <Text
                    style={{
                      fontSize: 20,
                      color: '#000',
                    }}>
                    {item.name}
                  </Text>
                </View>
                <View
                  style={{
                    margin: 5,
                    width: 40,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}>
                  {item.isConnected && (
                    <Icon
                      name="checkmark-circle-outline"
                      type="ionicon"
                      color="#02b016"
                    />
                  )}
                  {item.inRange && !item.isConnected && (
                    <Icon name="radio-outline" type="ionicon" color="#666" />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  render() {
    return this.renderBody(this.props, this.state);
  }
}

export default DevicesList;
