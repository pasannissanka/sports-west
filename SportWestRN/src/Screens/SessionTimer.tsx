import {Button} from '@ant-design/react-native';
import {
  DATA_TRANSMIT_TRIGGER_CUUID,
  SERVICE_UUID,
  SESSION_TRIGGER_CUUID,
} from '@env';
import React, {useEffect, useState} from 'react';
import {useStopwatch} from 'react-timer-hook';
import styled from 'styled-components/native';
import {resetSerialData} from '../features/bleData/bleDataSlice';
import {useAppDispatch, useAppSelector} from '../hooks/reduxHooks';
import {writeDataBle} from '../util/bluetooth';

export default function SessionTimer() {
  const [offset, setOffset] = useState<Date>();

  const bleDataState = useAppSelector(state => state.bleData);
  const bluetoothState = useAppSelector(state => state.bluetooth);
  const dispatch = useAppDispatch();

  const {seconds, minutes, hours, start, reset, pause} = useStopwatch({
    offsetTimestamp: offset,
  });

  useEffect(() => {
    if (bleDataState.runningSession?.startTime) {
      const now = Math.floor(Date.now() / 1000);
      const stopwatchOffset = new Date();
      stopwatchOffset.setSeconds(
        stopwatchOffset.getSeconds() +
          (now - bleDataState.runningSession.startTime),
      );
      setOffset(stopwatchOffset);
      start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bleDataState.runningSession?.startTime]);

  const onSessionStop = () => {
    if (bluetoothState.connectedDevice?.id) {
      const {id} = bluetoothState.connectedDevice;
      dispatch(resetSerialData());
      writeDataBle(id, SERVICE_UUID, SESSION_TRIGGER_CUUID, 'start').then(
        () => {
          reset();
          pause();
          // Trigger data transfer
          writeDataBle(id, SERVICE_UUID, DATA_TRANSMIT_TRIGGER_CUUID, 'true');
        },
      );
    }
  };

  return (
    <Container>
      <MessagesWrapper>
        <TimerWrapper>
          <Text>
            {hours.toLocaleString('en-US', {
              minimumIntegerDigits: 2,
              useGrouping: false,
            })}
            :
          </Text>
          <Text>
            {minutes.toLocaleString('en-US', {
              minimumIntegerDigits: 2,
              useGrouping: false,
            })}
            :
          </Text>
          <Text>
            {seconds.toLocaleString('en-US', {
              minimumIntegerDigits: 2,
              useGrouping: false,
            })}
          </Text>
        </TimerWrapper>
        <ActionWrapper>
          <Button type="warning" onPress={onSessionStop}>
            Stop
          </Button>
        </ActionWrapper>
      </MessagesWrapper>
    </Container>
  );
}

const Container = styled.View`
  flex: 1;
  color: #000;
`;

const MessagesWrapper = styled.View`
  display: flex;
  top: 40%;
  align-items: center;
  flex-direction: column;
`;

const TimerWrapper = styled.View`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin-bottom: 40px;
`;

const ActionWrapper = styled.View`
  flex: 1;
  flex-direction: column;
  width: 30%;
`;

const Text = styled.Text`
  color: #000000;
  font-size: 64px;
  text-align: center;
  line-height: 72px;
`;
