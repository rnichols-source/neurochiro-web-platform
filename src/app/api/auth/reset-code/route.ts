import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  const { email } = await request.json();
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  const supabase = createAdminClient();
  const resend = new Resend(process.env.RESEND_API_KEY || '');

  // Check if user exists
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users?.users?.find(u => u.email === email);
  if (!user) {
    // Don't reveal if email exists — just say "sent"
    return NextResponse.json({ success: true });
  }

  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

  // Store code in database
  await supabase.from('leads').upsert({
    email,
    source: 'password_reset_code',
    role: 'reset',
    status: 'new',
    metadata: { code, expires_at: expiresAt, user_id: user.id },
  }, { onConflict: 'email' }).select();

  // If upsert fails due to no unique constraint, just insert
  // The verify endpoint will check the most recent code

  // Also try direct insert as backup
  await supabase.from('leads').insert({
    email,
    source: 'password_reset_code',
    role: 'reset',
    status: 'new',
    metadata: { code, expires_at: expiresAt, user_id: user.id },
  });

  // Send code via Resend
  await resend.emails.send({
    from: 'NeuroChiro <support@neurochirodirectory.com>',
    to: [email],
    subject: `Your NeuroChiro reset code: ${code}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 24px; font-weight: 800; color: #1E2D3B; margin: 0;">NEURO<span style="color: #D66829;">CHIRO</span></h1>
        </div>
        <h2 style="font-size: 20px; color: #1E2D3B; text-align: center;">Your Password Reset Code</h2>
        <div style="text-align: center; margin: 32px 0;">
          <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; font-family: monospace; color: #D66829; background: #f5f3ef; padding: 20px; border-radius: 12px; display: inline-block;">
            ${code}
          </div>
        </div>
        <p style="color: #555; font-size: 15px; text-align: center; line-height: 1.6;">
          Enter this code on the password reset page. It expires in 15 minutes.
        </p>
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 32px;">
          If you didn't request this, you can ignore this email.
        </p>
      </div>
    `,
  });

  return NextResponse.json({ success: true });
}
