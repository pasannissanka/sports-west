import BleManager from 'react-native-ble-manager';

export const searchDevicesBle = async (deviceServiceUUID: string) => {
  return BleManager.scan([deviceServiceUUID], 5, true);
};

export const connectDeviceBle = async (deviceUUID: string) => {
  return BleManager.connect(deviceUUID);
};

export const retrieveServicesBle = async (peripheralId: string) => {
  return BleManager.retrieveServices(peripheralId);
};

export const writeDataBle = async (
  peripheralId: string,
  serviceUUID: string,
  characteristicUUID: string,
  data: string,
) => {
  const dataBytes = convertStringToByteArray(data);

  return BleManager.write(
    peripheralId,
    serviceUUID,
    characteristicUUID,
    dataBytes,
  );
};

export const readDataBle = async (
  peripheralId: string,
  serviceUUID: string,
  characteristicUUID: string,
) => {
  const dataBytes = await BleManager.read(
    peripheralId,
    serviceUUID,
    characteristicUUID,
  );
  const buffer = Buffer.from(dataBytes);
  return buffer.readUInt8(1);
};

export const startNotificationBle = async (
  peripheralId: string,
  serviceUUID: string,
  characteristicUUID: string,
) => {
  return BleManager.startNotification(
    peripheralId,
    serviceUUID,
    characteristicUUID,
  );
};

// Custom method to convert string to byte array
function convertStringToByteArray(str: any) {
  // eslint-disable-next-line no-extend-native
  String.prototype.encodeHex = function () {
    var bytes = [];
    for (var i = 0; i < this.length; ++i) {
      bytes.push(this.charCodeAt(i));
    }
    return bytes;
  };

  var byteArray = str.encodeHex();
  return byteArray;
}
