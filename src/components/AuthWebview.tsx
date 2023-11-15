import * as Crypto from 'expo-crypto';
import * as Random from 'expo-random';

import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import {
  AuthRequest,
  AuthRequestConfig,
  DiscoveryDocument,
} from 'expo-auth-session';
import React, {Component} from 'react';

import {Base64} from 'js-base64';
import Constants from 'expo-constants';
import IWebView from './IWebView';
import {Ionicons} from '@expo/vector-icons';
import WebViewLoadBar from './WebViewLoadBar';
import {WebViewProgressEvent} from 'react-native-webview/lib/WebViewTypes';
import i18n from '../utils/i18n';
import qs from 'qs';

interface Props {
  visible: boolean;
  authRequestConfig: AuthRequestConfig;
  discovery: DiscoveryDocument;
  redirectUri: string;
  title?: string;
  onClose?: Function;
}
function URLEncode(str: string) {
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function sha256(buffer: string) {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    buffer,
    {
      encoding: Crypto.CryptoEncoding.BASE64,
    },
  );
}
function buildAuthResult(result: {[key: string]: any}) {
  let {
    access_token = '',
    expires_in = 0,
    refresh_token = '',
    id_token = '',
  } = result;
  return {
    accessToken: access_token,
    accessTokenExpirationDate: expires_in,
    idToken: id_token,
    refreshToken: refresh_token,
  };
}
class AuthWebView extends Component<Props> {
  state = {
    authUrl: '',
    progress: 0,
    loadingToken: false,
  };
  verifier: string = '';
  async componentDidMount() {
    if (this.props.visible) {
      this.buildAuthUrl();
    }
  }
  async buildPKCEConfig() {
    let randomBytes = await Random.getRandomBytesAsync(24);
    let verifier = URLEncode(Base64.encode(randomBytes.toString()));
    let challenge = URLEncode(await sha256(verifier));
    this.verifier = verifier;
    return {
      verifier,
      challenge,
    };
  }
  async buildAuthUrl() {
    let {authRequestConfig} = this.props;
    if (
      authRequestConfig.usePKCE === true ||
      typeof authRequestConfig.usePKCE === 'undefined'
    ) {
      let pkceConfig = await this.buildPKCEConfig();
      authRequestConfig.extraParams = Object.assign(
        {...(authRequestConfig.extraParams || {})},
        {code_challenge: pkceConfig.challenge},
      );
    }
    let request = new AuthRequest(authRequestConfig);
    // 这个api获取授权url
    let authUrl = await request.makeAuthUrlAsync(this.props.discovery);
    this.setState({authUrl});
    console.log('1.授权登录成功');
  }
  async getAccessToken(code: string) {
    let {tokenEndpoint = ''} = this.props.discovery;
    let {clientId, clientSecret, redirectUri} = this.props.authRequestConfig;
    this.setState({loadingToken: true});
    let res = await fetch(tokenEndpoint, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: qs.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        code_verifier: this.verifier,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
      method: 'POST',
    })
      .then(res => res.json())
      .catch(err => {
        console.log('err', err);
      });
    if (res.access_token) {
      this.onDismiss({type: 'success', params: buildAuthResult(res)});
    } else if (res.error_description) {
      Alert.alert(i18n.t('alert'), i18n.t('getDataFail'), [
        {
          text: i18n.t('ok'),
          onPress: () => this.onDismiss({type: 'dismiss'}),
        },
      ]);
    } else {
      Alert.alert(i18n.t('alert'), i18n.t('networkError'), [
        {
          text: i18n.t('ok'),
          onPress: () => this.onDismiss({type: 'dismiss'}),
        },
      ]);
    }
  }
  onShouldStartLoadWithRequest(req: any) {
    let {url} = req;
    let {loadingToken} = this.state;
    if (/(exp|catapp):/.test(url)) {
      let searchString = url.substr(url.indexOf('?') + 1);
      if (searchString && !loadingToken) {
        let {code = ''} = qs.parse(searchString);
        if (typeof code === 'string') this.getAccessToken(code);
      }
      return false;
    }
    return true;
  }
  onDismiss(result: any) {
    if (typeof this.props.onClose === 'function') this.props.onClose(result);
    this.setState({loadingToken: false});
  }
  onCancel() {
    Alert.alert(i18n.t('alert'), i18n.t('leaveMessage'), [
      {text: i18n.t('cancel')},
      {text: i18n.t('ok'), onPress: () => this.onDismiss({type: 'dismiss'})},
    ]);
    this.setState({loadingToken: false});
  }
  onLoadProgress({nativeEvent}: WebViewProgressEvent) {
    let {progress} = nativeEvent;
    progress && this.setState({progress});
  }
  render() {
    let {title = ''} = this.props;
    let {authUrl, progress, loadingToken} = this.state;
    let loadProgress = Math.floor(progress * 100);
    let isAndroid = Platform.OS === 'android';
    return (
      <Modal
        onRequestClose={this.onCancel.bind(this)}
        visible={this.props.visible}
        transparent={true}>
        {!isAndroid && <View style={{height: Constants.statusBarHeight}} />}
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.leftContainer}>
              <TouchableHighlight
                underlayColor={isAndroid ? '#eee' : '#fff'}
                onPress={this.onCancel.bind(this)}
                style={styles.leftButton}>
                {isAndroid ? (
                  <Ionicons allowFontScaling name="ios-close" size={32} />
                ) : (
                  <Text style={{color: 'blue'}}>{i18n.t('done')}</Text>
                )}
              </TouchableHighlight>
            </View>
            <View style={styles.titleContainer}>
              {title !== '' && <Text>{title}</Text>}
            </View>
            <View style={styles.rightContainer} />
          </View>

          <View style={styles.webviewContainer}>
            {loadingToken === true ? (
              <ActivityIndicator style={{flex: 1}} />
            ) : (
              <React.Fragment>
                {loadProgress < 100 && (
                  <WebViewLoadBar progress={loadProgress} />
                )}
                {authUrl.length > 10 && (
                  <IWebView
                    style={{flex: 1}}
                    startInLoadingState={true}
                    originWhitelist={[
                      'https://*',
                      'http://*',
                      'exp://*',
                      'catapp://*',
                    ]}
                    onShouldStartLoadWithRequest={this.onShouldStartLoadWithRequest.bind(
                      this,
                    )}
                    source={{uri: authUrl}}
                    onLoadProgress={this.onLoadProgress.bind(this)}
                  />
                )}
              </React.Fragment>
            )}
          </View>
        </View>
      </Modal>
    );
  }
}

export default AuthWebView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  leftContainer: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftButton: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '70%',
    width: '70%',
    borderRadius: 50,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightContainer: {
    width: 60,
  },
  webviewContainer: {
    flex: 1,
  },
});
