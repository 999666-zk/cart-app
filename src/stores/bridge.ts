import {action, observable} from 'mobx';

import {BARCODESCAN} from '../constants/bridge';
import {StackNavigationProp} from '@react-navigation/stack';
import {WebView} from 'react-native-webview';

class Bridge {
  isBarcodeScanCalled: boolean = false;
  @observable webView: WebView | null = null;
  @observable navigation: StackNavigationProp<any> | null = null;
  @action
  setWebView(webview: WebView) {
    this.webView = webview;
  }
  @action
  setNavigation(navigation: StackNavigationProp<any>) {
    this.navigation = navigation;
  }
  @action
  dispatchAction(
    type: string,
    options: {[key: string]: any},
    successCallback: string = '',
    failCallback: string = '',
  ) {
    if (!this.navigation) return;
    switch (type) {
      case BARCODESCAN:
        if (this.isBarcodeScanCalled) return;
        this.isBarcodeScanCalled = true;
        this.navigation.navigate('scanner', {
          ...options,
          successCallback,
          failCallback,
        });
        break;
      default:
    }
  }
  @action
  dispatchSuccessCallback(callback: string, data: any) {
    this.dispatchCallback(callback, data);
  }
  @action
  dispatchFailCallback(callback: string, error: any) {
    this.dispatchCallback(callback, error);
  }
  dispatchCallback(callback: string, data: any) {
    this.isBarcodeScanCalled = false;
    if (this.webView && callback) {
      this.webView.injectJavaScript(
        `(function() {
					let callback = window.bridgeCallBacks['${callback}'];
					if (typeof callback === 'function') {
						let _d = '${JSON.stringify(data)}';
						try {
							let data = JSON.parse(_d);
							callback(data);
						} catch (err) {
							callback(_d);
						}
					}
				})();`,
      );
    }
  }
}

export default new Bridge();
