import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {Peripheral, PeripheralInfo} from 'react-native-ble-manager';
import {
  connectDeviceBle,
  retrieveServicesBle,
  searchDevicesBle,
} from '../../util/bluetooth';

export type Device = Peripheral & {
  connected: boolean;
  peripheralInfo?: PeripheralInfo;
};

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
    return searchDevicesBle(deviceServiceUUID);
  },
);

export const connectDevice = createAsyncThunk(
  'bluetooth/connectDevice',
  async (peripheral: Device, {dispatch}) => {
    const result = await connectDeviceBle(peripheral.id);
    dispatch(retrieveDeviceServices(peripheral.id));
    return result;
  },
);

export const retrieveDeviceServices = createAsyncThunk(
  'bluetooth/retrieveServices',
  async (peripheralId: string) => {
    return retrieveServicesBle(peripheralId);
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
    builder.addCase(retrieveDeviceServices.pending, state => {
      return {
        ...state,
        isLoading: true,
      };
    });
    builder.addCase(retrieveDeviceServices.fulfilled, (state, action) => {
      console.log('retrieve', action);
      if (state.connectedDevice && action.payload) {
        return {
          ...state,
          connectedDevice: {
            ...state.connectedDevice,
            peripheralInfo: action.payload,
          },
        };
      }
      return {...state, isLoading: false};
    });
    builder.addCase(retrieveDeviceServices.rejected, (state, action) => {
      return {
        ...state,
        isLoading: false,
        error: action.error,
      };
    });
  },
});

export const {foundDevice, deviceDisconnected, scanDevicesEnd} =
  bluetoothSlice.actions;

export default bluetoothSlice.reducer;
