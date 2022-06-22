import React from 'react';
import {Peripheral} from 'react-native-ble-manager';
import {BleStates, ContextState, ReducerState} from './types';

export const BLEInitState: ReducerState<Peripheral> = {
  isLoading: false,
};

export const BLEContextReducer = (
  state: ReducerState<Peripheral>,
  action: BleStates<Peripheral>,
): ReducerState<Peripheral> => {
  switch (action.type) {
    case 'init':
      return {
        isLoading: false,
      };
    case 'scan':
      return {
        isLoading: true,
      };
    case 'scan_success':
      return {
        ...state,
        isLoading: false,
      };
    case 'device_found':
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
    case 'connect':
      return {
        ...state,
        isLoading: true,
      };
    case 'connected':
      return {
        ...state,
        isLoading: false,
        connectedDevice: action.device,
      };
    case 'disconnected':
      return {
        isLoading: false,
      };
    case 'error':
      return {
        isLoading: false,
        error: action.error,
      };
    default:
      return {
        ...state,
      };
  }
};

export const BLEContext = React.createContext<ContextState<Peripheral>>({
  dispatch: null,
  state: null,
});

export const useBLEContext = () => React.useContext(BLEContext);
