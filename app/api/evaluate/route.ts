import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
// import { createServerSupabaseClient } from '@/server/supabase';
import { createSupabaseServerClient } from '@/lib/supabaseServerClient';
import { createServerSupabaseClient } from '@/server/supabase';
import { runCompliance } from '@/server/llm/compliance';
import { runBusinessValue } from '@/server/llm/businessValue';
import { runToolsAutomation } from '@/server/llm/toolsAutomation';

// Zod schema describing the expected shape of the request body. Additional
// fields will be ignored and missing required fields will result in a 400.
const RequestSchema = z.object({
  description: z.string().min(5),
  applications: z.string().optional().default(''),
  timeRequired: z.string(),
  frequency: z.string(),
  stakeholder: z.string()
});

export async function POST(req: NextRequest) {
  // Create a Supabase client bound to the current request cookies in order to
  // retrieve the currently authenticated user. This client injects access and
  // refresh tokens from cookies into the Authorization header so that
  // supabase.auth.getUser() can return the correct user.
  const supabaseUser = createSupabaseServerClient();
  // Create a service-level Supabase client if a service key is configured.
  // This client has elevated privileges to manage tables irrespective of
  // row-level security policies. If no service key is available the
  // returned client will fall back to the anonymous key and therefore
  // behave identically to supabaseUser.
  const supabaseService = createServerSupabaseClient();
  const {
    data: { user },
    error: userError
  } = await supabaseUser.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  // Choose which client to use for database writes. Prefer the
  // service-level client when a service key is available; otherwise
  // fallback to the user-scoped client. This ensures that profile
  // creation and evaluation inserts succeed even when the anonymous key
  // cannot bypass RLS policies on its own.
  const supabase = supabaseService ?? supabaseUser;
  // Ensure the authenticated user has a row in the profiles table. The
  // evaluations table enforces a foreign key to profiles.id, so inserting
  // an evaluation without a corresponding profile row will fail. Use a
  // service-level upsert to insert the profile if it does not exist.
  await supabase
    .from('profiles')
    .upsert({ id: user.id, email: user.email ?? null, role: 'user' }, { onConflict: 'id' });
  const body = await req.json();
  let input;
  try {
    input = RequestSchema.parse(body);
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request', details: err }, { status: 400 });
  }
  // Determine the start of the current day in Europe/Berlin. This ensures
  // rate limits reset at midnight Berlin time regardless of server locale.
  const now = new Date();
  const berlinTimeString = now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' });
  const berlinDate = new Date(berlinTimeString);
  const startOfDay = new Date(Date.UTC(berlinDate.getUTCFullYear(), berlinDate.getUTCMonth(), berlinDate.getUTCDate()));
  // Fetch the user's role. Default to 'user' when no profile row exists.
  const { data: profileRow, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  const role = profileError || !profileRow ? 'user' : profileRow.role;
  // Determine today's date in Europe/Berlin for rate limiting.  The
  // date column in rate_limits stores only the day (YYYY-MM-DD).  We
  // generate a string using the Berlin time zone to correctly reset at
  // midnight regardless of the server locale.
  const berlinDateString = berlinDate.toISOString().split('T')[0];
  // Non-admin users are subject to rate limits.  We first look up the
  // existing rate limit record.  If it does not exist or the stored
  // date is from a previous day we reset the count to zero.
  let currentCount = 0;
  if (role !== 'admin') {
    const { data: rateRow, error: rateError } = await supabase
      .from('rate_limits')
      .select('date, count')
      .eq('user_id', user.id)
      .single();
    if (!rateError && rateRow) {
      if (rateRow.date === berlinDateString) {
        currentCount = rateRow.count;
      } else {
        currentCount = 0;
      }
    }
    // If the user has reached the maximum number of evaluations for today,
    // return an HTTP 429 response indicating the quota has been exceeded.
    if (currentCount >= 3) {
      return NextResponse.json({ error: 'Daily quota exceeded' }, { status: 429 });
    }
  }
  try {
    // Execute the three LLM calls in parallel. If any call fails the
    // associated property will be undefined and an error will be logged.
    const [compliance, business, tools] = await Promise.all([
      runCompliance({ description: input.description }),
      runBusinessValue({
        timeRequired: input.timeRequired,
        frequency: input.frequency,
        stakeholder: input.stakeholder
      }),
      runToolsAutomation({ description: input.description, applications: input.applications })
    ]);
    const outputs = {
      compliance,
      businessValue: business,
      tools: tools
    };
    // Persist the evaluation for the user
    await supabase.from('evaluations').insert({
      user_id: user.id,
      input,
      outputs
    });
    // Update the rate limits table for non-admins.  If no record exists
    // this upsert will create one; otherwise it increments the count
    // accordingly and updates the date.  Using the service client
    // ensures the operation succeeds under RLS.  Note: the
    // conflict target is the primary key (user_id).
    if (role !== 'admin') {
      await supabase.from('rate_limits').upsert(
        { user_id: user.id, date: berlinDateString, count: currentCount + 1 },
        { onConflict: 'user_id' }
      );
    }
    return NextResponse.json(outputs);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Evaluation failed' }, { status: 500 });
  }
}