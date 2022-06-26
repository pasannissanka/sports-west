import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React from 'react';
import SessionPage from '../Pages/Session/Session.page';
import NoDevice from './MessageScreen/NoDevice';

const Stack = createNativeStackNavigator();

export default function SessionScreen() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="SessionPage" component={SessionPage} />
      <Stack.Screen name="NoDevicePage" component={NoDevice} />
    </Stack.Navigator>
  );
}

// Is Device Connected
// yes? - Start a new Session
// no?  - NoConnectedDeviceScreen
