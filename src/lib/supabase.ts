import { createClient } from '@supabase/supabase-js';

// Pastikan kamu membuat file .env.local nanti
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
