import React from 'react';
import styled from 'styled-components/native';
import BaseMessageScreen from './BaseMessage.Screen';

export default function StartSessionScreen() {
  return (
    <Wrapper>
      <BaseMessageScreen
        heading="Start a Session"
        subHeading="Start a Training session/ Match to get started."
        actionType="single"
        actionText="Start"
        actionProps={{}}
      />
    </Wrapper>
  );
}

const Wrapper = styled.View`
  flex: 1;
  color: #000;
`;
