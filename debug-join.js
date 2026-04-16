import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kgcrojvuyzijlgoqpzmt.supabase.co';
const supabaseAnonKey = 'sb_publishable_EaTeSS7wj1_f27mqIce1sg_e8oAP8T1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debug() {
  const { data, error } = await supabase.from('deals').select('*, profiles(tier)').eq('status', 'Available').limit(1);
  if (error) {
    console.error('Error querying profiles:', error);
  } else {
    console.log('Success querying profiles:', JSON.stringify(data, null, 2));
  }
}

debug();
