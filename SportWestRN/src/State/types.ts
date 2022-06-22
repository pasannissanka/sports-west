export type ReducerState<T> = {
  devices?: T[];
  connectedDevice?: T;
  isLoading: boolean;
  error?: string;
};

export type ReducerAction<T> =
  | {type: 'scan'}
  | {type: 'scan_end'}
  | {type: 'add_device'; device: T}
  | {type: 'clear'}
  | {type: 'fail'; error: string}
  | {type: 'connect_device'; device: T}
  | {type: 'device_disconnect'; device: T};

export interface ContextState<T> {
  state: ReducerState<T> | null;
  dispatch: React.Dispatch<BleStates<T>> | null;
}

export type BleStates<T> =
  | {
      type: 'init';
    }
  | {
      type: 'scan';
    }
  | {
      type: 'scan_success';
    }
  | {
      type: 'error';
      error: any;
    }
  | {
      type: 'device_found';
      device: T;
    }
  | {
      type: 'connect';
    }
  | {
      type: 'connected';
      device: T;
    }
  | {
      type: 'disconnected';
    };
