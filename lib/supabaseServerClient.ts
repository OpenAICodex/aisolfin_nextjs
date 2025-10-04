import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/**
 * Creates a Supabase client scoped to the current Next.js request using the
 * `@supabase/ssr` package. This client reads and writes cookies via the
 * `next/headers` cookie store, enabling server-side authenticated requests
 * without relying on the deprecated `auth-helpers-nextjs` package. When used
 * inside a server component or API route, the cookie methods gracefully
 * handle the absence of a mutable cookie store by catching any set/delete
 * errors. Note that tokens must already be present in cookies for
 * `supabase.auth.getUser()` to succeed.
 */
export const createSupabaseServerClient = (): SupabaseClient<Database> => {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error('Supabase environment variables are not configured');
  }
  return createServerClient<Database>(url, anon, {
    cookies: {
      /**
       * Returns all cookies available in the current request. Supabase uses
       * this to read the `sb-access-token` and `sb-refresh-token` values.
       */
      getAll() {
        return cookieStore.getAll().map(({ name, value }) => ({ name, value }));
      },
      /**
       * Writes multiple cookies back to the response. When running in a
       * server component `cookies.set()` is not allowed, so any errors are
       * caught silently. In an API route the cookie methods mutate the
       * underlying response headers as expected.
       */
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            // @ts-ignore – the options type comes from @supabase/ssr and is
            // compatible with Next.js's CookieOptions.
            cookieStore.set(name, value, options);
          });
        } catch {
          // When called from a Server Component, cookieStore.set() will throw.
          // This is benign because cookies are ultimately set by middleware.
        }
      }
    }
  });
};