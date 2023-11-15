import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {HOME_URL, LOGIN_URL} from '../constants';
import React, {Component} from 'react';
import {
  WebViewErrorEvent,
  WebViewHttpErrorEvent,
} from 'react-native-webview/lib/WebViewTypes';
import {
  buildAuthRequestConfig,
  buildDiscovery,
  cacheAuthAsync,
  checkIfTokenExpired,
  getAuthCacheAsync,
  refreshAuthAsync,
} from '../utils/oauth';
import {inject, observer} from 'mobx-react';

import AuthWebView from '../components/AuthWebview';
import IWebView from '../components/IWebView';
import JPush from 'jpush-react-native';
import {appStore} from '../stores';
import {authConfig} from '../utils/oauthConfig';
import {clearJPushRegisterId, setJPushRegisterId} from '../utils';
import i18n from '../utils/i18n';
import {locale} from 'expo-localization';
import {theme} from '../../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Props {
  navigation: StackNavigationProp<any>;
}
@inject('app')
@observer
class SignInWithCat extends Component<Props> {
  state = {
    accessToken: '',
    showLoading: false,
    showButton: true,
    error: '',
    openAuthWebView: false,
    openAuthWebViewKey: 0,
    registerID: '',
  };
  // dom加载完毕后执行
  async componentDidMount() {
    AsyncStorage.setItem('hasLogined', 'false');
    clearJPushRegisterId();
    this.props.navigation.setOptions({headerShown: false});
    if (appStore.autoLogin) {
      //自动登录
      // await this.startAuth();
    } else {
      this.setState({showButton: true});
      appStore.setIsLogined(false);
    }
  }
  // 从缓存中获取token
  async getTokenFromCache() {
    let res = await getAuthCacheAsync();
    if (res && res.accessToken) {
      this.setState({accessToken: res.accessToken});
    }
  }
  async startAuth() {
    this.setState({showLoading: true, showButton: false, error: ''});
    let isExpired = await checkIfTokenExpired();
    if (!isExpired) {
      await this.getTokenFromCache();
      // 在这里进行打印token相关信息
      return;
    }
    let res = await getAuthCacheAsync();
    if (res && res!.refreshToken) {
      let result = await refreshAuthAsync();
      if (result && result.accessToken) {
        this.setState({accessToken: result.accessToken});
        appStore.setAuthState(result);
        return;
      }
    }
    this.setState({openAuthWebView: true, openAuthWebViewKey: Date.now()});
  }
  onStepToGoHome(event: {[key: string]: any}) {
    let {url} = event;
    console.log('准备跳转');
    console.log(url);
    if (!!url && url.match(RegExp(HOME_URL))) {
      console.log('fff')
      appStore.setIsLogined(true);
      appStore.setAutoLogin(true);
      AsyncStorage.setItem('hasLogined', 'true');
      //* 必须要销毁webview后才能跳转？？ 否则闪退
      this.setState(
        {
          accessToken: '',
        },
        () => {
          this.props.navigation.replace('home');
        },
      );
    }
  }
  onWebViewError(event: WebViewErrorEvent) {
    this.setState({
      showButton: true,
      showLoading: false,
      accessToken: '',
      error: `${i18n.t('authorizationError')}: ${
        event.nativeEvent.description
      }`,
    });
  }
  onWebViewHttpError(event: WebViewHttpErrorEvent) {
    this.setState({
      showButton: true,
      showLoading: false,
      accessToken: '',
      error: `${i18n.t('httpError')}:${event.nativeEvent.statusCode}`,
    });
  }
  async getRegistrationID(): Promise<string> {
    return await new Promise((resolve, reject) => {
      try {
        JPush.getRegistrationID(async res => {
          let {registerID = ''} = res || {};
          // window.alert(registerID);
          // await setJPushRegisterId(registerID);
          resolve(registerID);
        });
      } catch (error) {
        console.warn('error :>> ', error);
        this.setState({showButton: true, showLoading: false});
        reject('error');
      }
    });
  }
  async onAuthWebViewClose(e: any) {
    console.log('2.获取token成功');
    this.setState({openAuthWebView: false});
    if (e.type === 'success') {
      let {params} = e;
      let registerID = await this.getRegistrationID();
      console.log('3.获取极光RegistrationID成功',registerID);
      this.setState({accessToken: params.accessToken, registerID});
      appStore.setAuthState(params);
      await cacheAuthAsync(params);
    } else {
      this.setState({showButton: true, showLoading: false});
    }
  }
  render() {
    let {
      accessToken,
      showLoading,
      showButton,
      error,
      openAuthWebView,
      openAuthWebViewKey,
      registerID,
    } = this.state;
    // token标识
    let hasToken = accessToken.length > 10;
    return (
      <View style={styles.container}>
        {/*
         *--apriltest--  没有拿到registerID【warning】
         */}
        {/* <TextInput
          style={styles.input}
          value={`${LOGIN_URL}${accessToken}&registrationID=${registerID}&platform=${Platform.OS}&locale=${locale}`}
        /> */}
        {showLoading == true && (
          <View style={styles.loadingContainer}>
            {hasToken == true && (
              <Text style={styles.loadingText}>{i18n.t('loading')}</Text>
            )}
            <ActivityIndicator
              style={{flex: 2}}
              color={theme.brandPrimary}
              size="large"
            />
          </View>
        )}
        {/* 是否获取token？拼接地址跳转 */}
        {hasToken == true ? (
          <>
            <IWebView
              source={{
                uri: `${LOGIN_URL}${accessToken}&registrationID=${registerID}&platform=${Platform.OS}&locale=${locale}`,
              }}
              // 这个是所有用户都可以登录没有做accessToken认证
              // source={{uri:`${LOGIN_URL}`}}
              style={{display: 'none'}}
              onError={this.onWebViewError.bind(this)}
              onHttpError={this.onWebViewHttpError.bind(this)}
              onLoad={this.onStepToGoHome.bind(this)}
              onNavigationStateChange={this.onStepToGoHome.bind(this)}
            />
          </>
        ) : (
          showButton == true && (
            <View>
              {error.length > 0 && (
                <Text style={styles.errorText}>{error}</Text>
              )}
              <TouchableOpacity
                style={styles.authButton}
                onPress={() => this.startAuth()}>
                <Image
                  style={styles.authButtonIcon}
                  source={require('../../assets/icon.png')}
                />
                <Text style={styles.authButtonText}>
                  {i18n.t('signInWithCWSID')}
                </Text>
              </TouchableOpacity>
            </View>
          )
        )}
        <AuthWebView
          // 记录当前时间
          key={openAuthWebViewKey}
          onClose={this.onAuthWebViewClose.bind(this)}
          authRequestConfig={buildAuthRequestConfig()}
          title={i18n.t('signIn')}
          visible={openAuthWebView}
          discovery={buildDiscovery()}
          redirectUri={authConfig.redirectUrl}
        />
      </View>
    );
  }
}

export default SignInWithCat;

const styles = StyleSheet.create({
  input: {
    padding: 50,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#999',
    textAlign: 'center',
    marginBottom: 15,
    marginTop: 30,
  },
  errorText: {
    marginBottom: 15,
    color: '#999',
  },
  authButton: {
    backgroundColor: theme.brandPrimary,
    paddingHorizontal: 30,
    paddingVertical: 5,
    borderRadius: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authButtonText: {
    textAlign: 'center',
    fontSize: 16,
    color: theme.brandPrimaryTextColor,
  },
  authButtonIcon: {
    width: 48,
    height: 48,
    marginRight: 10,
    borderRadius: 24,
  },
});
