// import React, { Component } from 'react'
// import PropTypes from 'prop-types'
// import { Text, View, ActivityIndicator } from 'react-native'
// import { lightColors } from '@rneui/themed'

// class WaitingScreen extends Component {

//   renderBody = (props,state) => {

//     return <View style={{ display: 'flex', flexDirection: 'column', flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' }} >
//         <ActivityIndicator size="large" color={lightColors.primary} />
//         <Text style={{ fontSize: 14, fontWeight: 300, color: "#000", marginTop: 20 }}>{props.waitingText}</Text>
//     </View>
//   }

//   render() {
//     return this.renderBody(this.props,this.state)
//   }

// }

// export default WaitingScreen

import React from 'react';
import {Text, View, ActivityIndicator} from 'react-native';
import {lightColors} from '@rneui/themed';

const WaitingScreen = ({waitingText}) => {
  return (
    <View
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <ActivityIndicator size="large" color={lightColors.primary} />
      <Text
        style={{
          fontSize: 14,
          fontWeight: '300',
          color: '#000',
          marginTop: 20,
        }}>
        {waitingText}
      </Text>
    </View>
  );
};

export default WaitingScreen;
