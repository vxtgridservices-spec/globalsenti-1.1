import { createClient } from '@supabase/supabase-js';

// Use runtime config if available, otherwise fallback to build-time env
const supabaseUrl = (window as any).APP_CONFIG?.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || 'https://kgcrojvuyzijlgoqpzmt.supabase.co';
const supabaseAnonKey = (window as any).APP_CONFIG?.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_EaTeSS7wj1_f27mqIce1sg_e8oAP8T1';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Disable the use of Navigator Lock API if it's causing issues in this environment
    // Use a custom lock implementation or set it to null to avoid the "stolen lock" errors
    storageKey: 'sentinel-secure-session-v1'
  }
});
