import React from 'react';
import NoDevice from './MessageScreen/NoDevice';

const HomeScreen = () => {
  return <NoDevice />;
};

export default HomeScreen;

// Is Device connected?
// yes? - Is Past session data available?
//        yes? - PastSessionDetails
//        no?  - NoDataScreen
// no?  - NoConnectedDeviceScreen
