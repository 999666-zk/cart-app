import { isProd } from "../constants";
interface ServiceConfiguration {
  authorizationEndpoint: string;
  tokenEndpoint: string;
  revocationEndpoint: string;
}
export interface OAuthConfig {
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUrl: string;
  serviceConfiguration: ServiceConfiguration;
  additionalParameters: { [key: string]: any };
  scopes: string[];
}
export const catDevConfig: OAuthConfig = {
  issuer: "https://fedloginqa.cat.com/as/authorization.oauth2",
  clientId: "Cat_Qingflow_ac_client",
  clientSecret:
    "mQgEnJFzaD4TgQygjeOy3vyk4oFCnYv7tNE7hBhbgO3Nd4Py0FDdBSaBVvBXLyJC",
  scopes: ["openid", "profile"],
  redirectUrl: "exp://192.168.2.102:19000",
  serviceConfiguration: {
    authorizationEndpoint: "https://fedloginqa.cat.com/as/authorization.oauth2",
    tokenEndpoint: "https://fedloginqa.cat.com/as/token.oauth2",
    revocationEndpoint: "https://fedloginqa.cat.com/as/revoke_token.oauth2",
  },
  additionalParameters: {
    pfidpadapterid: "OAuthAdapterBasicIdentity",
    response_type: "code",
    grant_type: "authorization_code",
  },
  // issuer: "https://fedloginqa.cat.com/as/authorization.oauth2",
  // clientId: "Cat_Qingflow_ac_client",
  // clientSecret:
  //   "mQgEnJFzaD4TgQygjeOy3vyk4oFCnYv7tNE7hBhbgO3Nd4Py0FDdBSaBVvBXLyJC",
  // scopes: ["openid", "profile"],
  // // 重定向
  // redirectUrl: "exp://192.168.2.102:19000",
  // serviceConfiguration: {
  //   authorizationEndpoint: "https://fedloginqa.cat.com/as/authorization.oauth2",
  //   tokenEndpoint: "https://fedloginqa.cat.com/as/token.oauth2",
  //   revocationEndpoint: "https://fedloginqa.cat.com/as/revoke_token.oauth2",
  // },
  // additionalParameters: {
  //   pfidpadapterid: "OAuthAdapterBasicIdentity",
  //   response_type: "code",
  //   grant_type: "authorization_code",
  // },
};

export const catConfig: OAuthConfig = {
  issuer: "https://fedlogin.cat.com/as/authorization.oauth2",
  clientId: "Cat_Qingflow_ac_client",
  clientSecret:
    "vlH7MF0tHjWoFEcXw49X3ThrgbWX9O2Nd5qhWbTv9M2bbGQcDTDctJD8LviIXpem",
  scopes: ["openid", "profile"],
  redirectUrl: "catapp://app.fedlogin.cat.com",
  serviceConfiguration: {
    authorizationEndpoint: "https://fedlogin.cat.com/as/authorization.oauth2",
    tokenEndpoint: "https://fedlogin.cat.com/as/token.oauth2",
    revocationEndpoint: "https://fedlogin.cat.com/as/revoke_token.oauth2",
  },
  additionalParameters: {
    pfidpadapterid: "OAuthAdapterBasicIdentity",
    response_type: "code",
    grant_type: "authorization_code",
  },
};
// 代理
// export const oAuthProxyServerUrl =
//   "https://qinglfow-1d8820.service.tcloudbase.com/cat-oauth-proxy-server";
export const authConfig = isProd ? catConfig : catDevConfig;
export default {
  authConfig,
  // oAuthProxyServerUrl,
};
