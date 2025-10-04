import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables must be provided in `.env.local` or through your hosting provider.
const supabaseUrl: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey: string | undefined = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !anonKey) {
  throw new Error('Supabase environment variables are missing. Check `.env.local`.');
}

/**
 * Creates a Supabase client that can be used on the server. When a service key is
 * available it will be used to enable privileged operations (e.g. inserting
 * embeddings). If not, the anonymous key is used.
 */
export const createServerSupabaseClient = (): SupabaseClient => {
  const key = serviceKey ?? anonKey;
  return createClient(supabaseUrl, key, {
    auth: {
      persistSession: false
    }
  });
};