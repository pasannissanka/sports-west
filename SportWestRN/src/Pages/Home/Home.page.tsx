import {NavigationContext} from '@react-navigation/native';
import React, {useEffect} from 'react';
import {Text, View} from 'react-native';
import {useAppSelector} from '../../hooks/reduxHooks';

export default function HomePage() {
  const navigation = React.useContext(NavigationContext);
  const bluetoothState = useAppSelector(state => state.bluetooth);

  useEffect(() => {
    if (!bluetoothState?.connectedDevice) {
      navigation?.navigate('NoDevicePage');
    } else {
      navigation?.navigate('HomePage');
    }
  }, [navigation, bluetoothState?.connectedDevice]);

  return (
    <View>
      <Text>Home.page</Text>
    </View>
  );
}
