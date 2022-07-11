import {View, Text} from 'react-native';
import React from 'react';
import {Button} from '@ant-design/react-native';
import {useNavigation} from '@react-navigation/native';

export default function ModalScreen() {
  const navigation = useNavigation();
  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <Text style={{fontSize: 30}}>This is a modal!</Text>
      <Button onPress={() => navigation.goBack()} type="ghost">
        GoBack
      </Button>
    </View>
  );
}
