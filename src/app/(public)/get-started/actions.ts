'use server'

import { createAdminClient } from '@/lib/supabase-admin'

export async function createFreeAccount(data: {
  name: string;
  email: string;
  password: string;
  role: 'doctor' | 'student';
}) {
  try {
    const supabase = createAdminClient();

    // Create auth user
    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.name, role: data.role },
    });

    if (authErr) {
      if (authErr.message.includes('already')) return { error: 'An account with this email already exists. Try logging in.' };
      return { error: authErr.message };
    }

    if (!authUser?.user) return { error: 'Failed to create account' };

    const userId = authUser.user.id;

    // Create profile
    await (supabase as any).from('profiles').upsert({
      id: userId,
      email: data.email,
      full_name: data.name,
      role: data.role,
      tier: 'free',
      is_first_login: true,
    });

    // If doctor, create doctor record
    if (data.role === 'doctor') {
      const nameParts = data.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);

      await supabase.from('doctors').insert({
        user_id: userId,
        first_name: firstName,
        last_name: lastName,
        slug,
        clinic_name: '',
        city: '',
        state: '',
        country: 'US',
        address: '',
        bio: '',
        specialties: [],
        verification_status: 'pending',
        membership_tier: 'free',
        region_code: 'US',
      } as any);
    }

    // If student, create student record
    if (data.role === 'student') {
      await (supabase as any).from('students').upsert({
        id: userId,
        full_name: data.name,
        region_code: 'US',
      });
    }

    // Discord notification
    try {
      const discordUrl = process.env.DISCORD_WEBHOOK_URL;
      if (discordUrl) {
        await fetch(discordUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `🆓 **FREE SIGNUP**\n\n**${data.name}** joined as a **${data.role}**\nEmail: ${data.email}`,
          }),
        }).catch(() => {});
      }
    } catch {}

    return { success: true, userId };
  } catch (err: any) {
    console.error('Free signup error:', err);
    return { error: 'Something went wrong. Please try again.' };
  }
}
