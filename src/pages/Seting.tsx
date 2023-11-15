import * as WebBrowser from 'expo-web-browser';
import React, {Component} from 'react';
import {Alert, Platform, Text, TouchableOpacity, View} from 'react-native';
import {AntDesign} from '@expo/vector-icons';
import {StackNavigationProp} from '@react-navigation/stack';
import {locale} from 'expo-localization';
import {HeaderBackButton} from '@react-navigation/elements';
import Toast from 'react-native-easy-toast';
import {
  applicationBuildVersion,
  applicationVersion,
  clearCookies,
} from '../constants';
import i18n from '../utils/i18n';
import {theme} from '../../theme';
import {androidVersion} from '../utils';
import {bridgeStore} from '../stores';
import {clearAuthCache, signOutAsync} from '../utils/oauth';
interface Props {
  navigation: StackNavigationProp<any>;
}
class Seting extends Component<Props> {
  //   constructor(props:any) {
  //     super(props)
  //     this.state = {
  //       NewVerson:'',
  //     };
  // }

  toast: Toast | null = null;

  checkVersion() {
    //https://qinglfow-1d8820-1256107176.tcloudbaseapp.com/app-download/versions/android-last-version.json
    fetch(
      `https://leanflow.qingflow.com/versions/${Platform.OS}-last-version.json`,
    )
      .then(res => res.json())
      .then(res => {
        console.log('res', res.version);
        if (
          !applicationBuildVersion ||
          res.buildVersion > applicationBuildVersion
        ) {
          // this.setState({NewVerson:res.version})
          this.viewVersion(res.version);
        } else {
          this.toast?.show(i18n.t('isLatestVer'), 1500);
        }
      })
      .catch(e => {
        console.log(e);
      });
  }

  viewVersion(newVersion: string) {
    Alert.alert(
      i18n.t('version'),
      `${i18n.t('newVersion')}：${newVersion}\n${i18n.t(
        'currentVersion',
      )}：${applicationVersion}\n${
        Platform.OS === 'android'
          ? Platform.OS.replace(Platform.OS[0], Platform.OS[0].toUpperCase())
          : Platform.OS.toLocaleUpperCase().replace(
              Platform.OS.toLocaleUpperCase()[0],
              Platform.OS.toLocaleUpperCase()[0].toLowerCase(),
            )
      }：${
        Platform.OS == 'android'
          ? androidVersion['v' + Platform.Version] ?? '13.0+'
          : Platform.Version
      } `,
      [
        {text: i18n.t('close')},
        {
          text: `${i18n.t('download')} APP`,
          onPress: () => {
            let url = `https://leanflow.qingflow.com/app-download/?platform=${Platform.OS}&buildVersion=${applicationBuildVersion}&version=${applicationVersion}&locale=${locale}`;
            // let url = `http://192.168.21.78:8080/app-download/?platform=android&buildVersion=100&version=1.0.0&locale=cn`;
            WebBrowser.openBrowserAsync(url, {
              toolbarColor: theme.brandPrimary,
              showInRecents: true,
            });
          },
        },
      ],
    );
  }
  // 清除 app 缓存
  clearMessage() {
    Alert.alert(i18n.t('alert'), i18n.t('DeleteMsg'), [
      {text: i18n.t('cancel')},
      {
        text: `${i18n.t('ok')}`,
        onPress: async () => {
          this.toast?.show(i18n.t('cleanMsg'), 1200);
          // 清除cookie
          signOutAsync();
          bridgeStore.webView?.injectJavaScript(clearCookies);
          // console.log('清除 author 信息成功！');
          // setTimeout(() => {
          //   this.props.navigation.reset({
          //     routes: [{name: 'signout'}],
          //   });
          // }, 1500);
        },
      },
    ]);
  }
  logout() {
    Alert.alert(i18n.t('alert'), i18n.t('logoutAndDeleteMsg'), [
      {text: i18n.t('cancel')},
      {
        text: `${i18n.t('ok')}`,
        onPress: async () => {
          this.toast?.show(i18n.t('thxUsing'), 1200);
          // 清除cookie
          bridgeStore.webView?.injectJavaScript(clearCookies);
          // console.log('清除 author 信息成功！');
          setTimeout(() => {
            this.props.navigation.reset({
              routes: [{name: 'signout'}],
            });
          }, 1500);
        },
      },
    ]);
  }
  setToast(ref: Toast | null) {
    if (ref) {
      this.toast = ref;
    }
  }
  componentDidMount() {
    this.props.navigation.setOptions({
      title: i18n.t('seting'),
      headerLeft: () => (
        <HeaderBackButton
          tintColor={theme.brandPrimaryTextColor}
          label={i18n.t('back')}
          onPress={() => this.props.navigation.goBack()}
        />
      ),
    });
  }
  render() {
    return (
      <View style={{flex: 1, flexDirection: 'column'}}>
        {/* 版本信息 */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={this.checkVersion.bind(this)}
          style={{
            height: 52,
            paddingHorizontal: 14,
            flexDirection: 'row',
            justifyContent: 'space-between',
            borderBottomWidth: 1,
            borderBottomColor: '#ccc',
          }}>
          <View
            style={{
              flexDirection: 'column',
              justifyContent: 'space-between',
              paddingVertical: 8,
            }}>
            <Text>
              {i18n.t('currentVersion')}: V{applicationVersion}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: '#adadad',
              }}>
              {Platform.OS.toUpperCase()}{' '}
              {Platform.OS == 'android'
                ? androidVersion[Platform.Version] ?? '13.0+'
                : Platform.Version}
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              alignItems: 'center',
            }}>
            <Text
              style={{
                color: '#d6d6d6',
              }}>
              {i18n.t('checkVer')}
            </Text>
            <AntDesign
              allowFontScaling
              name="right"
              size={20}
              color="#b9b9b9"
            />
          </View>
        </TouchableOpacity>
        {/* 退出登录 */}
        {/* <TouchableOpacity
          activeOpacity={1}
          onPress={this.logout.bind(this)}
          style={{
            height: 52,
            paddingHorizontal: 14,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottomWidth: 1,
            borderBottomColor: '#ccc',
          }}>
          <Text>{i18n.t('logoutAndDeleteBtn')}</Text>
          <AntDesign allowFontScaling name="right" size={20} color="#b9b9b9" />
        </TouchableOpacity> */}
        {/* 清除缓存 */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={this.clearMessage.bind(this)}
          style={{
            height: 52,
            paddingHorizontal: 14,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottomWidth: 1,
            borderBottomColor: '#ccc',
          }}>
          <Text>{i18n.t('clearMessage')}</Text>
          <AntDesign allowFontScaling name="right" size={20} color="#b9b9b9" />
        </TouchableOpacity>
        <Toast position="center" ref={toast => this.setToast(toast)} />
      </View>
    );
  }
}

export default Seting;
