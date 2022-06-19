import AntProvider from '@ant-design/react-native/lib/provider';
import React from 'react';
import NoDevice from './MessageScreen/NoDevice';

const HomeScreen = () => {
  return (
    <AntProvider>
      <NoDevice />
    </AntProvider>
  );
};

export default HomeScreen;

// Is Device connected?
// yes? - Is Past session data available?
//        yes? - PastSessionDetails
//        no?  - NoDataScreen
// no?  - NoConnectedDeviceScreen
