import {View, Text} from 'react-native';
import React, {useEffect} from 'react';
import {useBLEContext} from '../../State/BLEContext';
import {NavigationContext} from '@react-navigation/native';

export default function HomePage() {
  const navigation = React.useContext(NavigationContext);
  const {state} = useBLEContext();

  useEffect(() => {
    if (!state?.connectedDevice) {
      navigation?.navigate('NoDevicePage');
    } else {
      navigation?.navigate('HomePage');
    }
  }, [navigation, state?.connectedDevice]);

  return (
    <View>
      <Text>Home.page</Text>
    </View>
  );
}
