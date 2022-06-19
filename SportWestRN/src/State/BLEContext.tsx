import React from 'react';
import {Device} from 'react-native-ble-plx';
import {ContextState, ReducerAction, ReducerState} from './types';

export const BLEInitState: ReducerState<Device> = {
  isLoading: false,
};

export const BLEContextReducer = (
  state: ReducerState<Device>,
  action: ReducerAction<Device>,
): ReducerState<Device> => {
  switch (action.type) {
    case 'scan':
      return {
        isLoading: true,
        connectedDevice: state.connectedDevice,
        devices: [],
      };
    case 'scan_end':
      return {
        ...state,
        isLoading: false,
      };
    case 'add_device':
      if (
        action.device &&
        !state.devices?.find(dev => dev.id === action.device.id)
      ) {
        return {
          ...state,
          isLoading: false,
          devices: [...(state.devices || []), action.device],
        };
      }
      return {
        ...state,
        isLoading: false,
      };
    case 'clear':
      return {
        isLoading: false,
        devices: [],
      };
    case 'connect_device':
      if (
        action.device &&
        state.devices?.find(dev => dev.id === action.device.id)
      ) {
        return {
          ...state,
          isLoading: false,
          connectedDevice: action.device,
        };
      }
      return {
        ...state,
        isLoading: false,
      };
    case 'fail':
      return {
        ...state,
        isLoading: false,
        error: action.error,
      };
    default:
      return {
        ...state,
      };
  }
};

export const BLEContext = React.createContext<ContextState<Device>>({
  dispatch: null,
  state: null,
});

export const useBLEContext = () => React.useContext(BLEContext);
