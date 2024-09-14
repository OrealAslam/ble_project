import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { View, Text } from 'react-native'

import { LineChart } from "react-native-gifted-charts"

class SessionLineChart extends Component {

  lineChart = (props) => {

    const limit = 200 //props.turbiditySamples.length
    const limitedList = props.turbiditySamples.slice(0,limit)
    const valuesMap = limitedList.map((dp) => {
      return dp.value
    })
    console.log("limitedList",limitedList)
    const maxValue = Math.max(...valuesMap)
    const minValue = Math.min(...valuesMap)
    const roundedMaxValue = Math.ceil(maxValue/10)*10
    const roundedMinValue = Math.floor(maxValue/10)*10

    return (
      <View>
        <View style={{backgroundColor: '#1A3461', borderWidth: 2, borderColor: 'white'}}>
          <LineChart
            initialSpacing={0}
            data={limitedList}
            spacing={10}
            hideDataPoints
            thickness={2}
            endSpacing={1}
            adjustToWidth={true}
            curved={false}
            hideRules
            hideYAxisText
            curved
            pressEnabled
            showDataPointOnPress
            adjustToWidth
            yAxisColor="#0BA5A4"
            showVerticalLines
            verticalLinesColor="rgba(14,164,164,0.5)"
            xAxisColor="#0BA5A4"
            color="#0BA5A4"
            maxValue={roundedMaxValue}
            minValue={roundedMinValue}
          />
        </View>
      </View>
    )

  }

  componentWillUnmount = () => {
  }

  renderBody = (props,state) => {
    return this.lineChart(props)
  }

  render() {
    return this.renderBody(this.props,this.state)
  }

}

export default SessionLineChart
