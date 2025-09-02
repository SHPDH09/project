import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database Tables
export const TABLES = {
  USERS: 'users',
  USER_SESSIONS: 'user_sessions',
  PASSWORD_RESETS: 'password_resets',
  SERVICE_SETTINGS: 'service_settings',
  USER_ANALYTICS: 'user_analytics',
  NOTIFICATIONS: 'notifications'
} as const;