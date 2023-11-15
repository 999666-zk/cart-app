import {observable, action} from 'mobx';

class AppStore {
  @observable isLogined: boolean = false;
  @observable autoLogin: boolean = true;
  @observable
  authState:
    | {
        [key: string]: any;
      }
    | undefined;
  @action
  setAuthState(authState: {[key: string]: any}) {
    this.authState = authState;
  }
  @action
  setIsLogined(isLogined: boolean) {
    this.isLogined = isLogined;
  }
  @action
  setAutoLogin(value: boolean) {
    this.autoLogin = value;
  }
}

export default new AppStore();
