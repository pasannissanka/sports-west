import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import Papa from 'papaparse';
import {RootState} from '../../store';
import {
  Recording,
  RecordingData,
  SBSessionData,
  Session,
  supabase,
  testString,
} from '../../util/supabase';

// TODO Add more fields on device
interface SessionData {
  sessionId?: string;
  isRecording?: boolean;
  startTime?: number;
  endTime?: number;
  isSyncedSupa?: boolean;
  isSyncedDevice?: boolean;
  // SBId?: string;
}

export interface BleData {
  sessionRecording: boolean;
  runningSession?: SessionData;
  txSessionData: string;
  txProgress: number;
  isTransmitScreen: boolean;
  pastSessions: SBSessionData[];
  error?: any;
  sessionState: 'sessionRunning' | 'stopped' | 'idle';
  syncState: 'receivingDevice' | 'syncingCloud' | 'idle';
}

const initialState: BleData = {
  sessionRecording: false,
  txSessionData: '',
  txProgress: 0,
  isTransmitScreen: false,
  pastSessions: [],
  sessionState: 'idle',
  syncState: 'idle',
};

export const syncSupabase = createAsyncThunk<
  SBSessionData,
  void,
  {state: RootState}
>('supabase/sync', async (_, {getState}) => {
  const {bleData} = getState();
  const {txSessionData, runningSession} = bleData;
  const sessionData = Papa.parse<RecordingData>(txSessionData, {
    header: true,
    delimiter: ',',
    newline: '\r\n',
    dynamicTyping: true,
  });

  console.log(sessionData.data);
  const data = sessionData.data;

  if (sessionData.data.length === 0) {
    console.log(sessionData.errors);
    throw new Error('Session data parse error');
  }

  const sessions = await supabase
    .from<Session>('sessions')
    .insert({
      start_time: runningSession?.startTime
        ? new Date(runningSession?.startTime * 1000).toISOString()
        : new Date().toISOString(),
      end_time: runningSession?.endTime
        ? new Date(runningSession?.endTime * 1000).toISOString()
        : new Date().toISOString(),
      epoch: runningSession?.sessionId
        ? parseInt(runningSession?.sessionId, 10)
        : 0,
    })
    .single();

  const records = await supabase
    .from<Recording>('recordings')
    .insert(data.slice(0, -1));

  if (records.data && sessions.data) {
    await supabase.from('session_recordings').insert(
      records.data.map(v => {
        return {
          recording_id: v.id,
          session_id: sessions.data.id,
        };
      }),
    );
    return {
      records: records.data,
      session: sessions.data,
    };
  } else {
    throw new Error('SupabaseError: Data not found');
  }
});

export const bleDataSlice = createSlice({
  name: 'bleData',
  initialState,
  reducers: {
    onSessionStatus: (state, action: PayloadAction<{value: string}>) => {
      if (action.payload.value.includes('true')) {
        // new session
        return {
          ...state,
          sessionState: 'sessionRunning',
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
          sessionState: 'stopped',
          sessionRecording: false,
          runningSession: {
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
          isSyncedDevice: false,
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
          isSyncedDevice: false,
        },
      };
    },
    onSessionId: (state, action: PayloadAction<{value: string}>) => {
      return {
        ...state,
        runningSession: {
          ...state.runningSession,
          sessionId: action.payload.value,
          isSyncedDevice: false,
        },
      };
    },
    onSerialData: (state, action: PayloadAction<{value: string}>) => {
      return {
        ...state,
        syncState: 'receivingDevice',
        txSessionData: state.txSessionData.concat(action.payload.value),
      };
    },
    resetSerialData: state => {
      return {
        ...state,
        syncState: 'idle',
        txProgress: 0,
        txSessionData: '',
        isTransmitScreen: false,
      };
    },
    onSerialProgress: (state, action: PayloadAction<{value: string}>) => {
      return {
        ...state,
        txProgress: action.payload.value.includes('false') ? 100 : 0,
        isTransmitScreen: true,
        runningSession: {
          ...state.runningSession,
          isSyncedDevice: action.payload.value.includes('false'),
        },
      };
    },
    exitTransmitScreen: state => {
      return {
        ...state,
        syncState: 'idle',
        isTransmitScreen: false,
      };
    },
  },
  extraReducers(builder) {
    builder.addCase(syncSupabase.fulfilled, (state, action) => {
      return {
        ...state,
        syncState: 'idle',
        pastSessions: [...state.pastSessions, action.payload],
        txSessionData: '',
        txProgress: 0,
        runningSession: undefined,
      };
    });
    builder.addCase(syncSupabase.pending, state => {
      return {
        ...state,
        syncState: 'syncingCloud',
        isTransmitScreen: true,
      };
    });
    builder.addCase(syncSupabase.rejected, state => {
      return {
        ...state,
        syncState: 'idle',
        error: 'Sync failed',
      };
    });
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
  exitTransmitScreen,
} = bleDataSlice.actions;

export default bleDataSlice.reducer;
