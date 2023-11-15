import React, {Component} from 'react';
// import {View, Text, TextInput} from 'react-native';
import WebView, {
  //   WebViewMessageEvent,
  //   WebViewNavigation,
  WebViewProps,
} from 'react-native-webview';

// import {applicationNameForUserAgent} from '../constants';

interface Props extends WebViewProps {}

class IWebView extends Component<Props> {
  webview: WebView | null = null;
  componentDidMount() {
    // console.warn('apirl', this.props);
  }

  render() {
    return (
      <WebView
        ref={wv => {
          this.webview = wv;
        }}
        {...this.props}
        // applicationNameForUserAgent={applicationNameForUserAgent}
        // 绕过权限认证
        // source={{
        // 	uri: "https://cat.qingflow.com",
        // }}
      />

      // <TextInput
      // 	value={`${this.props.source}`}
      //  />
    );
  }
}

export default IWebView;
