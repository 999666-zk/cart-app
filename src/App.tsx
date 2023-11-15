import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import React, { Component } from "react";
import {
  StackNavigationOptions,
  createStackNavigator,
} from "@react-navigation/stack";

import BarCodeScan from "./pages/BarCodeScan";
import Home from "./pages/Home";
import JPush from "jpush-react-native";
import { Provider } from "mobx-react";
import SignInWithCat from "./pages/SignInWithCat";
import Signout from "./pages/Singnout";
import Unlock from "./pages/Unlock";
import UnsupportedFile from "./pages/UnsupportedFile";
import Seting from "./pages/Seting";
import stores from "./stores";
import { theme } from "../theme";
import { isProd, jpushAppkey, jpushChannel } from "./constants";
import MenuQR from "./pages/MenuQR";
import BrowserInner from "./pages/BrowserInner";
import NativeCamera from "./pages/NativeCamera";
import PrivacyPage from "./pages/PrivacyPage";
import AsyncStorage from "@react-native-async-storage/async-storage";
const Stack = createStackNavigator();
const defaultHeaderOptions: StackNavigationOptions = {
  headerStyle: { backgroundColor: theme.brandPrimary, shadowOpacity: 0.01 },
  cardShadowEnabled: false,
  headerTitleStyle: { color: "#222" },
  title: "",
  headerTitleAlign: "center",
};
class App extends Component {
  async componentDidMount() {
    // 根据用户协议来判断是否要进行极光初始化
    let timers = setInterval(async () => {
      await AsyncStorage.getItem("isAgreed");
      if ((await AsyncStorage.getItem("isAgreed")) === "true") {
        clearInterval(timers);
        console.log("同意了");
        this.initJPush();
        await AsyncStorage.setItem("isAgreed", "true");
      } else {
        console.log("没有同意");
      }
    }, 3000);
  }

  /**
   * 极光初始化
   */
  async initJPush() {
    console.log("初始化极光");
    
    JPush.setLoggerEnable(true);
    // JPUSHService setDebugMode
    JPush.init({
      appKey: jpushAppkey,
      channel: jpushChannel,
      production: isProd,
    });

    //连接状态
    JPush.addConnectEventListener((result) => {
      console.log("connectListener:" + JSON.stringify(result));
    });
    //通知回调
    JPush.addNotificationListener((result) => {
      JPush.setBadge({ badge: 0, appBadge: 0 });
    });
    //本地通知回调
    JPush.addLocalNotificationListener((result) => {
      JPush.setBadge({ badge: 0, appBadge: 0 });
    });
    //自定义消息回调
    JPush.addCustomMessageListener((result) => {
      JPush.setBadge({ badge: 0, appBadge: 0 });
    });
    //tag alias事件回调
    JPush.addTagAliasListener((result) => {
      JPush.setBadge({ badge: 0, appBadge: 0 });
    });
    //手机号码事件回调
    JPush.addMobileNumberListener((result) => {
      JPush.setBadge({ badge: 0, appBadge: 0 });
    });
    //打开应用时清除角标
    setTimeout(() => {
      //清除角标
      JPush.setBadge({ badge: 0, appBadge: 0 });
      //清除说有本地通知
      JPush.clearLocalNotifications();
    }, 2 * 1000);
  }

  /**
   * 渲染组件
   */
  render() {
    return (
      <Provider {...stores}>
        <NavigationContainer
          theme={{
            ...DefaultTheme,
            colors: {
              ...DefaultTheme.colors,
              primary: theme.brandPrimary,
              background: "#fff",
            },
          }}
        >
          <Stack.Navigator
            screenOptions={{
              ...defaultHeaderOptions,
            }}
          >
            {/* 生物识别 */}
            <Stack.Screen name="unlockApp" component={Unlock} />
            {/* 隐私条款声明 */}
            <Stack.Screen name="privacy" component={PrivacyPage} />
            {/* 主页 */}
            <Stack.Screen name="home" component={Home} />
            {/* 登录页 */}
            <Stack.Screen name="signInWithCat" component={SignInWithCat} />
            {/* 退出登录 */}
            <Stack.Screen name="signout" component={Signout} />
            <Stack.Screen name="scanner" component={NativeCamera} />
            {/* 扫码 */}
            {/* <Stack.Screen name="scanner" component={BarCodeScan} /> */}
            <Stack.Screen
              options={{ title: "扫一扫" }}
              name="scannertest"
              component={MenuQR}
            />
            {/* <Stack.Screen options={{ title: '结果' }} name="qrdata" component={QRdata} /> */}

            <Stack.Screen name="browser" component={BrowserInner} />
            {/* 文件预览 */}
            <Stack.Screen name="unsupportedfile" component={UnsupportedFile} />
            <Stack.Screen name="seting" component={Seting} />
          </Stack.Navigator>
        </NavigationContainer>
      </Provider>
    );
  }
}

export default App;
