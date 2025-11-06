/**
 * @format
 */

// 1) SIEMPRE primero:
import 'react-native-gesture-handler';

// 2) Luego el resto (moment en español si lo necesitas)
import 'moment/locale/es';

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
