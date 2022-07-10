import {IconFill} from '@ant-design/icons-react-native';
import {Button} from '@ant-design/react-native';
import {BottomSheetFlatList} from '@gorhom/bottom-sheet';
import {NavigationContext} from '@react-navigation/native';
import React, {useCallback, useEffect, useMemo} from 'react';
import {StyleSheet} from 'react-native';
import {Peripheral} from 'react-native-ble-manager';
import styled from 'styled-components/native';
import {
  connectDevice,
  scanDevices,
} from '../../features/bluetooth/bluetoothSlice';
import {useAppDispatch, useAppSelector} from '../../hooks/reduxHooks';
import {SERVICE_UUID} from '@env';

export default function DeviceSearch() {
  const dispatch = useAppDispatch();
  const bluetoothState = useAppSelector(state => state.bluetooth);
  const navigation = React.useContext(NavigationContext);

  useEffect(() => {
    if (bluetoothState.connectedDevice) {
      navigation?.navigate('HomePage');
    }
  }, [navigation, bluetoothState.connectedDevice]);

  const data = useMemo(
    () =>
      bluetoothState.devices?.map(dev => {
        return {
          id: dev.id,
          name: dev.name,
          rssi: dev.rssi,
          advertising: dev.advertising,
        } as Peripheral;
      }),
    [bluetoothState.devices],
  );

  console.log(bluetoothState);

  const handleBleScan = () => {
    // display the Activityindicator

    // scan devices
    if (!bluetoothState.isLoading) {
      const deviceServiceUUID = SERVICE_UUID;
      dispatch(scanDevices(deviceServiceUUID));
    }
  };

  // callbacks
  const handleRefresh = () => {
    handleBleScan();
  };

  const handleConnect = (peripheral: Peripheral) => {
    dispatch(connectDevice({...peripheral, connected: false}));
  };

  const renderItem = useCallback(
    ({item}: {item: Peripheral}) => (
      <ItemContainer>
        <DeviceButton activeOpacity={0.9}>
          <ImgWrapper>
            <Img source={require('../../../assets/t-shirt_front.png')} />
            {bluetoothState?.connectedDevice?.id === item.id && (
              <SuccessIcon name="check-circle" size={35} color="#00C514" />
            )}
          </ImgWrapper>
          <StyledText>{item.name}</StyledText>
        </DeviceButton>
        {bluetoothState?.connectedDevice?.id === item.id ? (
          <ConnectedText>Connected</ConnectedText>
        ) : (
          <ConnectButton onPress={() => handleConnect(item)} type="ghost">
            <ConnectText>Connect</ConnectText>
          </ConnectButton>
        )}
      </ItemContainer>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bluetoothState.connectedDevice],
  );

  return (
    <Container>
      <BottomSheetFlatList
        data={data}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.contentContainer}
        refreshing={bluetoothState?.isLoading}
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
