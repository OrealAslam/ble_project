// import React, {Component} from 'react';
// import {View, Text, StyleSheet} from 'react-native';
// import {Button} from '@rneui/themed';
// import {Dropdown} from 'react-native-element-dropdown';

// const PickerCmp = props => {
//   const styles = StyleSheet.create({
//     container: {
//       padding: 10,
//       width: 200,
//     },
//     dropdown: {
//       height: 50,
//       borderColor: 'gray',
//       borderWidth: 0.5,
//       borderRadius: 8,
//       paddingHorizontal: 8,
//       backgroundColor: '#fff', // white background for dropdown
//     },
//     label: {
//       position: 'absolute',
//       backgroundColor: 'white',
//       left: 22,
//       top: 8,
//       zIndex: 999,
//       paddingHorizontal: 8,
//       fontSize: 14,
//       color: '#000',
//     },
//     placeholderStyle: {
//       fontSize: 16,
//       color: '#000',
//     },
//     selectedTextStyle: {
//       fontSize: 14,
//       color: '#000',
//     },
//     itemTextStyle: {
//       fontSize: 14,
//       color: '#000',
//     },
//     inputSearchStyle: {
//       height: 40,
//       fontSize: 16,
//       color: '#000',
//     },
//   });

//   return (
//     <View style={styles.container}>
//       <Dropdown
//         data={[
//           {label: 'Export Data', value: 'export_data'},
//           {label: 'Delete Session', value: 'delete_session'},
//         ]}
//         labelField="label"
//         valueField="value"
//         style={styles.dropdown}
//         placeholderStyle={styles.placeholderStyle}
//         selectedTextStyle={styles.selectedTextStyle}
//         itemTextStyle={styles.itemTextStyle} // apply black color to dropdown items
//         inputSearchStyle={styles.inputSearchStyle}
//         placeholder="Actions..."
//         onChange={item => {
//           props.onValueChange(item.value);
//         }}
//       />
//     </View>
//   );
// };

// class ActionsMenu extends Component {
//   onValueChangeHandler = itemValue => {
//     switch (itemValue) {
//       case 'export_data':
//         this.props.exportDataHandler();
//         break;
//       case 'delete_session':
//         this.props.deleteSessionHandler();
//         break;
//       default:
//         break;
//     }
//   };

//   pickerMenu = () => {
//     return (
//       <View style={{padding: 6, alignItems: 'flex-end'}}>
//         <PickerCmp onValueChange={this.onValueChangeHandler} />
//       </View>
//     );
//   };

//   renderBody = () => {
//     return <>{this.pickerMenu()}</>;
//   };

//   render() {
//     return this.renderBody();
//   }
// }

// export default ActionsMenu;

import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Dropdown} from 'react-native-element-dropdown';

const PickerCmp = ({onValueChange}) => {
  const styles = StyleSheet.create({
    container: {
      padding: 10,
      width: 200,
    },
    dropdown: {
      height: 50,
      borderColor: 'gray',
      borderWidth: 0.5,
      borderRadius: 8,
      paddingHorizontal: 8,
      backgroundColor: '#fff',
    },
    placeholderStyle: {
      fontSize: 16,
      color: '#000',
    },
    selectedTextStyle: {
      fontSize: 14,
      color: '#000',
    },
    itemTextStyle: {
      fontSize: 14,
      color: '#000',
    },
    inputSearchStyle: {
      height: 40,
      fontSize: 16,
      color: '#000',
    },
  });

  return (
    <View style={styles.container}>
      <Dropdown
        data={[
          {label: 'Export Data', value: 'export_data'},
          {label: 'Delete Session', value: 'delete_session'},
        ]}
        labelField="label"
        valueField="value"
        style={styles.dropdown}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        itemTextStyle={styles.itemTextStyle}
        inputSearchStyle={styles.inputSearchStyle}
        placeholder="Actions..."
        onChange={item => onValueChange(item.value)}
      />
    </View>
  );
};

const ActionsMenu = ({exportDataHandler, deleteSessionHandler}) => {
  const onValueChangeHandler = itemValue => {
    switch (itemValue) {
      case 'export_data':
        exportDataHandler();
        break;
      case 'delete_session':
        deleteSessionHandler();
        break;
      default:
        break;
    }
  };

  return (
    <View style={{padding: 6, alignItems: 'flex-end'}}>
      <PickerCmp onValueChange={onValueChangeHandler} />
    </View>
  );
};

export default ActionsMenu;
