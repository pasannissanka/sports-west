import {Icon, NoticeBar} from '@ant-design/react-native';
import {NavigationContext} from '@react-navigation/native';
import React, {useEffect, useState} from 'react';
import {Text} from 'react-native';
import {useStopwatch} from 'react-timer-hook';
import styled from 'styled-components/native';
import {useAppSelector} from '../../hooks/reduxHooks';

export default function HomePage() {
  const navigation = React.useContext(NavigationContext);
  const bleDataState = useAppSelector(state => state.bleData);
  const [offset, setOffset] = useState<Date>();

  const bluetoothState = useAppSelector(state => state.bluetooth);
  const {seconds, minutes, hours, start, reset} = useStopwatch({
    offsetTimestamp: offset,
  });

  useEffect(() => {
    if (!bluetoothState?.connectedDevice) {
      navigation?.navigate('NoDevicePage');
    } else {
      navigation?.navigate('HomePage');
    }
  }, [navigation, bluetoothState?.connectedDevice]);

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
    } else {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bleDataState.runningSession?.startTime]);

  const handleSessionNav = () => {
    navigation?.navigate('SessionTimerPage');
  };

  return (
    <Container>
      {bleDataState.sessionRecording && (
        <NoticeBar
          // eslint-disable-next-line react-native/no-inline-styles
          style={{
            backgroundColor: 'red',
            paddingTop: 5,
            paddingBottom: 5,
            height: 50,
          }}
          icon={<Icon name="bulb" color="white" />}
          mode="link"
          onPress={handleSessionNav}
          action={
            <Icon name="right" color="white" onPress={handleSessionNav} />
          }
          marqueeProps={{
            loop: true,
            style: {fontSize: 20, color: 'white'},
          }}>
          Session Started :{' '}
          {hours > 0 &&
            hours.toLocaleString('en-US', {
              minimumIntegerDigits: 2,
              useGrouping: false,
            })}
          {minutes.toLocaleString('en-US', {
            minimumIntegerDigits: 2,
            useGrouping: false,
          })}
          :
          {seconds.toLocaleString('en-US', {
            minimumIntegerDigits: 2,
            useGrouping: false,
          })}
        </NoticeBar>
      )}
      <Content>
        <Text>Home</Text>
      </Content>
    </Container>
  );
}

const Container = styled.View`
  flex: 1;
  color: #000;
`;

const Content = styled.View`
  display: flex;
`;
