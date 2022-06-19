import {BottomSheetFlatList} from '@gorhom/bottom-sheet';
import React, {useCallback, useMemo} from 'react';
import {StyleSheet} from 'react-native';
import styled from 'styled-components/native';
import {BLEmanager} from '../../App';
import {useBLEContext} from '../../State/BLEContext';

export default function DeviceSearch() {
  const {state, dispatch} = useBLEContext();

  const data = useMemo(
    () =>
      state?.devices?.map(dev => {
        return {
          id: dev.id,
          name: dev.name,
          RSSI: dev.rssi,
          UUIDS: dev.serviceUUIDs,
          serviceData: dev.serviceData,
          manufacture: dev.manufacturerData?.replace(/[=]/g, ''),
        };
      }),
    [state],
  );

  console.log(state);

  const scanDevices = () => {
    // display the Activityindicator
    dispatch!({type: 'scan'});

    // scan devices
    BLEmanager.startDeviceScan(null, null, (error, scannedDevice) => {
      if (error) {
        console.warn(error);
        dispatch!({type: 'fail', error: error.message});
        return;
      }

      // if a device is detected add the device to the list by dispatching the action into the reducer
      if (scannedDevice) {
        console.log(scannedDevice);
        dispatch!({type: 'add_device', device: scannedDevice});
      }
    });

    // stop scanning devices after 5 seconds
    setTimeout(() => {
      dispatch!({type: 'scan_end'});
      BLEmanager.stopDeviceScan();
    }, 10000);
  };

  // callbacks
  const handleRefresh = () => {
    scanDevices();
  };

  const renderItem = useCallback(
    ({item}) => (
      <ItemContainer>
        <StyledText>
          {item.id} - {item.name}
        </StyledText>
      </ItemContainer>
    ),
    [],
  );

  return (
    <Container>
      <BottomSheetFlatList
        data={data}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.contentContainer}
        refreshing={state?.isLoading}
        onRefresh={handleRefresh}
      />
    </Container>
  );
}

const Container = styled.View`
  flex: 1;
  /* align-items: center; */
  width: 100%;
`;

const StyledText = styled.Text`
  color: #000000;
`;

const ItemContainer = styled.View`
  padding: 6px;
  margin: 6px;
`;

const styles = StyleSheet.create({
  contentContainer: {
    backgroundColor: 'white',
  },
});
