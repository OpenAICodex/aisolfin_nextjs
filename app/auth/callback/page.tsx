"use client";
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

export default function AuthCallback() {
  const router = useRouter();
  const params = useSearchParams();
  useEffect(() => {
    // After the user clicks the magic link in their email Supabase will
    // redirect back to this page. Depending on the auth flow, the
    // parameters will differ:
    //   • PKCE flow: ?code=<auth_code>
    //   • Implicit flow: #access_token=<...>&refresh_token=<...>
    // For PKCE we need to exchange the code for a session. For the
    // implicit flow the supabase-js client automatically processes the
    // fragment and persists the tokens to local storage. In either case
    // we can safely redirect to the home page once the session is
    // available (or after the exchange completes).
    const finalizeAuth = async () => {
      const code = params.get('code');
      if (code) {
        // When using the PKCE flow the auth code is returned in the URL. We
        // must exchange it for a session and then call getSession() to
        // persist the resulting tokens into the cookie store. Without
        // getSession() the tokens may only be set on the client instance and
        // won't be available to server components.
        const { error } = await supabaseBrowser.auth.exchangeCodeForSession(code);
        if (error) {
          console.error(error);
        }
        try {
          await supabaseBrowser.auth.getSession();
        } catch (err) {
          console.warn('Failed to persist session after code exchange', err);
        }
      } else {
        // When using the implicit flow, the tokens are placed in the URL
        // fragment. The Supabase client automatically detects and saves
        // these tokens, but we await getSession() to ensure that the
        // asynchronous parsing has completed. We ignore the result here
        // because the session information is persisted internally.
        try {
          await supabaseBrowser.auth.getSession();
        } catch (err) {
          console.warn('Unable to get session after implicit sign in', err);
        }
      }
      // Whether or not there was an error, send the user to the home page.
      router.replace('/');
    };
    finalizeAuth();
  }, [params, router]);
  return <p className="p-4">Anmeldung wird abgeschlossen…</p>;
}