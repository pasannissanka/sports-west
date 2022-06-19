import AntProvider from '@ant-design/react-native/lib/provider';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Text, View} from 'react-native';
import BaseMessageScreen from './MessageScreen/BaseMessage.Screen';
import BottomSheet, {BottomSheetBackdrop} from '@gorhom/bottom-sheet';

const HomeScreen = () => {
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
    <AntProvider>
      <View style={{flex: 1}}>
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
          index={0}
          snapPoints={snapPoints}
          backdropComponent={renderBackdrop}
          enablePanDownToClose={true}
          enableOverDrag={true}
          onChange={handleSheetChanges}>
          <View style={{flex: 1, alignItems: 'center'}}>
            <Text>Awesome 🎉</Text>
          </View>
        </BottomSheet>
      </View>
    </AntProvider>
  );
};

export default HomeScreen;

// Is Device connected?
// yes? - Is Past session data available?
//        yes? - PastSessionDetails
//        no?  - NoDataScreen
// no?  - NoConnectedDeviceScreen
