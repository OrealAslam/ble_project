import React, { Component, useRef } from 'react'
import PropTypes from 'prop-types'
import { View, Text, StyleSheet } from 'react-native'
import { Button } from '@rneui/themed'
import { Dropdown } from 'react-native-element-dropdown'

const PickerCmp = (props) => {

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
    },
    icon: {
      marginRight: 5,
    },
    label: {
      position: 'absolute',
      backgroundColor: 'white',
      left: 22,
      top: 8,
      zIndex: 999,
      paddingHorizontal: 8,
      fontSize: 14,
    },
    placeholderStyle: {
      fontSize: 16,
    },
    selectedTextStyle: {
      fontSize: 14,
    },
    iconStyle: {
      width: 20,
      height: 20,
    },
    inputSearchStyle: {
      height: 40,
      fontSize: 16,
    },
  })

  const renderLabel = () => {
    return (
      <Text style={[styles.label, { color: 'blue' }]}>
        Dropdown label
      </Text>
    )
  }

  return <View style={styles.container}>
    <Dropdown
      data={[
        { label: 'Export Data', value: 'export_data' },
        { label: 'Delete Session', value: 'delete_session' },
      ]}
      labelField="label"
      valueField="value"
      style={[styles.dropdown, { borderColor: 'blue' }]}
      placeholderStyle={styles.placeholderStyle}
      selectedTextStyle={styles.selectedTextStyle}
      inputSearchStyle={styles.inputSearchStyle}
      placeholder={'Actions...'}
      onChange={item => {
        props.onValueChange.call(this,item.value)
      }}
    />
  </View>

}


class ActionsMenu extends Component {

  constructor(props) {
    super(props)
    this.state = {
    }
  }

  onValueChangeHandler = (itemValue) => {
    switch (itemValue) {
      case 'export_data':
        this.props.exportDataHandler.call(this)
         break
      case 'delete_session':
        this.props.deleteSessionHandler.call(this)
        break
      default:
        null
    }
  }

  pickerMenu = (props) => {
    return <View style={{ padding: 6, display: 'flex', alignItems: 'flex-end' }}>
      <PickerCmp
        onValueChange={this.onValueChangeHandler}
      />
    </View>
  }

  actionsMenu = (props) => {
    return <View style={{ padding: 12, display: 'flex', alignItems: 'flex-end', borderWidth: 2 }}>
      <Button><Text>Actions</Text></Button>
    </View>
  }

  renderBody = (props,state) => {
    return <>
      <>{this.pickerMenu(props)}</>
    </>
  }

  render() {
    return this.renderBody(this.props,this.state)
  }

}

export default ActionsMenu
