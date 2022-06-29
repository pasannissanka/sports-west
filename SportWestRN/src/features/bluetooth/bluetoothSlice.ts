import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {Peripheral} from 'react-native-ble-manager';
import {connectDeviceBle, searchDevicesBle} from '../../util/bluetooth';

export type Device = Peripheral & {connected: boolean};

const initialState: {
  isLoading: boolean;
  error?: any;
  devices: Device[];
  connectedDevice?: Device;
} = {
  isLoading: false,
  devices: [],
};

export const scanDevices = createAsyncThunk(
  'bluetooth/scanDevices',
  async (deviceServiceUUID: string) => {
    return await searchDevicesBle(deviceServiceUUID);
  },
);

export const connectDevice = createAsyncThunk(
  'bluetooth/connectDevice',
  async (peripheral: Device) => {
    await connectDeviceBle(peripheral.id);
  },
);

export const bluetoothSlice = createSlice({
  name: 'bluetooth',
  initialState,
  reducers: {
    foundDevice: (state, action: PayloadAction<Device>) => {
      if (
        action.payload &&
        !state.devices.find(dev => dev.id === action.payload.id)
      ) {
        return {
          ...state,
          devices: [...state.devices, action.payload],
        };
      }
      return state;
    },
    deviceDisconnected: () => {
      return initialState;
    },
    scanDevicesEnd: state => {
      return {
        ...state,
        isLoading: false,
      };
    },
  },
  extraReducers(builder) {
    builder.addCase(scanDevices.pending, state => {
      return {
        ...state,
        isLoading: true,
        devices: [],
      };
    });
    builder.addCase(scanDevices.rejected, (state, {payload}) => {
      return {
        ...state,
        error: payload,
        isLoading: true,
      };
    });

    builder.addCase(
      connectDevice.fulfilled,
      (
        state,
        action: PayloadAction<
          void,
          string,
          {arg: Device; requestId: string; requestStatus: 'fulfilled'},
          never
        >,
      ) => {
        console.log(action, 'connected device');
        return {
          ...state,
          isLoading: false,
          connectedDevice: action.meta.arg,
        };
      },
    );
    builder.addCase(connectDevice.pending, state => {
      return {
        ...state,
        isLoading: true,
      };
    });
    builder.addCase(connectDevice.rejected, (state, {payload}) => {
      return {
        ...state,
        error: payload,
        isLoading: true,
      };
    });
  },
});

export const {foundDevice, deviceDisconnected, scanDevicesEnd} =
  bluetoothSlice.actions;

export default bluetoothSlice.reducer;
