// import React, {Component} from 'react';
// import PropTypes from 'prop-types';
// import {Text, View, Image} from 'react-native';

// const ObservatorBrandImg = require('../../assets/observator-logo.png');

// class NepLinkHeader extends Component {
//   renderBody = (props, state) => {
//     return (
//       <View style={{margin: 20, display: 'flex', flexDirection: 'row'}}>
//         <View>
//           <Image
//             source={ObservatorBrandImg}
//             style={{width: 100, height: 90}}
//             resizeMode="contain"
//           />
//         </View>
//         <View style={{paddingLeft: 20, paddingTop: 20}}>
//           <Text style={{fontSize: 20, fontWeight: 700, color: '#000'}}>
//             NEP-LINK BLE
//           </Text>
//           <Text style={{fontSize: 16, fontWeight: 400, color: '#000'}}>
//             by Observator
//           </Text>
//         </View>
//       </View>
//     );
//   };

//   render() {
//     return this.renderBody(this.props, this.state);
//   }
// }

// export default NepLinkHeader;

import React from 'react';
import {Text, View, Image} from 'react-native';

const ObservatorBrandImg = require('../../assets/observator-logo.png');

const NepLinkHeader = () => {
  return (
    <View style={{margin: 20, display: 'flex', flexDirection: 'row'}}>
      <View>
        <Image
          source={ObservatorBrandImg}
          style={{width: 100, height: 90}}
          resizeMode="contain"
        />
      </View>
      <View style={{paddingLeft: 20, paddingTop: 20}}>
        <Text style={{fontSize: 20, fontWeight: '700', color: '#000'}}>
          NEP-LINK BLE
        </Text>
        <Text style={{fontSize: 16, fontWeight: '400', color: '#000'}}>
          by Observator
        </Text>
      </View>
    </View>
  );
};

export default NepLinkHeader;
