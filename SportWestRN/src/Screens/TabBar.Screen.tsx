import {Icon} from '@ant-design/react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import React from 'react';
import HomeScreen from './Home.Screen';
import SessionScreen from './Session.Screen';
import {SettingsScreen} from './Settings.Screen';

const Tab = createBottomTabNavigator();

export default function TabBarScreen() {
  return (
    <>
      <Tab.Navigator
        initialRouteName="MainTab"
        screenOptions={{
          tabBarActiveTintColor: '#1677FF',
          tabBarShowLabel: false,
          headerTitleAlign: 'center',
          headerTitle: 'Sports Vest',
        }}>
        <Tab.Screen
          name="Main"
          component={HomeScreen}
          options={{
            tabBarIcon: ({color}) => (
              <Icon name="home" size="lg" color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="SessionTab"
          component={SessionScreen}
          options={{
            tabBarIcon: ({color}) => (
              <Icon name="play-circle" size="lg" color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="SettingTab"
          component={SettingsScreen}
          options={{
            tabBarIcon: ({color}) => (
              <Icon name="bars" size="lg" color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </>
  );
}
