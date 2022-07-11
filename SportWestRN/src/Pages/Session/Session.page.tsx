import {SERVICE_UUID, SESSION_TRIGGER_CUUID} from '@env';
import {NavigationContext} from '@react-navigation/native';
import React, {useEffect} from 'react';
import styled from 'styled-components/native';
import {useAppSelector} from '../../hooks/reduxHooks';
import BaseMessageScreen from '../../Components/MessageScreen/BaseMessage.Screen';
import {writeDataBle} from '../../util/bluetooth';

export default function SessionPage() {
  const navigation = React.useContext(NavigationContext);
  const bluetoothState = useAppSelector(state => state.bluetooth);
  const bleDataState = useAppSelector(state => state.bleData);

  useEffect(() => {
    if (!bluetoothState?.connectedDevice) {
      navigation?.navigate('NoDevicePage');
    } else {
      if (bleDataState.sessionRecording) {
        navigation?.navigate('SessionTimerPage');
      } else {
        navigation?.navigate('SessionPage');
      }
    }
  }, [
    navigation,
    bluetoothState.connectedDevice,
    bleDataState.sessionRecording,
  ]);

  const onSessionStart = () => {
    if (bluetoothState.connectedDevice?.id) {
      writeDataBle(
        bluetoothState.connectedDevice.id,
        SERVICE_UUID,
        SESSION_TRIGGER_CUUID,
        'start',
      );
    }
  };

  return (
    <Wrapper>
      <BaseMessageScreen
        heading="Start a Session"
        subHeading="Start a Training session/ Match to get started."
        actionType="single"
        actionText="Start"
        actionProps={{
          type: 'primary',
          onPress: onSessionStart,
        }}
      />
    </Wrapper>
  );
}

const Wrapper = styled.View`
  flex: 1;
  color: #000;
`;
