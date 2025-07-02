// import React, {Component} from 'react';
// import PropTypes from 'prop-types';
// import {View, Text} from 'react-native';
// import {Dialog} from '@rneui/themed';

// class WaitingDialog extends Component {
//   renderBody = (props, state) => {
//     return (
//       <Dialog>
//         <Dialog.Loading />
//         <View style={{display: 'flex', alignItems: 'center'}}>
//           <Text style={{color: '#000', fontSize: 14}}>
//             {props.text || 'Waiting...'}
//           </Text>
//         </View>
//       </Dialog>
//     );
//   };

//   render() {
//     return this.renderBody(this.props, this.state);
//   }
// }

// export default WaitingDialog;

import React from 'react';
import {View, Text} from 'react-native';
import {Dialog} from '@rneui/themed';

const WaitingDialog = ({text}) => {
  return (
    <Dialog>
      <Dialog.Loading />
      <View style={{display: 'flex', alignItems: 'center'}}>
        <Text style={{color: '#000', fontSize: 14}}>
          {text || 'Waiting...'}
        </Text>
      </View>
    </Dialog>
  );
};

export default WaitingDialog;
