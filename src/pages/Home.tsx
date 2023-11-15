import * as WebBrowser from "expo-web-browser";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  TouchableHighlight,
  View,
} from "react-native";
import {
  HOME_URL,
  applicationBuildVersion,
  applicationVersion,
  clearCookies,
  loginOutRedirectUrl,
} from "../constants";
import {
  StackNavigationOptions,
  StackNavigationProp,
} from "@react-navigation/stack";
import React, { Component } from "react";
import WebView, {
  WebViewMessageEvent,
  WebViewNavigation,
} from "react-native-webview";
import {
  androidVersion,
  getJPushRegisterId,
  setJPushRegisterId,
} from "../utils";
import { appStore, bridgeStore } from "../stores";
import { getAuthCacheAsync, refreshAuthAsync } from "../utils/oauth";
import { inject, observer } from "mobx-react";
import { DEVICE_URL } from "../constants";
import IWebView from "../components/IWebView";
import { Ionicons } from "@expo/vector-icons";
import JPush from "jpush-react-native";
import WebViewLoadBar from "../components/WebViewLoadBar";
import { WebViewProgressEvent } from "react-native-webview/lib/WebViewTypes";
import { bridgeScript } from "../utils/bridge";
import i18n from "../utils/i18n";
import { locale } from "expo-localization";
import { theme } from "../../theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  HeaderBackButton,
  HeaderHeightContext,
} from "@react-navigation/elements";
interface Props {
  navigation: StackNavigationProp<any>;
  route: {
    key: string;
    params: { [key: string]: any };
  };
}
@inject("app", "bridge")
@observer
class Home extends Component<Props> {
  webView: WebView | null = null;
  navState: WebViewNavigation | null = null;
  hasInjectedJavaScript: boolean = false;
  hasInjectedBridge: boolean = false;
  isGoBack: boolean = false;
  isNavigateToSign: boolean = false;
  lastUrl: string = "";
  isLogined: boolean = false;
  isLogout: boolean = false;
  state = {
    loadProgress: 0,
    showModal: false,
    isShowWebView: true,
    unsupportFileUrl: "",
    // isOpenScanner
    isOpenScanner: false,
    clickflag: false,
  };
  backhandler: any = null;

  checkRefreshToken: NodeJS.Timeout | undefined;
  sendingRegisterId: boolean = false;
  logoutUrl = /loginq.cat.com\/CwsLogin\/cws\/logout/;
  loginUrl = /qingflow.com\/passport\/login/;
  async componentDidMount() {
    this.isNavigateToSign = false;
    this.isLogined = false;
    let { params } = this.props.route;

    // if(params.registerID) {
    // 	Alert.alert(JSON.stringify(params));
    // }

    if (Platform.OS === "android") {
      // android only
      this.backhandler = () => {
        if (!this.navState) return false;
        return this.goBackTriger();
      };
      BackHandler.addEventListener("hardwareBackPress", this.backhandler);
    }
    this.checkRefreshToken = setTimeout(() => {
      this.refreshToken();
    }, 10 * 1000);
    bridgeStore.setNavigation(this.props.navigation);
    this.setHeaderOptions("");
    this.autoCheckVersion();
  }

