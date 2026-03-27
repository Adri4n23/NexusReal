import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

// --- DEBUGGING ---
console.log("[DEBUG] Supabase URL:", supabaseUrl);
console.log("[DEBUG] Supabase Key Loaded:", supabaseKey ? 'Yes' : 'No! Check .env file');
// --- END DEBUGGING ---

export const supabase = createClient(supabaseUrl, supabaseKey);