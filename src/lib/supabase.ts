import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Selectable listing columns for general queries. Deliberately excludes
// precise_spot, which is restricted at the database level (see migration
// 0005) and must be fetched separately via the get_precise_spot RPC.
export const LISTING_COLUMNS =
  'id, seller_id, title, category, price, description, condition, image_urls, author, edition, module_code, faculty, power_type, meetup_location, status, created_at, updated_at';

