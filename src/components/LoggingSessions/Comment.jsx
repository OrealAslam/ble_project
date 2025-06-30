import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Text, View, TouchableOpacity} from 'react-native';
import {Icon} from '@rneui/themed';

class Comment extends Component {
  renderCommentLines = comment => {
    return (comment || '').split('\n').map((line, index) => (
      <Text key={index.toString()} style={{fontSize: 14, color: '#000'}}>
        {line}
      </Text>
    ));
  };

  renderBody = (props, state) => {
    const {comment} = props;

    return (
      <View
        style={{
          padding: 10,
          margin: 20,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderWidth: 1,
          borderColor: '#CCC',
          borderRadius: 5,
        }}>
        <Text style={{fontSize: 16, fontWeight: 700, color: '#000'}}>
          Comment
        </Text>
        <TouchableOpacity onPress={props.commentEditOnPressHandler}>
          <View
            style={{
              padding: 0,
              marginTop: 6,
              flex: 1,
              display: 'flex',
              flexDirection: 'row',
            }}>
            <View style={{flex: 1}}>{this.renderCommentLines(comment)}</View>
            <View style={{padding: 2, paddingLeft: 10, borderWidth: 0}}>
              <Icon name={'create-outline'} type="ionicon" color="#000" />
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  render() {
    return this.renderBody(this.props, this.state);
  }
}

export default Comment;
