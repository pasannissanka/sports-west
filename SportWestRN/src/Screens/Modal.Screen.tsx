import {Progress} from '@ant-design/react-native';
import {useNavigation} from '@react-navigation/native';
import React from 'react';
import styled from 'styled-components/native';
import BaseMessageScreen from '../Components/MessageScreen/BaseMessage.Screen';

export default function ModalScreen() {
  const navigation = useNavigation();
  return (
    <BaseMessageScreen
      heading="Uploading Session Data"
      subHeading="Please wait untill session data synced between devices"
      actionType="children"
      action={
        <ProgressWrapper>
          <Progress position="normal" percent={20} />
        </ProgressWrapper>
      }
    />
  );
}

const ProgressWrapper = styled.View`
  display: flex;
  height: 4px;
  flex-direction: row;
  margin: 0 20%;
`;
