import {SUPABASE_ANON_KEY, SUPABASE_URL} from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {createClient} from '@supabase/supabase-js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  localStorage: AsyncStorage as any,
  shouldThrowOnError: true,
});

export interface Session {
  id: number;
  created_at: Date;
  start_time: string;
  end_time: string;
  epoch: number;
}

export interface RecordingData {
  record_id: number;
  epoch: number;
  lat: number;
  lon: number;
  bpm: number;
}

export interface Recording extends RecordingData {
  id?: number;
  created_at?: Date;
}

export interface sessionRecording {
  session_id?: number;
  record_id?: number;
}

export interface SBSessionData {
  session: Session;
  records: RecordingData[];
}

export const testString =
  'record_id,epoch,lat,lon,bpm\r\n0,1657564161,0.00,0.00,237\r\n1,1657564166,0.00,0.00,232\r\n2,1657564171,0.00,0.00,233\r\n3,1657564176,0.00,0.00,234\r\n4,1657564181,0.00,0.00,237\r\n5,1657564186,0.00,0.00,233';
