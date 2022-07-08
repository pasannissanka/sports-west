import {NavigationContext} from '@react-navigation/native';
import React, {useEffect} from 'react';
import {View} from 'react-native';
import {useAppSelector} from '../../hooks/reduxHooks';
import StartSessionScreen from '../../Screens/MessageScreen/StartSession.screen';

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
      <StartSessionScreen />
    </View>
  );
}
