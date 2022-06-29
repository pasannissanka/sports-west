import BleManager from 'react-native-ble-manager';

export const searchDevicesBle = async (deviceServiceUUID: string) => {
  return BleManager.scan([deviceServiceUUID], 5, true);
};

export const connectDeviceBle = async (deviceUUID: string) => {
  return BleManager.connect(deviceUUID);
};
