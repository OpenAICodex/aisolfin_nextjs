import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabaseServerClient';

/**
 * User profile page. This server component fetches the currently logged‑in
 * user and their past evaluations from Supabase. If the user is not
 * authenticated it redirects to the login page. The evaluations list
 * includes the date of creation and a short summary of the business
 * value and compliance results when available. Clicking an entry will
 * navigate to a dedicated results view in the future – currently it
 * simply shows the stored JSON.
 */
export default async function ProfilePage() {
  const supabase = createSupabaseServerClient();
  // Retrieve the current user from the session. When no user is
  // present we return early and redirect to the login page. The
  // `getUser` call leverages the access token stored in the cookies.
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }
  // Fetch the authenticated user's past evaluations ordered by
  // descending creation time. The RLS policies defined in the
  // migrations ensure that a regular user can only see their own
  // evaluations. We select the creation timestamp and the outputs
  // JSON so that we can display a short summary in the UI.
  const { data: evaluations } = await supabase
    .from('evaluations')
    .select('id, created_at, outputs')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Profil</h2>
        {/* Button to return to the evaluation form/home page */}
        <a
          href="/"
          className="inline-flex items-center px-3 py-2 rounded-md border-2 border-black bg-gradient-to-r from-purple-600 to-purple-500 text-white font-medium hover:from-purple-700 hover:to-purple-600"
        >
          Neue Analyse
        </a>
      </div>
      <div className="p-4 border-4 border-black rounded-md bg-white shadow-lg">
        <p className="mb-2"><strong>E‑Mail:</strong> {user.email}</p>
        <p><strong>Gesamtanzahl Auswertungen:</strong> {evaluations?.length ?? 0}</p>
      </div>
      <div>
        <h3 className="text-2xl font-semibold mb-4">Vergangene Analysen</h3>
        {evaluations && evaluations.length > 0 ? (
          <ul className="space-y-4">
            {evaluations.map((ev) => {
              // Extract a friendly date string in the user's locale (Berlin).
              const date = new Date(ev.created_at);
              const formatted = date.toLocaleString('de-DE', {
                timeZone: 'Europe/Berlin',
                dateStyle: 'medium',
                timeStyle: 'short'
              });
              // Derive simple summaries from the evaluation outputs. Because
              // outputs are stored as JSON we must guard against
              // undefined values.
              let gdprStatus: string | undefined;
              let aiStatus: string | undefined;
              let score: number | undefined;
              if (ev.outputs) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                const out: any = ev.outputs;
                gdprStatus = out?.compliance?.gdpr_status ?? out?.compliance?.gdpr?.lawful_basis;
                aiStatus = out?.compliance?.ai_act_status ?? out?.compliance?.ai_act_tier;
                score = out?.businessValue?.score;
              }
              return (
                <li key={ev.id} className="p-4 border-2 border-black rounded-md bg-gray-50 hover:bg-gray-100 transition-colors">
                  <p className="font-medium">{formatted}</p>
                  <p className="text-sm text-gray-700">
                    GDPR: {gdprStatus ?? '–'}, AI Act: {aiStatus ?? '–'}, Business Value:{' '}
                    {typeof score === 'number' ? score.toFixed(0) : '–'}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-gray-600">Bisher wurden keine Analysen durchgeführt.</p>
        )}
      </div>
    </div>
  );
}