  // 更新用户登录和退出机制
  autoCheckVersion() {
    //https://qinglfow-1d8820-1256107176.tcloudbaseapp.com/app-download/versions/android-last-version.json
    fetch(
      `https://leanflow.qingflow.com/versions/${Platform.OS}-last-version.json`
    )
      .then((res) => res.json())
      .then((res) => {
        if (
          !applicationBuildVersion ||
          // 这里需要进行版本的判断并
          // applicationBuildVersion 当前记录的版本
          // buildVersion 记录的最新的版本
          res.buildVersion > applicationBuildVersion
        ) {
          this.viewVersion(res.version);
        }
      })
      .catch((e) => {
        console.log(e);
      });
  }
  componentWillUnmount() {
    console.log("初始化", this.state.isOpenScanner);
    if (this.checkRefreshToken) {
      clearTimeout(this.checkRefreshToken);
    }
    BackHandler.removeEventListener("hardwareBackPress", this.backhandler);
  }
  // 极光推送获取 registration id 设备id
  async asyncGetRegistrationID(): Promise<string> {
    return await new Promise((resolve, reject) => {
      try {
        JPush.getRegistrationID((res) => {
          let { registerID = "" } = res || {};
          resolve(registerID);
        });
      } catch (error) {
        reject("error");
      }
    });
  }
  async getRegisterID() {
    let registerID = await getJPushRegisterId();
    let res = await getAuthCacheAsync();
    if (!res || !res.accessToken) return;
    if (this.sendingRegisterId) return;
    if (!registerID) {
      registerID = await this.asyncGetRegistrationID();
      await setJPushRegisterId(registerID);
    }
    try {
      let params = {
        registrationId: registerID,
        platform: Platform.OS,
        code: res.accessToken,
        locale,
      };

      console.log("params", params);
      this.sendingRegisterId = true;
      // https://qinglfow-1d8820.service.tcloudbase.com/cat?a=bindUserDevice
      let result = await fetch(DEVICE_URL, {
        method: "post",
        body: JSON.stringify(params),
        headers: { "Content-Type": "application/json" },
      });
      // 没有返回体 status 200成功，其他未成功
      if (result.status === 200) {
        setJPushRegisterId(registerID);
      } else {
        this.sendingRegisterId = false;
        setTimeout(() => this.getRegisterID(), 5 * 1000);
      }
    } catch (error) {
      this.sendingRegisterId = false;
      setTimeout(() => this.getRegisterID(), 5 * 1000);
    }
  }
  async refreshToken() {
    let res = await getAuthCacheAsync();
    if (res && res.refreshToken) {
      let result = await refreshAuthAsync();
      if (result) {
        if (result.accessToken) {
          appStore.setAuthState(result);
        } else if (result.error_description) {
          this.webView && this.webView.injectJavaScript(clearCookies);
          AsyncStorage.setItem("hasLogined", "false");
          Alert.alert(
            i18n.t("alert"),
            i18n.t("signExpiredMessage"),
            [
              {
                text: i18n.t("ok"),
                onPress: async () => {
                  this.gotoSignPage();
                },
              },
            ],
            { cancelable: false }
          );
        }
      }
    } else {
      this.webView && this.webView.injectJavaScript(clearCookies);
      this.gotoSignPage();
    }
  }
  // 跳转到登录页
  async gotoSignPage() {
    if (!this.isNavigateToSign) {
      this.isNavigateToSign = true;
      this.setState(
        {
          isShowWebView: false,
        },
        () => {
          this.props.navigation.replace("signInWithCat");
        }
      );
    }
  }

  goBackTriger() {
    if (this.navState && this.navState.canGoBack && this.webView) {
      this.webView.goBack();
      this.isGoBack = true;
      setTimeout(() => (this.isGoBack = false), 1500);
      return true;
    }
  }

  goSeting() {
    this.props.navigation.push("seting");
  }
  // 打开扫码功能
  openscaner() {
    this.setState({ isOpenScanner: true });
    // flag
    console.log("打开", this.state.isOpenScanner);
    this.props.navigation.push("scannertest", { navigator });
  }
  // closescaner() {
  //   // flag
  //   this.setState({ isOpenScanner: false });
  //   console.log("关闭", this.state.isOpenScanner);
  //   this.props.navigation.push("home");
  // }

  viewVersion(newVersion: string) {
    Alert.alert(
      i18n.t("version"),
      `${i18n.t("newVersion")}：${newVersion}\n${i18n.t(
        "currentVersion"
      )}：${applicationVersion}\n${
        Platform.OS === "android"
          ? Platform.OS.replace(Platform.OS[0], Platform.OS[0].toUpperCase())
          : Platform.OS.toLocaleUpperCase().replace(
              Platform.OS.toLocaleUpperCase()[0],
              Platform.OS.toLocaleUpperCase()[0].toLowerCase()
            )
      }：${
        Platform.OS == "android"
          ? androidVersion["v" + Platform.Version] ?? "13.0+"
          : Platform.Version
      } `,
      [
        // { text: '复制regID', onPress:async ()=>{
        //   const regID = await getJPushRegisterId()
        //   Clipboard.setString(regID+'');
        //   ToastAndroid.show('复制成功', 4000);
        // } },
        { text: i18n.t("close") },
        {
          text: `${i18n.t("download")} APP`,
          onPress: () => {
            let url = `https://leanflow.qingflow.com/app-download/?platform=${Platform.OS}&buildVersion=${applicationBuildVersion}&version=${applicationVersion}&locale=${locale}`;
            // let url = `http://192.168.21.78:8080/app-download/?platform=android&buildVersion=100&version=1.0.0&locale=cn`;
            WebBrowser.openBrowserAsync(url, {
              toolbarColor: theme.brandPrimary,
              showInRecents: true,
            });
          },
        },
      ]
    );
  }

