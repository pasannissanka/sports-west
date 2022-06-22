/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import Icon from '@ant-design/react-native/lib/icon';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer} from '@react-navigation/native';
import React, {useEffect, useReducer} from 'react';
import {
  NativeEventEmitter,
  NativeModules,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import BleManager, {Peripheral} from 'react-native-ble-manager';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import HomeScreen from './Screens/Home.Screen';
import SessionScreen from './Screens/Session.Screen';
import {SettingsScreen} from './Screens/Settings.Screen';
import {BLEContext, BLEContextReducer, BLEInitState} from './State/BLEContext';

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const Tab = createBottomTabNavigator();

const App = () => {
  const [BLEState, BLEDispatch] = useReducer(BLEContextReducer, BLEInitState);

  // BleManager Listeners
  const handleUpdateValueForCharacteristic = (data: any) => {
    console.log(
      'Received data from ' +
        data.peripheral +
        ' characteristic ' +
        data.characteristic,
      data.value,
    );
  };

  const handleDiscoverPeripheral = (peripheral: Peripheral) => {
    console.log('Got ble peripheral', peripheral);
    if (!peripheral.name) {
      peripheral.name = 'NO NAME';
    }
    BLEDispatch({
      type: 'device_found',
      device: peripheral,
    });
  };

  const handleDisconnectedPeripheral = (data: any) => {
    // let peripheral = peripherals.get(data.peripheral);
    let peripheral = BLEState.devices?.find(dev => dev.id === data.peripheral);

    if (peripheral) {
      BLEDispatch({type: 'disconnected'});
    }
    console.log('Disconnected from ' + data.peripheral);
  };

  const handleStopScan = () => {
    BLEDispatch({type: 'scan_success'});
  };

  const handleConnectPeripheral = (data: {
    peripheral: string;
    status: number;
  }) => {
    const peripheral = BLEState.devices?.find(
      dev => dev.id === data.peripheral,
    );
    console.log(data, peripheral, BLEState, 'BleManagerConnectPeripheral');
    // if (peripheral) {
    //   BLEDispatch({type: 'connected', device: peripheral});
    // }
  };

  const retrieveConnected = () => {
    BleManager.getConnectedPeripherals([]).then(results => {
      if (results.length === 0) {
        console.log('No connected peripherals');
      }
      console.log(results);
      for (let i = 0; i < results.length; i++) {
        let peripheral = results[i] as Peripheral;
        console.log('Connected Device', peripheral);
        BLEDispatch({type: 'connected', device: peripheral});
      }
    });
  };

  console.log(BLEState);

  useEffect(() => {
    BleManager.start({showAlert: false}).then(() => {
      // Success code
      console.log('Module initialized');
      BleManager.enableBluetooth()
        .then(() => {
          // Success code
          retrieveConnected();
          console.log('The bluetooth is already enabled or the user confirm');
        })
        .catch(error => {
          // Failure code
          console.log('The user refuse to enable bluetooth', error);
        });
    });
    const BleManagerDiscoverPeripheralListener = bleManagerEmitter.addListener(
      'BleManagerDiscoverPeripheral',
      handleDiscoverPeripheral,
    );
    const BleManagerStopScanListener = bleManagerEmitter.addListener(
      'BleManagerStopScan',
      handleStopScan,
    );
    const BleManagerDisconnectPeripheralListener =
      bleManagerEmitter.addListener(
        'BleManagerDisconnectPeripheral',
        handleDisconnectedPeripheral,
      );
    const BleManagerDidUpdateValueForCharacteristicListener =
      bleManagerEmitter.addListener(
        'BleManagerDidUpdateValueForCharacteristic',
        handleUpdateValueForCharacteristic,
      );
    const BleManagerConnectPeripheralListener = bleManagerEmitter.addListener(
      'BleManagerConnectPeripheral',
      handleConnectPeripheral,
    );

    if (Platform.OS === 'android' && Platform.Version >= 23) {
      PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ).then(result => {
        if (result) {
          console.log('Permission is OK');
        } else {
          PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ).then(res => {
            if (res) {
              console.log('User accept');
            } else {
              console.log('User refuse');
            }
          });
        }
      });
    }

    return () => {
      console.log('unmount');
      BleManagerDiscoverPeripheralListener.remove();
      BleManagerStopScanListener.remove();
      BleManagerDisconnectPeripheralListener.remove();
      BleManagerDidUpdateValueForCharacteristicListener.remove();
      BleManagerConnectPeripheralListener.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <BLEContext.Provider
        value={{
          dispatch: BLEDispatch,
          state: BLEState,
        }}>
        <NavigationContainer>
          <Tab.Navigator
            initialRouteName="Home"
            screenOptions={{
              tabBarActiveTintColor: '#1677FF',
              tabBarShowLabel: false,
              headerTitleAlign: 'center',
              headerTitle: 'Sports Vest',
            }}>
            <Tab.Screen
              name="Home"
              component={HomeScreen}
              options={{
                tabBarIcon: ({color}) => (
                  <Icon name="home" size="lg" color={color} />
                ),
              }}
            />
            <Tab.Screen
              name="Sessions"
              component={SessionScreen}
              options={{
                tabBarIcon: ({color}) => (
                  <Icon name="play-circle" size="lg" color={color} />
                ),
              }}
            />
            <Tab.Screen
              name="Settings"
              component={SettingsScreen}
              options={{
                tabBarIcon: ({color}) => (
                  <Icon name="bars" size="lg" color={color} />
                ),
              }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </BLEContext.Provider>
    </GestureHandlerRootView>
  );
};

export default App;
