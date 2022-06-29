import {NavigationContext} from '@react-navigation/native';
import React, {useEffect} from 'react';
import {Text, View} from 'react-native';
import {useAppSelector} from '../../hooks/reduxHooks';

export default function SessionPage() {
  const navigation = React.useContext(NavigationContext);
  const bluetoothState = useAppSelector(state => state.bluetooth);

  useEffect(() => {
    if (!bluetoothState?.connectedDevice) {
      navigation?.navigate('NoDevicePage');
    } else {
      navigation?.navigate('SessionPage');
    }
  }, [navigation, bluetoothState?.connectedDevice]);

  return (
    <View>
      <Text>Session.page</Text>
    </View>
  );
}
