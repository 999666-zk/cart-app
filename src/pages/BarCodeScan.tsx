import {
  Alert,
  BackHandler,
  Platform,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {BarCodeEvent, BarCodeScanner} from 'expo-barcode-scanner';
import React, {Component} from 'react';
import {inject, observer} from 'mobx-react';

import {StackNavigationProp} from '@react-navigation/stack';
import {bridgeStore} from '../stores';
import i18n from '../utils/i18n';

interface Props {
  navigation: StackNavigationProp<any>;
  route: any;
}

const CodeTypes = Object.keys(BarCodeScanner.Constants.BarCodeType);
@inject('bridge')
@observer
class BarCodeScan extends Component<Props> {
  barCodeTypes: string[] = [BarCodeScanner.Constants.BarCodeType.qr];
  scanner: BarCodeScanner | null = null;
  state = {
    isScaned: false,
    result: null,
    hasPermission: false,
    screenFocus: false,
  };
  backhandler: any = null;
  unsubscribeFocus: (() => void) | undefined;
  unsubscribeBlur: (() => void) | undefined;
  async componentDidMount() {
    this.unsubscribeFocus = this.props.navigation.addListener('focus', () => {
      this.setState({screenFocus: true});
    });
    this.unsubscribeBlur = this.props.navigation.addListener('blur', () => {
      this.setState({screenFocus: false});
    });
    if (Platform.OS === 'android') {
      // android only
      this.backhandler = () => {
        if (this.props.route.name === 'scanner') {
          this.props.navigation.goBack();
          return true;
        }
        return false;
      };
      BackHandler.addEventListener('hardwareBackPress', this.backhandler);
    }
    let {barCodeTypes = []} = this.props.route.params;
    // 扫码类型判断
    if (barCodeTypes instanceof Array && barCodeTypes.length) {
      this.barCodeTypes = [];
      barCodeTypes.forEach(item => {
        if (CodeTypes.includes(item)) {
          this.barCodeTypes.push(BarCodeScanner.Constants.BarCodeType[item]);
        }
      });
    }
    // 参数配置
    this.props.navigation.setOptions({
      title: '扫码',
      headerTitleStyle: {
        backgroundColor: '#000',
        color: '#fff',
      },
      headerTransparent: true,
      headerTintColor: '#fff',
    });
    this.getPermissions();
  }
  // 获取权限
  async getPermissions() {
    const {status} = await BarCodeScanner.requestPermissionsAsync();
    let {failCallback} = this.props.route.params;
    if (status !== 'granted') {
      Alert.alert(i18n.t('alert'), 'cameraPermission');
      failCallback &&
        bridgeStore.dispatchFailCallback(failCallback, {
          error: 'no-permission',
        });
      this.props.navigation.goBack();
      return;
    }
    this.setState({hasPermission: true});
  }
  onBarCodeScanned(event: BarCodeEvent) {
    let {isScaned} = this.state;
    let {type, data} = event;
    data = data.replace(/\n*/g, '');
    let {successCallback} = this.props.route.params;
    console.log('fff', successCallback);

    if (this.barCodeTypes.includes(type) && !isScaned) {
      console.log('ff', this.barCodeTypes);

      this.setState({isScaned: !0, result: event});
      let typeIndex = Object.values(
        BarCodeScanner.Constants.BarCodeType,
      ).findIndex(item => item === type);
      let typeKey = Object.keys(BarCodeScanner.Constants.BarCodeType)[
        typeIndex
      ];
      successCallback &&
        bridgeStore.dispatchSuccessCallback(successCallback, {
          type: typeKey,
          text: data,
          data,
        });
      this.props.navigation.goBack();
    }
  }
  componentWillUnmount() {
    let {result, hasPermission} = this.state;
    BackHandler.removeEventListener('hardwareBackPress', this.backhandler);
    if (result === null && hasPermission) {
      let {failCallback} = this.props.route.params;
      failCallback &&
        bridgeStore.dispatchFailCallback(failCallback, {error: 'cancel'});
    }
    if (this.unsubscribeBlur) {
      this.unsubscribeBlur();
    }
    if (this.unsubscribeFocus) {
      this.unsubscribeFocus();
    }
  }
  render() {
    const {hasPermission, screenFocus} = this.state;
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        {hasPermission === true && screenFocus === true && (
          <BarCodeScanner
            style={styles.scanner}
            ref={s => (this.scanner = s)}
            onBarCodeScanned={this.onBarCodeScanned.bind(this)}
            barCodeTypes={this.barCodeTypes}
            type={BarCodeScanner.Constants.Type.back}>
            <View style={styles.scannerBorder}></View>
          </BarCodeScanner>
        )}
      </View>
    );
  }
}

export default BarCodeScan;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scanner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  scannerBorder: {
    position: 'absolute',
    zIndex: 10,
    width: 300,
    height: 300,
    top: '50%',
    left: '50%',
    marginTop: -150,
    marginLeft: -150,
    borderColor: '#fec800',
    borderWidth: 2,
    borderStyle: 'solid',
  },
});
