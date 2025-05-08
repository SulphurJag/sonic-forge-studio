
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with fallbacks for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Please set the environment variables.');
}

// Create a single supabase client for interacting with your database
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseAnonKey && !!supabase;
};

// Type for audio processing job
export type ProcessingJob = {
  id?: string;
  created_at?: string;
  user_id?: string;
  file_name: string;
  file_size: number;
  settings: {
    mode: string;
    targetLufs: number;
    dryWet: number;
    noiseReduction: number;
    beatQuantization: number;
    swingPreservation: boolean;
    preserveTempo: boolean;
    preserveTone: boolean;
    beatCorrectionMode: string;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result_url?: string;
  processing_time?: number;
  error_message?: string;
};
