import * as WebBrowser from 'expo-web-browser';

import {Button, Image, Platform, Text, View} from 'react-native';
import React, {Component} from 'react';

import {BackHandler} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {theme} from '../../theme';

interface Props {
  navigation: StackNavigationProp<any>;
  route: {
    key: string;
    params: {[key: string]: any};
  };
}
export default class UnsupportedFile extends Component<Props> {
  componentDidMount() {
    this.props.navigation.setOptions({
      title: '文件预览',
    });
    if (Platform.OS === 'android') {
      BackHandler.addEventListener(
        'hardwareBackPress',
        this.onhardwareBack.bind(this),
      );
    }
  }
  onhardwareBack() {
    if (this.props.navigation.canGoBack()) {
      this.props.navigation.goBack();
      return true;
    }
    return false;
  }
  componentWillUnmount() {
    BackHandler.removeEventListener(
      'hardwareBackPress',
      this.onhardwareBack.bind(this),
    );
  }
  openInBrowser() {
    const {fileUrl} = this.props.route.params;
    WebBrowser.openBrowserAsync(fileUrl, {
      showTitle: false,
      toolbarColor: theme.brandPrimary,
      showInRecents: true,
    });
  }
  render() {
    return (
      <View
        style={{
          paddingHorizontal: 30,
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1,
        }}>
        <Image
          source={require('../../assets/file.png')}
          style={{marginBottom: 30, width: 64, height: 64}}
        />
        <Text style={{marginBottom: 60}}>
          不支持预览该文件，请在浏览器中打开
        </Text>
        <Button
          title="在浏览器中打开"
          onPress={this.openInBrowser.bind(this)}
          color={theme.brandPrimary}></Button>
      </View>
    );
  }
}
