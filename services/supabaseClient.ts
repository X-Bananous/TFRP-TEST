import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY } from '../constants';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper to check if tables exist/mock data if they don't for the sake of the demo
// In a production environment, you would run SQL migrations.
export const checkConnection = async () => {
  try {
    const { error } = await supabase.from('characters').select('count', { count: 'exact', head: true });
    if (error) {
      console.warn("Supabase connection issue or table missing:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("Supabase connection failed", e);
    return false;
  }
};
