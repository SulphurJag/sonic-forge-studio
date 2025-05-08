
import { createClient } from '@supabase/supabase-js';

// Try to get Supabase credentials from environment variables or localStorage
let supabaseUrl = '';
let supabaseAnonKey = '';

// Check environment variables first
if (typeof import.meta !== 'undefined') {
  supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
}

// Fall back to localStorage if environment variables aren't set
if (!supabaseUrl && typeof window !== 'undefined') {
  supabaseUrl = localStorage.getItem('VITE_SUPABASE_URL') || '';
}

if (!supabaseAnonKey && typeof window !== 'undefined') {
  supabaseAnonKey = localStorage.getItem('VITE_SUPABASE_ANON_KEY') || '';
}

// Create a supabase client, which will be null if credentials are missing
export const supabase = (supabaseUrl && supabaseAnonKey) 
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
