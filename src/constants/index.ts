/*
 * @Date: 2022-12-19 18:02:48
 * @LastEditTime: 2023-01-03 00:32:25
 * @FilePath: /leanFlow/src/constants/index.ts
 * @Description: Description
 */
import {Platform} from 'react-native';

export const isProd = true;
export const ENV = isProd ? 'prod' : 'dev';
export const HOME_PROD_URL = 'https://cat.qingflow.com/index';
export const HOME_DEV_URL = 'https://testcat.qingflow.com/arch/home';
export const LOGIN_PROD_URL =
  'https://cat.qingflow.com/sso?serverName=76aac11c-c443-405b-8eac-6f34f3dc60c2&code=';
export const LOGIN_DEV_URL =
  'https://testcat.qingflow.com/sso/cb?state=eyJzZXJ2ZXJOYW1lIjoiNzZhYWMxMWMtYzQ0My00MDViLThlYWMtNmYzNGYzZGM2MGMyIn0%3D&code=';

export const DEVICE_DEV_URL =
  'https://testcat.qingflow.com/jiguangpush/user/device';
export const DEVICE_PROD_URL =
  'https://cat.qingflow.com/jiguangpush/user/device';
export const HOME_URL = isProd ? HOME_PROD_URL : HOME_DEV_URL;
export const LOGIN_URL = isProd ? LOGIN_PROD_URL : LOGIN_DEV_URL;
export const DEVICE_URL = isProd ? DEVICE_PROD_URL : DEVICE_DEV_URL;
export const applicationName = 'LeanFlow';
export const androidAppVersion = '1.3.3';
export const iOSAppVersion = '1.3.1';
// 退出登录重定向的地址
export const loginOutRedirectUrl =
  'https://login.cat.com/CwsLogin/cws/logout.htm';
export const applicationVersion =
  Platform.OS === 'ios' ? iOSAppVersion : androidAppVersion;
export const androidBuildVersion = '133';
export const iosBuildVersion = '131';
export const applicationBuildVersion =
  Platform.OS === 'ios' ? iosBuildVersion : androidBuildVersion;
export const applicationNameForUserAgent = `${applicationName}/${applicationVersion}`;
export const jpushAppkey = '3a87503bb256897f1180f939';
export const jpushChannel = 'developer-default';
export const clearCookies = `
(function () {
    var cookies = document.cookie.split("; ");
    for (var c = 0; c < cookies.length; c++) {
        var d = window.location.hostname.split(".");
        while (d.length > 0) {
            var cookieBase = encodeURIComponent(cookies[c].split(";")[0].split("=")[0]) + '=; expires=Thu, 01-Jan-1970 00:00:01 GMT; domain=' + d.join('.') + ' ;path=';
            var p = location.pathname.split('/');
            document.cookie = cookieBase + '/';
            while (p.length > 0) {
                document.cookie = cookieBase + p.join('/');
                p.pop();
            };
            d.shift();
        }
		}
})();
true;
`;
export default {
  HOME_URL,
  LOGIN_URL,
  DEVICE_URL,
  ENV,
};
