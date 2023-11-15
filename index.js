/**
 * @format
 */

import {AppRegistry} from 'react-native';
// import App from './App';
import App from './src/App';
import {name as appName} from './app.json';
import { setupURLPolyfill } from 'react-native-url-polyfill'
setupURLPolyfill()

AppRegistry.registerComponent(appName, () => App);
