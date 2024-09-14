import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { View, Text, TouchableOpacity, FlatList, ImageBackground, PanResponder } from 'react-native'
import { Icon } from '@rneui/themed'
import { DateTime } from 'luxon'
import RNFS from 'react-native-fs'

const formatDateTime = (timestamp) => {
  return DateTime.fromMillis(timestamp).toFormat("ccc d LLL yyyy HH:mm")
}

const ListItem = ({ id, timestamp, itemName, onPressHandler }) => {

  const formattedDateTime = formatDateTime(timestamp)

  return <TouchableOpacity onPress={onPressHandler.bind(this,id,formattedDateTime)}>
    <View style={{ margin: 10, borderBottomWidth: 1, borderColor: "#CCC" }}>
      <View style={{ borderWidth: 0, borderBottomWidth: 1, borderColor: '#AAA', padding: 0, paddingBottom: 10, display: 'flex', flexDirection: 'row' }}>
        <View style={{ width: 60, height: 60, borderWidth: 0, marginRight: 10 }}>
          <ImageBackground
            source={{uri: `file:\/\/${RNFS.DocumentDirectoryPath}/loggingSessionThumnails/${id}.jpg` }}
            resizeMode="cover"
            style={{
              flex: 1,
              justifyContent: 'center',
            }}
          />
        </View>
        <View>
          <Text style={{ fontSize: 18, fontWeight: 700 }}>
            {itemName}
          </Text>
          <Text>
            {formattedDateTime}
          </Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
}

class IndexList extends Component {

  constructor(props) {
    super(props)
    this.state = {
      isFetching: false
    }
  }

  renderBody = (props,state) => {

    const { logging, devices } = props

    return <FlatList
      data={logging.loggingSessions}
      renderItem={({index,item}) => {
        const { deviceIdNameHash } = props.devices
        const itemName = deviceIdNameHash[item.deviceId]
        return <ListItem
          index={index}
          {...item}
          itemName={itemName}
          onPressHandler={props.listItemPressHandler}
        />
      }}
      keyExtractor={(item, index) => {
        return index.toString()
      }}
      onRefresh={() => props.listRefreshHandler.call(this)}
      refreshing={props.isFetching}
    />

  }

  render() {
    return this.renderBody(this.props,this.state)
  }

}

export default IndexList
