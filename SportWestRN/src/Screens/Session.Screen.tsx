import {View, Text} from 'react-native';
import React from 'react';
import NoDevice from './MessageScreen/NoDevice';
import {useBLEContext} from '../State/BLEContext';

export default function SessionScreen() {
  const {state} = useBLEContext();

  if (!state?.connectedDevice) {
    return <NoDevice />;
  }
  return (
    <View>
      <Text>SessionScreen</Text>
    </View>
  );
}

// Is Device Connected
// yes? - Start a new Session
// no?  - NoConnectedDeviceScreen
