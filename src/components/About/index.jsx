import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Text, View} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import {SafeAreaView} from 'react-native';

class About extends Component {
  renderBody = (props, state) => {
    return (
      <SafeAreaView style={{flex: 1}}>
        <View style={{paddingTop: 40, padding: 20}}>
          <Text style={{fontSize: 22, fontWeight: 700, color: '#000'}}>
            Observator NEP-LINK
          </Text>
          <Text
            style={{
              fontSize: 16,
              fontWeight: 400,
              color: '#000',
            }}>{`Version ${DeviceInfo.getVersion()} (${DeviceInfo.getBuildNumber()})`}</Text>
        </View>
      </SafeAreaView>
    );
  };

  render() {
    return this.renderBody(this.props, this.state);
  }
}

export default About;
