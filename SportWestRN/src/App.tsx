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
import React from 'react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import HomeScreen from './Screens/Home.Screen';
import SessionScreen from './Screens/Session.Screen';
import {SettingsScreen} from './Screens/Settings.Screen';

const Tab = createBottomTabNavigator();

const App = () => {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
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
    </GestureHandlerRootView>
  );
};

export default App;
