import { createClient } from '@supabase/supabase-js';

// Use runtime config if available, otherwise fallback to build-time env
const supabaseUrl = (window as any).APP_CONFIG?.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || 'https://kgcrojvuyzijlgoqpzmt.supabase.co';
const supabaseAnonKey = (window as any).APP_CONFIG?.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_EaTeSS7wj1_f27mqIce1sg_e8oAP8T1';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
