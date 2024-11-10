import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Tab, Text, TabView } from '@rneui/themed'

import DevicesNavigator from './Devices/Navigator.jsx'
import LoggingSessionsNavigator from './LoggingSessions/Navigator.jsx'
import AboutPage from './About'

export default () => {
  const [index, setIndex] = React.useState(0);

  return (
    <>
      <TabView value={index} onChange={setIndex} animationType="spring" disableSwipe={true}>
        <TabView.Item style={{ width: '100%', backgroundColor: 'white' }}>
          <DevicesNavigator />
        </TabView.Item>
        <TabView.Item style={{ width: '100%', backgroundColor: 'white' }}>
          <LoggingSessionsNavigator />
        </TabView.Item>
        <TabView.Item style={{ width: '100%', backgroundColor: 'white' }}>
          <AboutPage />
        </TabView.Item>
      </TabView>

      <Tab
        value={index}
        onChange={(e) => setIndex(e)}
        indicatorStyle={{
          backgroundColor: 'white',
          height: 3,
        }}
        variant="primary"
        style={{
          paddingBottom: 40,
        }}
      >
        <Tab.Item
          title="Devices"
          titleStyle={{ fontSize: 12 }}
          icon={{ name: 'thermometer', type: 'ionicon', color: 'white' }}
        />
        <Tab.Item
          title="Logging Sessions"
          titleStyle={{ fontSize: 12 }}
          icon={{ name: 'list', type: 'ionicon', color: 'white' }}
        />
        <Tab.Item
          title="About"
          titleStyle={{ fontSize: 12 }}
          icon={{ name: 'information', type: 'ionicon', color: 'white' }}
        />
      </Tab>

    </>
  )
}
