import {createSlice, PayloadAction} from '@reduxjs/toolkit';

// TODO Add more fields on device
interface SessionData {
  sessionId?: string;
  isRecording?: boolean;
  startTime?: number;
  endTime?: number;
  // isSyncedSB: boolean;
  // isSyncedDevice: boolean;
  // SBId?: string;
}

export interface BleData {
  sessionRecording: boolean;
  pastSessions: SessionData[];
  runningSession?: SessionData;
  txSessionData: string;
  txProgress: number;
  isTransmitScreen: boolean;
}

const initialState: BleData = {
  pastSessions: [],
  sessionRecording: false,
  txSessionData: '',
  txProgress: 0,
  isTransmitScreen: false,
};

export const bleDataSlice = createSlice({
  name: 'bleData',
  initialState,
  reducers: {
    onSessionStatus: (state, action: PayloadAction<{value: string}>) => {
      if (action.payload.value.includes('true')) {
        // new session
        return {
          ...state,
          sessionRecording: true,
          runningSession: {
            ...state.runningSession,
            isRecording: true,
            endTime: undefined,
          },
        };
      } else {
        return {
          ...state,
          sessionRecording: false,
          runningSession: {
            ...state.runningSession,
            isRecording: false,
          },
        };
        // end session
      }
    },
    onSessionStartTime: (state, action: PayloadAction<{value: string}>) => {
      const time = Number.parseInt(action.payload.value, 10);
      return {
        ...state,
        runningSession: {
          ...state.runningSession,
          startTime: time,
          endTime: undefined,
        },
      };
    },
    onSessionEndTime: (state, action: PayloadAction<{value: string}>) => {
      const time = Number.parseInt(action.payload.value, 10);
      return {
        ...state,
        runningSession: {
          ...state.runningSession,
          endTime: time,
        },
      };
    },
    onSessionId: (state, action: PayloadAction<{value: string}>) => {
      return {
        ...state,
        runningSession: {
          ...state.runningSession,
          sessionId: action.payload.value,
        },
      };
    },
    onSerialData: (state, action: PayloadAction<{value: string}>) => {
      return {
        ...state,
        txSessionData: state.txSessionData.concat(action.payload.value),
      };
    },
    resetSerialData: state => {
      return {
        ...state,
        txProgress: 0,
        txSessionData: '',
        isTransmitScreen: false,
      };
    },
    onSerialProgress: (state, action: PayloadAction<{value: string}>) => {
      const progress = parseInt(action.payload.value, 10);
      return {
        ...state,
        txProgress: progress,
        isTransmitScreen: progress !== 100,
      };
    },
  },
});

export const {
  onSessionStatus,
  onSessionStartTime,
  onSessionEndTime,
  onSessionId,
  onSerialData,
  onSerialProgress,
  resetSerialData,
} = bleDataSlice.actions;

export default bleDataSlice.reducer;
