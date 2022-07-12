import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React from 'react';
import HomePage from '../Pages/Home/Home.page';
import NoDevice from '../Components/MessageScreen/NoDevice';

const Stack = createNativeStackNavigator();

const HomeScreen = () => {
  return (
    <Stack.Navigator
      screenOptions={{headerShown: false}}
      initialRouteName="HomePage">
      <Stack.Screen name="HomePage" component={HomePage} />
      <Stack.Screen name="NoDevicePage" component={NoDevice} />
    </Stack.Navigator>
  );
};

export default HomeScreen;

// Is Device connected?
// yes? - Is Past session data available?
//        yes? - PastSessionDetails
//        no?  - NoDataScreen
// no?  - NoConnectedDeviceScreen
