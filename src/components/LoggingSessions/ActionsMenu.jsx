import React, { Component, useRef } from 'react'
import PropTypes from 'prop-types'
import { View, Text } from 'react-native'
import { Button } from '@rneui/themed'
import {Picker} from '@react-native-picker/picker'

const PickerCmp = (props) => {

  const pickerRef = useRef()

  function open() {
    pickerRef.current.focus()
  }

  function close() {
    pickerRef.current.blur()
  }

  const selectedLanguage = ''

  return <Picker
    ref={pickerRef}
    style={{ width: 140, borderWidth: 2, borderColor: 'black' }}
    onValueChange={(itemValue,itemIndex) => {
      props.onValueChange.call(this,itemValue)
    }}>
    <Picker.Item label="Actions..." value="" />
    <Picker.Item label="Email Data" value="email_data" />
    {/*<Picker.Item label="Export Data" value="export_data" />*/}
    <Picker.Item label="Delete Session" value="delete_session" />
  </Picker>

}


class ActionsMenu extends Component {

  constructor(props) {
    super(props)
    this.state = {
    }
  }

  onValueChangeHandler = (itemValue) => {
    switch (itemValue) {
      case 'email_data':
        this.props.emailDataHandler.call(this)
        break
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
    return <View style={{ padding: 6, display: 'flex', alignItems: 'flex-end', borderWidth: 0 }}>
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
