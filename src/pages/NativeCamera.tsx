import {
  Alert,
  BackHandler,
  Dimensions,
  Platform,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import {
  BarCodeScanningResult,
  Camera as ExpoCamera,
  CameraType,
} from "expo-camera";
import React, { Component } from "react";
import { inject, observer } from "mobx-react";
import stores, { bridgeStore } from "../stores";

import { BarCodeScanner } from "expo-barcode-scanner";
import { StackNavigationProp } from "@react-navigation/stack";
import i18n from "../utils/i18n";

interface Props {
  navigation: StackNavigationProp<any>;
  route: any;
}
const CodeTypes = Object.keys(BarCodeScanner.Constants.BarCodeType);
@inject("bridge")
@observer
class NativeCamera extends Component<Props> {
  barCodeTypes: string[] = [BarCodeScanner.Constants.BarCodeType.qr];
  camera: ExpoCamera | null = null;
  state = {
    isScaned: false,
    result: null,
    hasPermission: false,
    ratio: "16:9",
    screenFocus: false,
  };
  backhandler: any = null;
  unsubscribeFocus: (() => void) | undefined;
  unsubscribeBlur: (() => void) | undefined;
  async componentDidMount() {
    console.log("start");
    console.log(Platform.Version, typeof Platform.Version, "版本");
    this.unsubscribeFocus = this.props.navigation.addListener("focus", () => {
      this.setState({ screenFocus: true });
    });
    this.unsubscribeBlur = this.props.navigation.addListener("blur", () => {
      this.setState({ screenFocus: false });
    });
    if (Platform.OS === "android") {
      // android only
      this.backhandler = () => {
        if (this.props.route.name === "camera") {
          this.props.navigation.goBack();
          return true;
        }
        return false;
      };
      BackHandler.addEventListener("hardwareBackPress", this.backhandler);
    }
    let { barCodeTypes = [] } = this.props.route.params;
    if (barCodeTypes instanceof Array && barCodeTypes.length) {
      this.barCodeTypes = [];
      barCodeTypes.forEach((item) => {
        if (CodeTypes.includes(item)) {
          this.barCodeTypes.push(BarCodeScanner.Constants.BarCodeType[item]);
        }
      });
    }
    this.props.navigation.setOptions({
      title: "扫码",
      headerTitleStyle: {
        color: "#fff",
      },
      headerTransparent: true,
      headerTintColor: "#fff",
    });
    this.getPermissions();
  }
  async getPermissions() {
    const { status } = await ExpoCamera.requestCameraPermissionsAsync();
    let { failCallback } = this.props.route.params;
    console.log("fff", this.props.route);
    if (status !== "granted") {
      Alert.alert(i18n.t("alert"), "cameraPermission");
      failCallback &&
        bridgeStore.dispatchFailCallback(failCallback, {
          error: "no-permission",
        });
      this.props.navigation.goBack();
      return;
    }
    this.setState({ hasPermission: true });
  }
  onBarCodeScanned(event: BarCodeScanningResult) {
    console.log("success", this.camera);
    console.log(this.camera, "ffff");
    let { isScaned } = this.state;
    let { type, data } = event;
    data = data.replace(/\n*/g, "");
    let { successCallback } = this.props.route.params;
    if (this.barCodeTypes.includes(type) && !isScaned) {
      this.setState({ isScaned: !0, result: event });
      let typeIndex = Object.values(
        BarCodeScanner.Constants.BarCodeType
      ).findIndex((item) => item === type);
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
    let { result, hasPermission } = this.state;
    BackHandler.removeEventListener("hardwareBackPress", this.backhandler);
    if (result === null && hasPermission) {
      let { failCallback } = this.props.route.params;
      failCallback &&
        bridgeStore.dispatchFailCallback(failCallback, { error: "cancel" });
    }
    if (this.unsubscribeBlur) {
      this.unsubscribeBlur();
    }
    if (this.unsubscribeFocus) {
      this.unsubscribeFocus();
    }
  }

  // 这里出现了问题！！！
  onCameraMountError({ message = "" }) {
    // console.log(message);
    Alert.alert(i18n.t("alert"), message);
  }

  getRatio() {
    //计算屏幕比例
    if (Platform.OS === "android") {
      let { width, height } = Dimensions.get("window");
      let ratioValue = parseFloat((height / width).toFixed(1));
      let ratio = "16:9";

      if (ratioValue >= 2.2) {
        ratio = "20:9";
      } else if (ratioValue >= 2.1) {
        ratio = "13:6";
      } else if (ratioValue >= 1.9) {
        ratio = "2:1";
      } else if (ratioValue >= 1.76) {
        ratio = "16:9";
      } else if (ratioValue >= 1.48) {
        ratio = "3:2";
      } else if (ratioValue >= 1.32) {
        ratio = "4:3";
      } else if (ratioValue >= 1.1) {
        ratio = "10:9";
      } else if (ratioValue == 1) {
        ratio = "1:1";
      }
      return ratio;
    }
  }
  // 是否要使用 useCamera2Api
  isOpenCamera2Api() {
    let version = Platform.Version;
    console.log("hrere", version);
    if (version >= 24) {
      // android 13  version: 33
      if (version >= 33) {
        return false;
      }
      return true;
    } else {
      return false;
    }
  }

  render() {
    const { hasPermission, screenFocus } = this.state;
    return (
      <View style={styles.container}>
        <StatusBar hidden />
        {hasPermission === true && (
          <View style={styles.container}>
            {screenFocus === true && (
              <ExpoCamera
                style={styles.camera}
                ref={(c) => (this.camera = c)}
                ratio={this.getRatio()}
                // 扫码重复渲染的问题
                useCamera2Api={this.isOpenCamera2Api()}
                // useCamera2Api={true}
                onMountError={this.onCameraMountError.bind(this)}
                onBarCodeScanned={this.onBarCodeScanned.bind(this)}
                barCodeScannerSettings={{
                  barCodeTypes: this.barCodeTypes,
                }}
                type={ExpoCamera.Constants.Type.back}
              >
                <View style={styles.cameraScanBorder}></View>
              </ExpoCamera>
            )}
          </View>
        )}
      </View>
    );
  }
}

export default NativeCamera;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraScanBorder: {
    position: "absolute",
    zIndex: 10,
    width: 300,
    height: 300,
    top: "50%",
    left: "50%",
    marginTop: -150,
    marginLeft: -150,
    borderColor: "#fec800",
    borderWidth: 2,
    borderStyle: "solid",
  },
});