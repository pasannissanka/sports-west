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
}

const initialState: BleData = {
  pastSessions: [],
  sessionRecording: false,
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
  },
});

export const {
  onSessionStatus,
  onSessionStartTime,
  onSessionEndTime,
  onSessionId,
} = bleDataSlice.actions;

export default bleDataSlice.reducer;