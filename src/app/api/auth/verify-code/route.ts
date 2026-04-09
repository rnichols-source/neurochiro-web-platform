import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  const { email, code, newPassword } = await request.json();

  if (!email || !code || !newPassword) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Find the most recent reset code for this email
  const { data: leads, error: queryError } = await supabase
    .from('leads')
    .select('metadata, created_at')
    .eq('email', email)
    .eq('source', 'password_reset_code')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log(`[VERIFY_CODE] Looking for code for ${email}, found ${leads?.length || 0} entries`);

  if (!leads || leads.length === 0) {
    // Try broader search in case source filter is too strict
    const { data: allLeads } = await supabase
      .from('leads')
      .select('metadata, source')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(5);

    console.log(`[VERIFY_CODE] Broader search found ${allLeads?.length || 0} entries:`, allLeads?.map(l => l.source));

    // Check if any of them have the code
    const match = allLeads?.find((l: any) => l.metadata?.code === code);
    if (match) {
      const meta = match.metadata as any;
      if (new Date(meta.expires_at) < new Date()) {
        return NextResponse.json({ error: 'Code expired. Please request a new one.' }, { status: 400 });
      }
      const { error } = await supabase.auth.admin.updateUserById(meta.user_id, { password: newPassword });
      if (error) return NextResponse.json({ error: 'Failed to update password.' }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'No reset code found. Please request a new one.' }, { status: 400 });
  }

  const meta = leads[0].metadata as any;
  if (!meta?.code || !meta?.expires_at || !meta?.user_id) {
    return NextResponse.json({ error: 'Invalid reset code. Please request a new one.' }, { status: 400 });
  }

  // Check if code matches
  if (meta.code !== code) {
    return NextResponse.json({ error: 'Incorrect code. Please try again.' }, { status: 400 });
  }

  // Check if expired
  if (new Date(meta.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Code expired. Please request a new one.' }, { status: 400 });
  }

  // Update password via admin API
  const { error } = await supabase.auth.admin.updateUserById(meta.user_id, {
    password: newPassword,
  });

  if (error) {
    return NextResponse.json({ error: 'Failed to update password. Please try again.' }, { status: 500 });
  }

  // Clean up — delete the used code
  await supabase
    .from('leads')
    .delete()
    .eq('email', email)
    .eq('source', 'password_reset_code');

  return NextResponse.json({ success: true });
}
