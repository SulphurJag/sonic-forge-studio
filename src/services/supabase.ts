
import { createClient } from '@supabase/supabase-js';

// Set default Supabase credentials
let supabaseUrl = 'https://frftshhvidkpdqtehmha.supabase.co';
let supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyZnRzaGh2aWRrcGRxdGVobWhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2ODA5MjIsImV4cCI6MjA2MjI1NjkyMn0.IgqWOqxm9Wbjyh3bYNWwLMPIf0JqRRXZPcGP2ot59Mo';

// Check environment variables if they exist (override defaults)
if (typeof import.meta !== 'undefined') {
  supabaseUrl = import.meta.env.VITE_SUPABASE_URL || supabaseUrl;
  supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || supabaseAnonKey;
}

// Check localStorage if set (override defaults and environment variables)
if (typeof window !== 'undefined') {
  const storedUrl = localStorage.getItem('VITE_SUPABASE_URL');
  const storedKey = localStorage.getItem('VITE_SUPABASE_ANON_KEY');
  
  if (storedUrl) supabaseUrl = storedUrl;
  if (storedKey) supabaseAnonKey = storedKey;
}

// Create a supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseAnonKey && !!supabase;
};

// Helper function to check if the database schema is set up
export const checkDatabaseSchema = async () => {
  try {
    if (!isSupabaseConfigured()) {
      return { isSetup: false, error: 'Supabase not configured' };
    }
    
    // Try to query the processing_jobs table
    const { data, error } = await supabase
      .from('processing_jobs')
      .select('id')
      .limit(1);
      
    if (error) {
      return { isSetup: false, error: error.message };
    }
    
    return { isSetup: true, error: null };
  } catch (error) {
    return { 
      isSetup: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Type for audio processing job
export type ProcessingJob = {
  id?: string;
  created_at?: string;
  updated_at?: string;
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
