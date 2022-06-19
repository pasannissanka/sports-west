import Button, {ButtonProps} from '@ant-design/react-native/lib/button';
import React from 'react';
import styled from 'styled-components/native';

const Container = styled.View`
  flex: 1;
  color: #000000;
`;

const MessagesWrapper = styled.View`
  flex: 1;
  top: 30%;
  align-items: center;
  flex-direction: column;
`;

const ActionWrapper = styled.View`
  flex: 1;
  flex-direction: column;
  margin-top: 35%;
  width: 30%;
`;

const HeadingText = styled.Text`
  color: #000000;
  font-size: 22px;
  text-align: center;
  padding: 10px 30px;
  line-height: 30px;
`;

const SubHeadingText = styled.Text`
  color: #6c6c6c;
  font-size: 17px;
  text-align: center;
  padding: 0px 20px;
  line-height: 20px;
`;

type MessageScreenProps = {
  heading: string;
  subHeading: string;
} & (
  | {
      actionType: 'single';
      actionText: string;
      actionProps: ButtonProps;
    }
  | {
      actionType: 'children';
      action: React.ReactNode;
    }
);

export default function BaseMessageScreen({
  heading,
  subHeading,
  ...props
}: MessageScreenProps) {
  return (
    <Container>
      <MessagesWrapper>
        <HeadingText>{heading}</HeadingText>
        <SubHeadingText>{subHeading}</SubHeadingText>
        <ActionWrapper>
          {props.actionType === 'single' ? (
            <Button {...props.actionProps}>{props.actionText}</Button>
          ) : (
            <>{props.action}</>
          )}
        </ActionWrapper>
      </MessagesWrapper>
    </Container>
  );
}
