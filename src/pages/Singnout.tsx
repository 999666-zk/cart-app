import {Alert, Platform, View} from 'react-native';
import React, {Component} from 'react';

import IWebView from '../components/IWebView';
import {StackNavigationProp} from '@react-navigation/stack';
import WebViewLoadBar from '../components/WebViewLoadBar';
import {WebViewProgressEvent} from 'react-native-webview/lib/WebViewTypes';
import {clearAuthCache} from '../utils/oauth';
import i18n from '../utils/i18n';

interface Props {
  navigation: StackNavigationProp<any>;
}
class Signout extends Component<Props> {
  state = {
    loadProgress: 0,
  };
  isRedirect: boolean = false;
  componentDidMount() {
    clearAuthCache();
    this.props.navigation.setOptions({
      title: i18n.t('signOut'),
      headerLeft: () => <View />,
    });
  }
  onLoadProgress({nativeEvent}: WebViewProgressEvent) {
    let {progress} = nativeEvent;
    let loadProgress = progress * 100;
    this.setState({loadProgress});
    if (loadProgress === 100) {
      this.props.navigation.replace('signInWithCat');
    }
  }
  render() {
    let source =
      Platform.OS === 'ios'
        ? {uri: 'https://login.cat.com/CwsLogin/cws/logout.htm'}
        : {
            html: `<html><head><script>window.location.href='https://login.cat.com/CwsLogin/cws/logout.htm'</script></head></html>`,
          };
    return (
      <View style={{flex: 1}}>
        <WebViewLoadBar progress={this.state.loadProgress} />
        <IWebView
          onLoadProgress={this.onLoadProgress.bind(this)}
          startInLoadingState={true}
          source={source}
        />
      </View>
    );
  }
}

export default Signout;
