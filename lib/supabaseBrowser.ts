import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

// In the browser we must use the public (anon) key. These environment
// variables are exposed via NEXT_PUBLIC_ prefixes. When missing the
// application will throw at runtime.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables.');
}

// Create a Supabase browser client using the `@supabase/ssr` helper. This
// helper uses the PKCE flow by default and persists the session in
// cookies instead of localStorage, enabling server-side rendering
// support. It also automatically exchanges the auth code returned via
// the query string for a session and manages cookie storage. When
// environment variables are missing, an error is thrown to surface
// misconfiguration early.
export const supabaseBrowser = (() => {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables.');
  }
  return createBrowserClient<Database>(supabaseUrl, supabaseKey);
})();