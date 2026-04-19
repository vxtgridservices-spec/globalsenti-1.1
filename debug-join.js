import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kgcrojvuyzijlgoqpzmt.supabase.co';
const supabaseAnonKey = 'sb_publishable_EaTeSS7wj1_f27mqIce1sg_e8oAP8T1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debug() {
  const requestId = '00d94726-dfff-4d1f-b6b4-6eb71bf05652';
  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (error) {
    console.error('Error fetching request:', error.message);
  } else {
    console.log('Request data:', JSON.stringify(data, null, 2));
  }
}

debug();
