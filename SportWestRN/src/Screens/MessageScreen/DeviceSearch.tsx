import {BottomSheetFlatList} from '@gorhom/bottom-sheet';
import React, {useCallback, useEffect, useMemo} from 'react';
import {StyleSheet} from 'react-native';
import styled from 'styled-components/native';
import {useBLEContext} from '../../State/BLEContext';
import BleManager from 'react-native-ble-manager';

export default function DeviceSearch() {
  const {state, dispatch} = useBLEContext();

  const data = useMemo(
    () =>
      state?.devices?.map(dev => {
        return {
          id: dev.id,
          name: dev.name,
          RSSI: dev.rssi,
          advertising: dev.advertising,
        };
      }),
    [state],
  );

  console.log(state);

  const handleBleScan = () => {
    // display the Activityindicator
    dispatch!({type: 'scan'});

    // scan devices
    if (!state?.isLoading) {
      BleManager.scan([], 5, true)
        .then(result => {
          console.log('scan', result);
          dispatch!({type: 'scan'});
        })
        .catch(err => {
          dispatch!({type: 'fail', error: err});
        });
    }
  };

  // callbacks
  const handleRefresh = () => {
    handleBleScan();
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
