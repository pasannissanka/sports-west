import {View, Text} from 'react-native';
import React, {useEffect} from 'react';
import {NavigationContext} from '@react-navigation/native';
import {useBLEContext} from '../../State/BLEContext';

export default function SessionPage() {
  const navigation = React.useContext(NavigationContext);
  const {state} = useBLEContext();

  useEffect(() => {
    if (!state?.connectedDevice) {
      navigation?.navigate('NoDevicePage');
    } else {
      navigation?.navigate('SessionPage');
    }
  }, [navigation, state?.connectedDevice]);

  return (
    <View>
      <Text>Session.page</Text>
    </View>
  );
}
