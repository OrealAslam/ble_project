import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { View } from 'react-native'
import MapView, { Marker } from 'react-native-maps'

class LocationMap extends Component {

  renderBody = (props,state) => {

    if (props.lat && props.lng) {

      const region = {
        latitude: props.lat,
        longitude: props.lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }

      return <View style={{ borderColor: '#CCC', borderWidth: 2, borderRadius: 10 }} >
        <MapView
          style={{
            minHeight: 300,
            height: 300,
            width: '100%',
            padding: 0,
          }}
          initialRegion={region}
          region={region}
          showsUserLocation={false}
          scrollEnabled={false}
          showsPointsOfInterest={false}
        >
          <Marker
            coordinate={{ latitude: props.lat, longitude: props.lng }}
          />
        </MapView>
      </View>

    }
  }

  render() {
    return this.renderBody(this.props,this.state)
  }

}

export default LocationMap
