import React from 'react';
import {Text, View} from 'react-native';
import {useBLEContext} from '../State/BLEContext';
import NoDevice from './MessageScreen/NoDevice';

const HomeScreen = () => {
  const {state} = useBLEContext();

  if (!state?.connectedDevice) {
    return <NoDevice />;
  }

  return (
    <View>
      <Text style={{color: '#000'}}>
        Connected - {state.connectedDevice.advertising.localName}
      </Text>
    </View>
  );
};

export default HomeScreen;

// Is Device connected?
// yes? - Is Past session data available?
//        yes? - PastSessionDetails
//        no?  - NoDataScreen
// no?  - NoConnectedDeviceScreen
