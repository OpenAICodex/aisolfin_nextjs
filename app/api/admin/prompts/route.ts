import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServerClient';
import { createServerSupabaseClient } from '@/server/supabase';

/**
 * API route for managing system prompts.  Admins can fetch and update
 * the stored prompts used for the compliance, business value and tools
 * analyses.  The prompts are stored as a JSON object in the
 * `admin_settings` table under the `prompts` column.  Only users with
 * the 'admin' role may access or modify these values.  The route
 * responds with a 401 when unauthenticated and 403 when the caller is
 * not an admin.
 */

export async function GET() {
  const supabase = createSupabaseServerClient();
  // Ensure the user is authenticated
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  // Fetch existing prompts
  const { data: settings, error } = await supabase
    .from('admin_settings')
    .select('prompts')
    .eq('id', 1)
    .single();
  if (error || !settings) {
    return NextResponse.json({ error: 'Failed to load prompts' }, { status: 500 });
  }
  return NextResponse.json(settings.prompts ?? {});
}

export async function POST(req: NextRequest) {
  const supabaseUser = createSupabaseServerClient();
  // Authenticate the user
  const {
    data: { user }
  } = await supabaseUser.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  // Check role
  const { data: profile } = await supabaseUser
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  // Parse request body
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  // Validate expected fields
  const {
    compliancePrompt,
    businessPrompt,
    toolsPrompt
  } = body as { compliancePrompt?: string; businessPrompt?: string; toolsPrompt?: string };
  if (
    typeof compliancePrompt !== 'string' ||
    typeof businessPrompt !== 'string' ||
    typeof toolsPrompt !== 'string'
  ) {
    return NextResponse.json({ error: 'Missing or invalid prompt fields' }, { status: 400 });
  }
  // Build the new prompts object
  const newPrompts = {
    compliance: compliancePrompt,
    businessValue: businessPrompt,
    toolsAutomation: toolsPrompt
  };
  // Use a service client to bypass RLS on admin_settings if the service key is available
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createServerSupabaseClient()
    : supabaseUser;
  const { error: updateError } = await supabase
    .from('admin_settings')
    .update({ prompts: newPrompts })
    .eq('id', 1);
  if (updateError) {
    return NextResponse.json({ error: 'Failed to update prompts' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}