  // 设置header
  setHeaderOptions(title: string) {
    const headerOptions: StackNavigationOptions = {
      title: title || "",
      headerShown: true,
      headerTitleContainerStyle: {
        overflow: "hidden",
        display: "flex",
        width: "70%",
        alignItems: "center",
      },
      headerLeft: () => {
        let menuComponent = (
          <TouchableHighlight
            underlayColor={theme.brandPrimary}
            onPress={this.goSeting.bind(this)}
            style={styles.menuButton}
          >
            <Ionicons allowFontScaling name="ios-menu" size={26} />
          </TouchableHighlight>
        );
        if (this.navState && this.navState.canGoBack) {
          // 主页
          if (this.navState.url === HOME_URL) {
            this.navState = null;
            return menuComponent;
          }
          // redirect 重定向退出登录页
          if (
            this.navState.url === loginOutRedirectUrl &&
            this.state.clickflag === false
          ) {
            Alert.alert(i18n.t("tellClient"), i18n.t("tellClientinner"), [
              {
                text: `${i18n.t("redirectUrl")}`,
                onPress: () => {
                  setTimeout(() => {
                    this.props.navigation.reset({
                      routes: [{ name: "home" }],
                    });
                  }, 100);
                },
              },
            ]);
            this.setState({ clickflag: true });
          }
          // flag 标记 back 页面和新的 webview
          // if (this.navState.url.indexOf('cart')==-1 &&
          //   this.state.isOpenScanner === true
          // ) {

          //   return (
          //     <TouchableHighlight
          //       underlayColor={theme.brandPrimary}
          //       onPress={this.closescaner.bind(this)}
          //       style={styles.menuButton}
          //     >
          //       <Ionicons allowFontScaling name="ios-close" size={26} />
          //     </TouchableHighlight>
          //   );
          // }

          // 默认页
          return (
            <HeaderBackButton
              tintColor={theme.brandPrimaryTextColor}
              label={i18n.t("back")}
              onPress={() => this.goBackTriger()}
            />
          );
        }
        // else if(){
        // // 判断是否为close

        // }
        else {
          return menuComponent;
        }
      },
      headerRight: () => {
        let menuComponent = (
          <TouchableHighlight
            underlayColor={theme.brandPrimary}
            onPress={this.openscaner.bind(this)}
            style={styles.menuButton}
          >
            <Ionicons allowFontScaling name="ios-scan-sharp" size={26} />
          </TouchableHighlight>
        );

        return menuComponent;
      },
    };
    this.props.navigation.setOptions(headerOptions);
  }
  async checkIfSignOut() {
    if (this.navState && this.logoutUrl.test(this.navState.url)) {
      this.setState({ showModal: true });
      console.log(this.isLogined, this.isLogout);
      if (this.isLogined && this.isLogout) {
        //跳转到cat的注销页
        this.setState(
          {
            isShowWebView: false,
          },
          () => {
            this.props.navigation.replace("signout");
            AsyncStorage.setItem("hasLogined", "false");
          }
        );
      } else {
        this.gotoSignPage();
      }
    } else {
      this.setState({ showModal: false });
    }
  }
  checkIfLogout() {
    const url = this.navState?.url || "";
    if (/arch\/more/.test(url)) {
      //如果用户主动退出系统，必定需要跳转到这个页面
      this.isLogout = true;
      this.isLogined = true;
    } else if (!this.loginUrl.test(url) && !this.isLogout) {
      this.isLogout = false;
      this.isLogined = true;
    }
  }
  onNavigationStateChange(event: WebViewNavigation) {
    this.hasInjectedJavaScript = false;
    this.hasInjectedBridge = false;
    this.navState = event;
    this.setHeaderOptions(event.title);
    this.checkIfLogout();
    this.checkIfSignOut();
  }
  // 传递数据
  onMessage(event: WebViewMessageEvent) {
    let { data = "" } = event.nativeEvent;
    this.setState({ loadProgress: 0 });
    if (data === "navigationStateChange") {
      let { title, url, canGoBack, canGoForward, loading, lockIdentifier } =
        event.nativeEvent;
      this.lastUrl = url;
      let navigationEvent: WebViewNavigation = {
        title,
        url,
        canGoBack,
        canGoForward,
        loading,
        navigationType: "other",
        lockIdentifier,
      };
      this.navState = navigationEvent;
      this.setHeaderOptions(title);
      this.checkIfLogout();
      this.checkIfSignOut();
    } else {
      let decodeData = JSON.parse(data);
      let {
        name = "",
        type = "",
        options = {},
        successCallback = "",
        failCallback = "",
        hasInjectedBridge,
        hasInjectedJavaScript,
      } = decodeData;
      if (type) {
        // 打开扫码器
        bridgeStore.dispatchAction(
          type,
          options,
          successCallback,
          failCallback
        );
      } else if (name === "injectEnv") {
        this.hasInjectedBridge = hasInjectedBridge;
        this.hasInjectedJavaScript = hasInjectedJavaScript;
      }
    }
  }
  onShouldStartLoadWithRequest(req: any) {
    let { url = "" } = req;
    if (!url) return false;
    let { pathname } = new URL(url);
    let pathnameArr = decodeURIComponent(pathname).split("/");
    let filename = pathnameArr[pathnameArr.length - 1];
    let ext = filename.match(/\.([a-zA-Z]+)$/);
    console.log("ext", ext);
    if (ext && Platform.OS === "android") {
      if (!/jpg|jpeg|png|gif|aac|mp3|mp4/i.test(ext[0])) {
        this.setState({ unsupported: true, unsupportFileUrl: url });
        this.props.navigation.push("unsupportedfile", {
          fileUrl: url,
          filename: filename,
        });
        // this.props.navigation.push('home')
        // if (this.isLogined && this.isLogout) {
        //   //跳转到cat的注销页
        //   this.setState(
        //     {
        //       isShowWebView: false,
        //     },
        //     () => {
        //       // 清除cookie
        //       // bridgeStore.webView?.injectJavaScript(clearCookies);
        //       this.props.navigation.replace('signout');
        //       AsyncStorage.setItem('hasLogined', 'false');
        //     },
        //   );
        //   }
        return false;
      } else {
        return true;
      }
      // WebBrowser.openBrowserAsync(url);
      // this.props.navigation.goBack();
    }
  }

