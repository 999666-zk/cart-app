import React, {Component} from 'react';
import {View, StyleSheet} from 'react-native';
interface Props {
  progress: number;
}
export default class WebViewLoadBar extends Component<Props> {
  render() {
    let {progress} = this.props;
    let barStyle = Object.assign({}, styles.bar, {width: `${progress}%`});
    return progress < 100 && <View style={barStyle} />;
  }
}

const styles = StyleSheet.create({
  bar: {
    height: 2,
    position: 'absolute',
    backgroundColor: '#4caf50',
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    top: 0,
    left: 0,
    width: 0,
    zIndex: 99,
  },
});
