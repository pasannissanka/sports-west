import {IconFill} from '@ant-design/icons-react-native';
import {Button} from '@ant-design/react-native';
import {BottomSheetFlatList} from '@gorhom/bottom-sheet';
import {NavigationContext} from '@react-navigation/native';
import React, {useCallback, useEffect, useMemo} from 'react';
import {StyleSheet} from 'react-native';
import BleManager, {Peripheral} from 'react-native-ble-manager';
import styled from 'styled-components/native';
import {useBLEContext} from '../../State/BLEContext';

export default function DeviceSearch() {
  const {state, dispatch} = useBLEContext();
  const navigation = React.useContext(NavigationContext);

  useEffect(() => {
    if (state?.connectedDevice) {
      navigation?.navigate('HomePage');
    }
  }, [navigation, state?.connectedDevice]);

  const data = useMemo(
    () =>
      state?.devices?.map(dev => {
        return {
          id: dev.id,
          name: dev.name,
          rssi: dev.rssi,
          advertising: dev.advertising,
        } as Peripheral;
      }),
    [state?.devices],
  );

  console.log(state);

  const handleBleScan = () => {
    // display the Activityindicator
    dispatch!({type: 'scan'});

    // scan devices
    if (!state?.isLoading) {
      const deviceServiceUUID = '08bfe3db-2297-466d-9453-c32f65eb5747';
      console.log(deviceServiceUUID);

      BleManager.scan([deviceServiceUUID], 5, true).catch(err => {
        dispatch!({type: 'error', error: err});
      });
    }
  };

  // callbacks
  const handleRefresh = () => {
    handleBleScan();
  };

  const handleConnect = (peripherial: Peripheral) => {
    dispatch!({type: 'connect'});
    BleManager.connect(peripherial.id)
      .then(() => {
        dispatch!({type: 'connected', device: peripherial});
      })
      .catch(err => {
        console.log(err);
        dispatch!({type: 'error', error: err});
      });
  };

  const renderItem = useCallback(
    ({item}: {item: Peripheral}) => (
      <ItemContainer>
        <DeviceButton activeOpacity={0.9}>
          <ImgWrapper>
            <Img source={require('../../../assets/t-shirt_front.png')} />
            {state?.connectedDevice?.id === item.id && (
              <SuccessIcon name="check-circle" size={35} color="#00C514" />
            )}
          </ImgWrapper>
          <StyledText>{item.name}</StyledText>
        </DeviceButton>
        {state?.connectedDevice?.id === item.id ? (
          <ConnectedText>Connected</ConnectedText>
        ) : (
          <ConnectButton onPress={() => handleConnect(item)} type="ghost">
            <ConnectText>Connect</ConnectText>
          </ConnectButton>
        )}
      </ItemContainer>
    ),
    [state?.connectedDevice],
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
  font-size: 20px;
`;

const DeviceButton = styled.TouchableOpacity`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const ImgWrapper = styled.View`
  position: relative;
`;

const Img = styled.Image`
  width: 180px;
  height: 180px;
  margin: 10px;
`;

const SuccessIcon = styled(IconFill)`
  position: absolute;
  bottom: 10px;
  right: 35px;
`;

const ItemContainer = styled.View`
  padding: 6px;
  margin: 6px;
  flex: 1;
  align-items: center;
`;

const ConnectButton = styled(Button)`
  height: 30px;
  margin: 10px 0;
`;

const ConnectText = styled.Text`
  font-size: 16px;
  color: #1677ff;
`;

const ConnectedText = styled.Text`
  font-size: 20px;
  color: #1677ff;
  margin: 15px 0;
`;

const styles = StyleSheet.create({
  contentContainer: {
    backgroundColor: 'white',
  },
});