  onWebViewLoad(event: any) {
    this.setHeaderOptions(event.nativeEvent.title);
    if (!this.isGoBack || !this.hasInjectedJavaScript) {
      this.hasInjectedJavaScript = true;
      this.webView && this.webView.injectJavaScript(injectedJavaScript);
      // 需要判断是否是第一次进行登录
      // Alert.alert(
      //   "用户协议与隐私政策",
      //   "协议内容",
      //   [
      //     {
      //       text: "不同意",
      //       style: "cancel",
      //       // onPress:()=>{
      //       //   console.log('cancel')
      //       // }
      //     },
      //     {
      //       text: "同意并继续",
      //       onPress: () => {
      //         // 在这里添加“确定”按钮被点击时的处理逻辑
      //         console.log("确定按钮被点击");
      //       },
      //     },
      //   ],
      //   { cancelable: false }
      // );
    }
  }
  onWebViewLoadEnd(e: any) {
    this.navState = e.nativeEvent;
    if (e.nativeEvent.url === HOME_URL) {
      setTimeout(() => {
        if (this.navState?.url === HOME_URL) {
          this.isLogined = true;
          this.getRegisterID();
        }
      }, 4000);
    }
    this.checkIfLogout();
    this.checkIfSignOut();
    if (this.webView && this.navState?.url === HOME_URL) {
      !this.hasInjectedBridge &&
        this.webView.injectJavaScript(`${bridgeScript}`);
      let fnHandler = () => {
        JPush.setBadge({ badge: 0, appBadge: 0 });
      };
      JPush.removeListener(fnHandler);
      JPush.addNotificationListener(fnHandler);
      //自定义消息回调
      JPush.addCustomMessageListener(fnHandler);
    }
  }
  // 进度条
  onLoadProgress({ nativeEvent }: WebViewProgressEvent) {
    let { progress } = nativeEvent;
    if (progress) this.setState({ loadProgress: progress * 100 });
  }
  _setWebView(wv: IWebView | null) {
    if (wv && wv.webview) {
      this.webView = wv.webview;
      bridgeStore.setWebView(this.webView);
    }
  }
  render() {
    let { loadProgress, showModal, isShowWebView } = this.state;
    return (
      <View style={styles.container}>
        <StatusBar
          backgroundColor={theme.brandPrimary}
          barStyle="dark-content"
        ></StatusBar>
        {/* 加载 */}
        <WebViewLoadBar progress={loadProgress} />
        {/* =====================IWebView组件 在这里进行加载================ */}
        {isShowWebView ? (
          <IWebView
            ref={(wv) => this._setWebView(wv)}
            style={styles.webview}
            source={{ uri: HOME_URL }}
            // source={{html: "" + htmlString}}
            // onShouldStartLoadWithRequest={this.onShouldStartLoadWithRequest.bind(
            //   this,
            // )}
            onLoadProgress={this.onLoadProgress.bind(this)}
            onLoad={this.onWebViewLoad.bind(this)}
            onLoadEnd={this.onWebViewLoadEnd.bind(this)}
            onMessage={this.onMessage.bind(this)}
          />
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              style={{ flex: 2 }}
              color={theme.brandPrimary}
              size="large"
            />
          </View>
        )}
        {/* =============================================================== */}
        <Modal visible={showModal} transparent={true}>
          <HeaderHeightContext.Consumer>
            {(innerHeight: any) => (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "#fff",
                  zIndex: 999,
                  marginTop: innerHeight,
                }}
              >
                <ActivityIndicator color={theme.brandPrimary} size="large" />
              </View>
            )}
          </HeaderHeightContext.Consumer>
        </Modal>
      </View>
    );
  }
}

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  model: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  menuButton: {
    flex: 1,
    width: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
