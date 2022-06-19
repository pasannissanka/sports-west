import {View, Text} from 'react-native';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import BottomSheet, {BottomSheetBackdrop} from '@gorhom/bottom-sheet';
import BaseMessageScreen from './BaseMessage.Screen';
import styled from 'styled-components/native';

export default function NoDevice() {
  const [isBSOpen, setIsBSOpen] = useState(false);
  // ref
  const bottomSheetRef = useRef<BottomSheet>(null);

  // variables
  const snapPoints = useMemo(() => ['20%', '30%', '40%', '50%'], []);

  // callbacks
  const handleSheetChanges = useCallback((index: number) => {
    console.log('handleSheetChanges', index);
    if (index === -1) {
      setIsBSOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isBSOpen) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isBSOpen]);

  const renderBackdrop = useCallback(
    props => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={0}
        appearsOnIndex={1}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <Wrapper>
      <BaseMessageScreen
        heading="No device connected"
        subHeading="Connect Sport Vest device to get started."
        actionType="single"
        actionText="Connect"
        actionProps={{
          type: 'primary',
          onPress: () => {
            setIsBSOpen(!isBSOpen);
          },
        }}
      />
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        enablePanDownToClose={true}
        enableOverDrag={true}
        onChange={handleSheetChanges}>
        <View style={{flex: 1, alignItems: 'center'}}>
          <Text>Awesome 🎉</Text>
        </View>
      </BottomSheet>
    </Wrapper>
  );
}

const Wrapper = styled.View`
  flex: 1;
  color: #000;
`;
