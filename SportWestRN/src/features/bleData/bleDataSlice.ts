import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {convertString} from 'convert-string';

// TODO Add more fields on device
interface SessionData {
  // sessionId: string;
  isRecording: boolean;
  // startTime: Date;
  // endTime?: Date;
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
    onSessionNotify: (
      state,
      action: PayloadAction<{
        value: any;
      }>,
    ) => {
      const data = convertString.bytesToString(action.payload.value);
      if (data === 'true') {
        return {
          ...state,
          runningSession: {
            ...state.runningSession,
            isRecording: data === 'true',
          },
        };
      } else {
        return {
          ...state,
          runningSession: undefined,
        };
      }
    },
  },
});

export const {} = bleDataSlice.actions;

export default bleDataSlice.reducer;
