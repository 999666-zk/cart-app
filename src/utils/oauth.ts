import qs from "qs";
import { authConfig, OAuthConfig } from "./oauthConfig";
import * as SecureStore from "expo-secure-store";
import * as AuthSession from "expo-auth-session";
import * as Random from "expo-random";
import * as Crypto from "expo-crypto";
import { Base64 } from "js-base64";
import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";
interface AuthResult {
  accessToken: string;
  accessTokenExpirationDate: number;
  idToken: string;
  refreshToken: string;
}
const AccessTokenStorageKey = "CATAPP_OAUTH_ACCESSTOKEN";
const RefreshTokenStorageKey = "CATAPP_OAUTH_REFRESHTOKEN";
const AuthOtherDataStorageKey = "CATAPP_OAUTH_OTHER";

function sendRequest(url: string, params: { [key: string]: any }) {
  return fetch(url, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: qs.stringify(params),
    method: "POST",
  })
    .then((res) => res.text())
    .then((text) => {
      return text.length ? JSON.parse(text) : null;
    })
    .catch((error) => {
      throw error;
    });
}
function buildAuthResult(result: { [key: string]: any }): AuthResult {
  let {
    access_token = "",
    expires_in = 0,
    refresh_token = "",
    id_token = "",
  } = result;

  console.log("相关信息", {
    accessToken: access_token,
    accessTokenExpirationDate: expires_in,
    idToken: id_token,
    refreshToken: refresh_token,
  });
  
  return {
    accessToken: access_token,
    accessTokenExpirationDate: expires_in,
    idToken: id_token,
    refreshToken: refresh_token,
  };
}
export function getCodeFromUrl(url: string): string {
  if (/catapp:/.test(url)) {
    let { code } = qs.parse(url.substr(url.lastIndexOf("?") + 1));
    return code ? code : "";
  }
  return "";
}
function URLEncode(str: string) {
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
export function buildDiscovery() {
  let { serviceConfiguration } = authConfig;
  return {
    authorizationEndpoint: serviceConfiguration.authorizationEndpoint,
    tokenEndpoint: serviceConfiguration.tokenEndpoint,
  };
}
export function buildAuthRequestConfig() {
  let { clientId, additionalParameters, redirectUrl, scopes, clientSecret } =
    authConfig;
  let { pfidpadapterid } = additionalParameters;
  return {
    clientId,
    clientSecret,
    redirectUri: redirectUrl,
    responseType: AuthSession.ResponseType.Code,
    scopes,
    usePKCE: true,
    state: Date.now().toString(),
    extraParams: {
      pfidpadapterid,
    },
  };
}
export async function startAuthAsync() {
  try {
    let {
      clientId,
      serviceConfiguration,
      additionalParameters,
      redirectUrl,
      scopes,
      clientSecret,
    } = authConfig;
    let { pfidpadapterid } = additionalParameters;
    let discovery = {
      authorizationEndpoint: serviceConfiguration.authorizationEndpoint,
      tokenEndpoint: serviceConfiguration.tokenEndpoint,
    };
    // verifier 加密
    let randomBytes = await Random.getRandomBytesAsync(24);
    let verifier = URLEncode(Base64.encode(randomBytes.toString()));
    let challenge = URLEncode(
      await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        verifier,
        {
          encoding: Crypto.CryptoEncoding.BASE64,
        }
      )
    );
    let authLoad = new AuthSession.AuthRequest({
      clientId,
      clientSecret,
      redirectUri: redirectUrl,
      responseType: AuthSession.ResponseType.Code,
      scopes,
      usePKCE: true,
      state: Date.now().toString(),
      extraParams: {
        pfidpadapterid,
        code_challenge: challenge,
        code_challenge_method: AuthSession.CodeChallengeMethod.S256,
        prompt: "login",
        time: Date.now().toString(),
      },
    });
    let url = await authLoad.buildUrlAsync(discovery);
    let authState = await WebBrowser.openAuthSessionAsync(
      url,
      authLoad.redirectUri,
      { showInRecents: true }
    );
    if (authState.type === "success") {
      let res = authLoad.parseReturnUrl(authState.url);
      if (res.type === "success") res.params.verifier = verifier;
      return res;
    }
    return authState;
  } catch (error) {
    console.log(error);
    return null;
  }
}
// 获取token
export async function getAccessTokenAsync(
  code: string,
  verifier: string
): Promise<AuthResult | null> {
  if (!code) return null;
  const {
    clientId,
    serviceConfiguration,
    additionalParameters,
    clientSecret,
    redirectUrl,
  } = authConfig;
  try {
    let result = await sendRequest(serviceConfiguration.tokenEndpoint, {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUrl,
      code_verifier: verifier,
      grant_type: additionalParameters.grant_type,
    });
    if (result && result.access_token) {
      let accessTokenData: AuthResult = buildAuthResult(result);
      await cacheAuthAsync(accessTokenData);
      return accessTokenData;
    }
    return result;
  } catch (error) {
    return error;
  }
}

