import * as LocalAuthentication from "expo-local-authentication";

import {
  Alert,
  Image,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import React, { Component } from "react";

import { StackNavigationProp } from "@react-navigation/stack";
import i18n from "../utils/i18n";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Props {
  navigation: StackNavigationProp<any>;
}
class Unlock extends Component<Props> {
  state = {
    // 脸部识别
    showFacialRecognition: false,
    // 指纹识别
    showFingerPrint: false,
    // 虹膜
    showIris: false,
    // 已登陆
    hasLogined: false,
  };

  async componentDidMount() {
    this.props.navigation.setOptions({ headerShown: false });
    let hasLogined = JSON.parse(
      (await AsyncStorage.getItem("hasLogined")) ?? "false"
    );

    // 如果已经登录那就记录登录状态
    if (hasLogined) {
      this.setState({ hasLogined: hasLogined });
      // 选择登录
      this.checkSupport();
    } else {
      console.log(typeof (await AsyncStorage.getItem("isAgreed")), "rer");
      if (
        (await AsyncStorage.getItem("isAgreed")) === "false" ||
        (await AsyncStorage.getItem("isAgreed")) === null
      ) {
        this.props.navigation.replace("privacy");
      } else {
        this.props.navigation.replace("signInWithCat");
      }
    }
  }
  // 权限认证成功
  async authSuccess() {
    let { hasLogined } = this.state;
    if (hasLogined) {
      // 权限识别成功跳转到 home 主页
      this.props.navigation.replace("home");
      // 在这里进行账号的绑定并进行登录
      // ========================
      // 如果是第一次登录就展示登录框并进行登录
      // 如果不是第一次登录就根据指纹查询绑定的用户相关的信息进行直接登录
    } else {
      // 没有同意隐私条款的首先需要同意隐私条款
      if (
        (await AsyncStorage.getItem("isAgreed")) === "false" ||
        (await AsyncStorage.getItem("isAgreed")) === null
      ) {
        this.props.navigation.replace("privacy");
      } else {
        this.props.navigation.replace("signInWithCat");
      }
    }
  }
  async checkSupport() {
    let supported = await LocalAuthentication.hasHardwareAsync();
    if (!supported) this.authSuccess();
    let isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) this.authSuccess();
    let supportedType =
      await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (
      supportedType.includes(
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
      )
    ) {
      this.setState({ showFacialRecognition: true });
    } else if (
      supportedType.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
    ) {
      this.setState({ showFingerPrint: true });
    } else if (
      supportedType.includes(LocalAuthentication.AuthenticationType.IRIS)
    ) {
      this.setState({ showIris: true });
    }
    // 开始权限认证
    setTimeout(async () => this.startAuth(), 500);
  }
  async startAuth() {
    try {
      let results: LocalAuthentication.LocalAuthenticationResult =
        await LocalAuthentication.authenticateAsync({
          promptMessage: i18n.t("authenticate"),
          cancelLabel: i18n.t("cancel"),
          disableDeviceFallback: false,
        });
      if (results.success) {
        this.authSuccess();
      } else if (results.error === "app_cancel") {
        Alert.alert(i18n.t("alert"), "Authenticating");
      } else if (results.error === "not_enrolled") {
        Alert.alert(i18n.t("alert"), i18n.t("notEnrolled"));
      }
    } catch (error) {
      let err = JSON.stringify(error);
      if (/E_NOT_SUPPORTED/gim.test(err)) {
        Alert.alert(i18n.t("alert"), i18n.t("notSupportedBlow"));
      } else if (/E_NOT_FOREGROUND/gim.test(err)) {
        Alert.alert(i18n.t("alert"), i18n.t("notForeground"));
      } else {
        Alert.alert(i18n.t("alert"), i18n.t("notSupported"));
      }
    }
  }
  render() {
    let { showFacialRecognition, showFingerPrint, showIris } = this.state;
    return (
      <View style={styles.container}>
        {(showFingerPrint == true || showFacialRecognition == true) && (
          <View style={styles.content}>
            <Text style={styles.title}>{i18n.t("unlock")}</Text>
            <TouchableOpacity
              style={styles.touchBtn}
              onPress={this.startAuth.bind(this)}
            >
              {showFingerPrint == true && (
                <Image
                  style={styles.icon}
                  source={require("../../assets/fingerprint.png")}
                />
              )}
              {showFacialRecognition == true && (
                <Image
                  style={styles.icon}
                  source={require("../../assets/faceid.png")}
                />
              )}
              {showIris == true && (
                <Image
                  style={styles.icon}
                  source={require("../../assets/iris.png")}
                />
              )}
              <View style={styles.tipContainer}>
                <Text>{i18n.t("unlockTip")}</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }
}

export default Unlock;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginBottom: 25,
    fontSize: 18,
    color: "#111",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    width: "100%",
  },
  icon: {
    height: 64,
    width: 64,
  },
  tipContainer: {
    marginTop: 15,
  },
  touchBtn: {
    alignItems: "center",
    justifyContent: "center",
  },
});
