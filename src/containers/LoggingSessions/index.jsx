import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {SafeAreaView} from 'react-native';

import {connect} from 'react-redux';
import {CommonActions} from '@react-navigation/native';

import {fetchLoggingSessions} from '../../actions/LoggingActions';
import {fetchKnownDevices} from '../../actions/DeviceActions';
import IndexList from '../../components/LoggingSessions/IndexList';

class LoggingSessions extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isFetching: false,
    };
  }

  componentDidMount() {
    this.props.dispatch(fetchLoggingSessions());
    this.props.dispatch(fetchKnownDevices());
  }

  componentDidUpdate() {}

  componentWillUnmount() {}

  routeToLoggingSessionsView = (loggingSessionId, formattedDateTime) => {
    const routeToLoggingSessionViewAction = CommonActions.navigate({
      name: 'Logging Session',
      params: {loggingSessionId, formattedDateTime},
    });
    this.props.navigation.dispatch(routeToLoggingSessionViewAction);
  };

  onRefresh = () => {
    this.props.dispatch(fetchLoggingSessions());
  };

  renderBody = (props, state) => {
    return (
      <SafeAreaView style={{flex: 1}}>
        <IndexList
          devices={props.devices}
          logging={props.logging}
          isFetching={this.state.isFetching}
          listRefreshHandler={this.onRefresh}
          listItemPressHandler={this.routeToLoggingSessionsView}
        />
      </SafeAreaView>
    );
  };

  render() {
    return this.renderBody(this.props, this.state);
  }
}

export default connect(({devices, logging}) => ({devices, logging}))(
  LoggingSessions,
);