export async function cacheAuthAsync(authResult: AuthResult) {
  let { accessToken, accessTokenExpirationDate, idToken, refreshToken } =
    authResult;
  // token 失效日期
  accessTokenExpirationDate =
    Date.now() + (authResult.accessTokenExpirationDate - 59) * 1000;
  await SecureStore.setItemAsync(AccessTokenStorageKey, accessToken);
  await SecureStore.setItemAsync(RefreshTokenStorageKey, refreshToken);
  await AsyncStorage.setItem(
    AuthOtherDataStorageKey,
    JSON.stringify({ accessTokenExpirationDate, idToken })
  );
}
export async function getAuthCacheAsync(): Promise<AuthResult | null> {
  try {
    let accessToken = await SecureStore.getItemAsync(AccessTokenStorageKey);
    let refreshToken = await SecureStore.getItemAsync(RefreshTokenStorageKey);
    let authOther = await AsyncStorage.getItem(AuthOtherDataStorageKey);
    if (accessToken && refreshToken && authOther) {
      return Object.assign(
        { accessToken, refreshToken },
        JSON.parse(authOther)
      );
    } else {
      await clearAuthCache();
    }
    return null;
  } catch (error) {
    console.log(error);
    return null;
  }
}
export async function checkIfTokenExpired() {
  let res = await getAuthCacheAsync();
  if (res && res.accessTokenExpirationDate) {
    return new Date(res.accessTokenExpirationDate) < new Date();
  }
  return true;
}
export async function refreshAuthAsync() {
  const res = await getAuthCacheAsync();
  if (!res || !res.refreshToken) return;
  const { clientId, serviceConfiguration, clientSecret, scopes } = authConfig;
  try {
    let result = await sendRequest(serviceConfiguration.tokenEndpoint, {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: res.refreshToken,
      scope: scopes.join(" "),
      grant_type: "refresh_token",
    });
    if (result.access_token) {
      let accessTokenData: AuthResult = buildAuthResult(result);
      await cacheAuthAsync(accessTokenData);
      return accessTokenData;
    }
    await clearAuthCache();
    return result;
  } catch (error) {
    console.log(error);
    return null;
  }
}
export async function revokeAsync(
  config: OAuthConfig,
  params: { [key: string]: any }
) {
  return sendRequest(config.serviceConfiguration.revocationEndpoint, params);
}
export async function signOutAsync() {
  let res = await getAuthCacheAsync();
  if (res && res.accessToken) {
    res = await revokeAsync(authConfig, {
      token: res.refreshToken,
      client_id: authConfig.clientId,
      client_secret: authConfig.clientSecret,
    });
    await clearAuthCache();
  }
  return null;
}
export async function clearAuthCache() {
  await SecureStore.deleteItemAsync(AccessTokenStorageKey);
  await SecureStore.deleteItemAsync(RefreshTokenStorageKey);
  await AsyncStorage.removeItem(AuthOtherDataStorageKey);
  console.log("clear all cache");
}
export default {
  startAuthAsync,
  getAccessTokenAsync,
  refreshAuthAsync,
  signOutAsync,
  checkIfTokenExpired,
  getAuthCacheAsync,
  clearAuthCache,
  buildDiscovery,
  buildAuthRequestConfig,
  cacheAuthAsync,
};
