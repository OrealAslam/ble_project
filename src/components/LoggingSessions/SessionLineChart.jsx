// // import React, {Component} from 'react';
// // import PropTypes from 'prop-types';
// // import {View, Text} from 'react-native';

// // import {LineChart} from 'react-native-gifted-charts';

// // class SessionLineChart extends Component {
// //   lineChart = props => {
// //     const limit = 200; //props.turbiditySamples.length
// //     const limitedList = props.turbiditySamples.slice(0, limit);
// //     const valuesMap = limitedList.map(dp => {
// //       return dp.value;
// //     });
// //     console.log('limitedList', limitedList);
// //     const maxValue = Math.max(...valuesMap);
// //     const minValue = Math.min(...valuesMap);
// //     const roundedMaxValue = Math.ceil(maxValue / 10) * 10;
// //     const roundedMinValue = Math.floor(maxValue / 10) * 10;

// //     return (
// //       <View>
// //         <View
// //           style={{
// //             backgroundColor: '#1A3461',
// //             borderWidth: 2,
// //             borderColor: 'white',
// //           }}>
// //           <LineChart
// //             initialSpacing={0}
// //             data={limitedList}
// //             spacing={10}
// //             hideDataPoints
// //             thickness={2}
// //             endSpacing={1}
// //             adjustToWidth={true}
// //             curved={false}
// //             hideRules
// //             hideYAxisText
// //             curved
// //             pressEnabled
// //             showDataPointOnPress
// //             adjustToWidth
// //             yAxisColor="#0BA5A4"
// //             showVerticalLines
// //             verticalLinesColor="rgba(14,164,164,0.5)"
// //             xAxisColor="#0BA5A4"
// //             color="#0BA5A4"
// //             maxValue={roundedMaxValue}
// //             minValue={roundedMinValue}
// //           />
// //         </View>
// //       </View>
// //     );
// //   };

// //   componentWillUnmount = () => {};

// //   renderBody = (props, state) => {
// //     return this.lineChart(props);
// //   };

// //   render() {
// //     return this.renderBody(this.props, this.state);
// //   }
// // }

// // export default SessionLineChart;

// import React from 'react';
// import {View} from 'react-native';
// import {LineChart} from 'react-native-gifted-charts';

// const SessionLineChart = ({turbiditySamples}) => {
//   const limit = 200;
//   const limitedList = turbiditySamples.slice(0, limit);
//   const valuesMap = limitedList.map(dp => dp.value);

//   const maxValue = Math.max(...valuesMap);
//   const minValue = Math.min(...valuesMap);
//   const roundedMaxValue = Math.ceil(maxValue / 10) * 10;
//   const roundedMinValue = Math.floor(minValue / 10) * 10;

//   return (
//     <View>
//       <View
//         style={{
//           backgroundColor: '#1A3461',
//           borderWidth: 2,
//           borderColor: 'white',
//         }}>
//         <LineChart
//           initialSpacing={0}
//           data={limitedList}
//           spacing={10}
//           hideDataPoints
//           thickness={2}
//           endSpacing={1}
//           adjustToWidth={true}
//           curved
//           pressEnabled
//           showDataPointOnPress
//           yAxisColor="#0BA5A4"
//           showVerticalLines
//           verticalLinesColor="rgba(14,164,164,0.5)"
//           xAxisColor="#0BA5A4"
//           color="#0BA5A4"
//           maxValue={roundedMaxValue}
//           minValue={roundedMinValue}
//         />
//       </View>
//     </View>
//   );
// };

// export default SessionLineChart;

//  UPDATED CHATGPT CODE
import React from 'react';
import {View} from 'react-native';
import {LineChart} from 'react-native-gifted-charts';

const SessionLineChart = ({turbiditySamples}) => {
  const limit = 200;
  const limitedList = turbiditySamples.slice(0, limit);

  const valuesMap = limitedList.map(dp => dp.value);
  const maxValue = Math.ceil(Math.max(...valuesMap) / 10) * 10;
  const minValue = Math.floor(Math.min(...valuesMap) / 10) * 10;

  const chartData = limitedList.map(dp => ({
    value: dp.value,
    label: dp.label, // 👈 ensures labels appear
  }));

  return (
    <View
      style={{
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#2e2e2e',
      }}>
      <LineChart
        data={chartData}
        curved
        adjustToWidth={true}
        isAnimated={true}
        dashGap={4}
        initialSpacing={0}
        spacing={40}
        dataPointsColor="#2A5B1B"
        hideDataPoints
        thickness={3}
        noOfSectionsBelowXAxis={0}
        endSpacing={30}
        pressEnabled
        showDataPointOnPress
        showXAxisIndices={true}
        scrollAnimationEnabled={true}
        onDataChangeAnimationDuration={500}
        yAxisTextStyle={{color: '#000', fontSize: 12}}
        yAxisColor="#000"
        showVerticalLines
        verticalLinesColor="rgba(15, 16, 16, 0.5)"
        xAxisColor="#000"
        color="#8c8c8c"
        maxValue={maxValue}
        minValue={minValue}
        yAxisLabel={'#000'}
        xAxisLabelTextStyle={{width: 80, marginLeft: -36, color: '#000'}}
        xAxisIndicesHeight={2}
      />
    </View>
  );
};

export default SessionLineChart;
