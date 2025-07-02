// import React, {Component} from 'react';
// import PropTypes from 'prop-types';
// import {Text, View} from 'react-native';

// class RangeIndicator extends Component {
//   renderBody = (props, state) => {
//     if (!props.rangeLabel) {
//       return null;
//     }

//     return (
//       <View style={{padding: 20, paddingTop: 0, width: '100%'}}>
//         <View
//           style={{
//             padding: 10,
//             backgroundColor: 'rgb(0,179,88)',
//             width: '100%',
//             display: 'flex',
//             flexDirection: 'column',
//             justifyContent: 'center',
//             alignItems: 'center',
//           }}>
//           <Text style={{fontSize: 18, fontWeight: 600, color: '#000'}}>
//             {props.rangeLabel}
//           </Text>
//         </View>
//       </View>
//     );
//   };

//   render() {
//     return this.renderBody(this.props, this.state);
//   }
// }

// export default RangeIndicator;

import React from 'react';
import {Text, View} from 'react-native';

const RangeIndicator = ({rangeLabel}) => {
  if (!rangeLabel) {
    return null;
  }

  return (
    <View style={{padding: 20, paddingTop: 0, width: '100%'}}>
      <View
        style={{
          padding: 10,
          backgroundColor: 'rgb(0,179,88)',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Text style={{fontSize: 18, fontWeight: '600', color: '#000'}}>
          {rangeLabel}
        </Text>
      </View>
    </View>
  );
};

export default RangeIndicator;
