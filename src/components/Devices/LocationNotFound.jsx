import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Text, View, ActivityIndicator} from 'react-native';
import {lightColors} from '@rneui/themed';

class LocationNotFound extends Component {
  renderBody = (props, state) => {
    if (!props.locationEnabled || (!props.lat && !props.lng)) {
      const locationDisabled = !props.locationEnabled;
      const searchingForLocation =
        !locationDisabled && !props.lat && !props.lng;

      let message = '';
      if (locationDisabled) {
        message =
          "Location is disabled in your phone's settings. Please open Settings, go to Location and set it to On.";
      } else if (searchingForLocation) {
        message = 'Searching for location...';
      }

      const {mapHeight} = props;

      return (
        <View style={{borderColor: '#CCC', borderWidth: 2, borderRadius: 10}}>
          <View
            style={{
              minHeight: mapHeight,
              height: mapHeight,
              width: '100%',
              padding: 20,
              backgroundColor: '#CCC',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            {searchingForLocation && (
              <ActivityIndicator
                size="small"
                color={lightColors.primary}
                style={{marginBottom: 10}}
              />
            )}
            <Text style={{fontSize: 14, fontWeight: 300, color: '#000'}}>
              {message}
            </Text>
          </View>
        </View>
      );
    }
  };

  render() {
    return this.renderBody(this.props, this.state);
  }
}

export default LocationNotFound;
