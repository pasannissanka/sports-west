/**
 * @format
 */

import {AppRegistry, LogBox} from 'react-native';
import {name as appName} from './app.json';
import Index from './src';

LogBox.ignoreLogs(['new NativeEventEmitter']); // Ignore log notification by message
LogBox.ignoreAllLogs(); //Ignore all log notifications Root problem is not yet solved but still work

AppRegistry.registerComponent(appName, () => Index);
