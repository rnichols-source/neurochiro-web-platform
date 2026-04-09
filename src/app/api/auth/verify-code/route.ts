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

  // Find ALL leads for this email and search for matching code
  const { data: leads, error: queryError } = await supabase
    .from('leads')
    .select('id, metadata, source, created_at')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(20);

  console.log(`[VERIFY_CODE] Query for ${email}: found ${leads?.length || 0}, error: ${queryError?.message || 'none'}`);

  if (!leads || leads.length === 0) {
    return NextResponse.json({ error: 'No reset code found. Click "Resend" to get a new code.' }, { status: 400 });
  }

  // Find the entry with matching code
  const match = leads.find((l: any) => {
    const meta = l.metadata as any;
    return meta?.code === code;
  });

  if (!match) {
    console.log(`[VERIFY_CODE] No matching code. Available sources:`, leads.map((l: any) => `${l.source}: ${(l.metadata as any)?.code || 'no code'}`));
    return NextResponse.json({ error: 'Incorrect code. Please check and try again.' }, { status: 400 });
  }

  const meta = match.metadata as any;

  // Check expiry
  if (meta.expires_at && new Date(meta.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Code expired. Click "Resend" to get a new code.' }, { status: 400 });
  }

  // Get user ID
  const userId = meta.user_id;
  if (!userId) {
    // Fallback: look up user by email in profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 400 });
    }

    // Update password
    const { error } = await supabase.auth.admin.updateUserById(profile.id, { password: newPassword });
    if (error) {
      console.error(`[VERIFY_CODE] Password update failed:`, error.message);
      return NextResponse.json({ error: 'Failed to update password. Please try again.' }, { status: 500 });
    }
  } else {
    // Update password
    const { error } = await supabase.auth.admin.updateUserById(userId, { password: newPassword });
    if (error) {
      console.error(`[VERIFY_CODE] Password update failed:`, error.message);
      return NextResponse.json({ error: 'Failed to update password. Please try again.' }, { status: 500 });
    }
  }

  // Clean up
  await supabase
    .from('leads')
    .delete()
    .eq('id', match.id);

  console.log(`[VERIFY_CODE] Password updated for ${email}`);

  return NextResponse.json({ success: true });
}
