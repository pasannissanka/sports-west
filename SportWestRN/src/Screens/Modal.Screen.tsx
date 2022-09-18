import {Progress} from '@ant-design/react-native';
import {useNavigation} from '@react-navigation/native';
import React, {useEffect} from 'react';
import styled from 'styled-components/native';
import BaseMessageScreen from '../Components/MessageScreen/BaseMessage.Screen';
import {
  exitTransmitScreen,
  syncSupabase,
} from '../features/bleData/bleDataSlice';
import {useAppDispatch, useAppSelector} from '../hooks/reduxHooks';

export default function ModalScreen() {
  const bleDataState = useAppSelector(state => state.bleData);
  const navigation = useNavigation();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (
      bleDataState.txProgress === 100 &&
      bleDataState.txSessionData.length > 0
    ) {
      dispatch(syncSupabase());
    }
  }, [bleDataState.txProgress, bleDataState.txSessionData, dispatch]);

  console.log(bleDataState);

  return (
    <>
      {bleDataState.syncState === 'idle' ? (
        <BaseMessageScreen
          heading="Successful"
          subHeading="Session data sync completed"
          actionType="single"
          actionText="Close"
          actionProps={{
            type: 'ghost',
            onPress: () => {
              dispatch(exitTransmitScreen());
              navigation.navigate('HomePage');
            },
          }}
        />
      ) : (
        <BaseMessageScreen
          heading="Uploading Session Data"
          subHeading="Please wait until session data synced between devices"
          actionType="children"
          action={
            <ProgressWrapper>
              <Progress position="normal" percent={20} />
            </ProgressWrapper>
          }
        />
      )}
    </>
  );
}

const ProgressWrapper = styled.View`
  display: flex;
  height: 4px;
  flex-direction: row;
  margin: 0 20%;
`;
