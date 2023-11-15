import {
  ActivityIndicator,
  StyleSheet,
  View,
  Text,
  TouchableHighlight,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {
  StackNavigationProp,
  StackNavigationOptions,
} from '@react-navigation/stack';
import React, {Component} from 'react';
import {inject, observer} from 'mobx-react';
import IWebView from '../components/IWebView';
import {WebViewProgressEvent} from 'react-native-webview/lib/WebViewTypes';
import {theme} from '../../theme';
import WebViewLoadBar from '../components/WebViewLoadBar';
import WebView, {
  WebViewMessageEvent,
  WebViewNavigation,
} from 'react-native-webview';
import {bridgeStore} from '../stores';
import {bridgeScript} from '../utils/bridge';
// 如果进行传递参数就得写这个interface
interface Props {
  navigation: StackNavigationProp<any>;
  route: any;
}
@inject('app')
@observer
class BrowserInner extends Component<Props> {
  navState: WebViewNavigation | null = null;
  webView: WebView | null = null;
  hasInjectedJavaScript: boolean = false;
  hasInjectedBridge: boolean = false;
  lastUrl: string = '';
  state = {
    appUrl: '',
    showChart: false,
    isShowWebView: true,
    loadProgress: 0,
  };
  componentDidMount() {
    this.setState({loadProgress: 0});
    this.setState({isShowWebView: true});
    this.setHeaderOptions('');
  }

  onNavigationStateChange(event: WebViewNavigation) {
    this.navState = event;
    this.setHeaderOptions(event.title);
  }
  closescaner() {
    // flag
    this.props.navigation.push('home');
  }
  openmore() {}
  // 设置header
  setHeaderOptions(title: string) {
    const headerOptions: StackNavigationOptions = {
      title: title || '',
      headerShown: true,
      headerTitleContainerStyle: {
        overflow: 'hidden',
        display: 'flex',
        width: '70%',
        alignItems: 'center',
      },
      headerLeft: () => {
        let menuComponent = (
          <TouchableHighlight
            underlayColor={theme.brandPrimary}
            onPress={this.closescaner.bind(this)}
            style={styles.menuButton}>
            <Ionicons allowFontScaling name="ios-close" size={26} />
          </TouchableHighlight>
        );
        return menuComponent;
      },
      headerRight: () => {
        let menuComponent = (
          <TouchableHighlight
            underlayColor={theme.brandPrimary}
            onPress={this.openmore.bind(this)}
            style={styles.menuButton}>
            <Ionicons allowFontScaling name="ios-ellipsis-vertical" size={26} />
          </TouchableHighlight>
        );
        return menuComponent;
      },
    };
    this.props.navigation.setOptions(headerOptions);
  }

  // 进度条
  onLoadProgress({nativeEvent}: WebViewProgressEvent) {
    let {progress} = nativeEvent;
    if (progress) this.setState({loadProgress: progress * 100});
  }

  _setWebView(wv: IWebView | null) {
    if (wv && wv.webview) {
      this.webView = wv.webview;
      bridgeStore.setWebView(this.webView);
    }
  }

  onWebViewLoad(event: any) {
    this.setHeaderOptions(event.nativeEvent.title);
    // if (!this.isGoBack || !this.hasInjectedJavaScript) {
    //   this.hasInjectedJavaScript = true;
    this.webView && this.webView.injectJavaScript(injectedJavaScript);
    // }
  }

  onWebViewLoadEnd(e: any) {
    if (this.webView) {
      !this.hasInjectedBridge && this.webView.injectJavaScript(`${bridgeScript}`);
    }
  }

  // 传递数据
  onMessage(event: WebViewMessageEvent) {
    let {data = ''} = event.nativeEvent;
    this.setState({loadProgress: 0});
    if (data === 'navigationStateChange') {
      let {title, url, canGoBack, canGoForward, loading, lockIdentifier} =
        event.nativeEvent;
      this.lastUrl = url;
      let navigationEvent: WebViewNavigation = {
        title,
        url,
        canGoBack,
        canGoForward,
        loading,
        navigationType: 'other',
        lockIdentifier,
      };
      this.navState = navigationEvent;
      this.setHeaderOptions(title);
      // this.checkIfLogout();
      // this.checkIfSignOut();
    } else {
      let decodeData = JSON.parse(data);
      let {
        name = '',
        type = '',
        options = {},
        successCallback = '',
        failCallback = '',
        hasInjectedBridge,
        hasInjectedJavaScript,
      } = decodeData;
      if (type) {
        // 打开扫码器
        bridgeStore.dispatchAction(
          type,
          options,
          successCallback,
          failCallback,
        );
      } else if (name === 'injectEnv') {
        this.hasInjectedBridge = hasInjectedBridge;
        this.hasInjectedJavaScript = hasInjectedJavaScript;
      }
    }
  }

  render() {
    let {appUrl} = this.props.route.params;
    console.log(typeof appUrl, appUrl);
    let {isShowWebView, loadProgress} = this.state;
    return (
      <View style={styles.container}>
        {/* <Text>{appUrl}</Text>  */}
        <WebViewLoadBar progress={loadProgress} />
        {isShowWebView ? (
          <IWebView
            ref={wv => this._setWebView(wv)}
            style={styles.webview}
            source={{uri: appUrl}}
            onLoadProgress={this.onLoadProgress.bind(this)}
            onLoad={this.onWebViewLoad.bind(this)}
            onLoadEnd={this.onWebViewLoadEnd.bind(this)}
            onMessage={this.onMessage.bind(this)}
          />
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              style={{flex: 2}}
              color={theme.brandPrimary}
              size="large"
            />
          </View>
        )}
      </View>
    );
  }
}

export default BrowserInner;

const styles = StyleSheet.create({
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  menuButton: {
    flex: 1,
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const injectedJavaScript = `
	(function() {
    if(window.hasInjectedJavaScript) return;
    window.hasInjectedJavaScript = true;
    function popHandler() {
      const injectEnv ={ name: 'injectEnv', hasInjectedBridge: window.qfCustomJsApi || window.ReactNativeJsApi, hasInjectedJavaScript: window.hasInjectedJavaScript};
      window.ReactNativeWebView.postMessage('navigationStateChange');
      window.ReactNativeWebView.postMessage(JSON.stringify(injectEnv));
		}
		function wrap(fn) {
			return function wrapper() {
				let res = fn.apply(this, arguments);
				setTimeout(popHandler, 10);
			}
		}

		history.pushState = wrap(history.pushState);
		history.replaceState = wrap(history.replaceState);
    window.addEventListener('popstate', popHandler);
	})();
	true;
`;
