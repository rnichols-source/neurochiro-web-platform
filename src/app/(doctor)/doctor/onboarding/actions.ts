'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function completeOnboarding() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Mark onboarding complete
  await (supabase as any).from('profiles').update({
    is_first_login: false,
    onboarding_completed_at: new Date().toISOString(),
  }).eq('id', user.id);

  // Check if doctor is on a paid tier — only auto-verify paid members
  // Free tier doctors stay 'pending' until admin approves
  const admin = createAdminClient();
  const { data: profile } = await (supabase as any).from('profiles').select('tier').eq('id', user.id).single();
  const tier = profile?.tier || 'free';
  const isPaid = tier === 'pro' || tier === 'growth' || tier === 'student_paid';

  // Set trial for free doctors: 3 days of Pro access
  const trialEndsAt = !isPaid ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null;

  await admin.from('doctors').update({
    verification_status: isPaid ? 'verified' : 'pending',
    ...(trialEndsAt ? { trial_ends_at: trialEndsAt } : {}),
  } as any).eq('user_id', user.id);

  // Notify admin when a free doctor needs approval
  if (!isPaid) {
    const { data: doctor } = await admin.from('doctors').select('first_name, last_name, clinic_name, city, state, slug').eq('user_id', user.id).single();
    const discordUrl = process.env.DISCORD_WEBHOOK_URL;
    if (discordUrl && doctor) {
      const name = `Dr. ${doctor.first_name || ''} ${doctor.last_name || ''}`.trim();
      const loc = [doctor.city, doctor.state].filter(Boolean).join(', ');
      fetch(discordUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `⏳ **FREE DOCTOR NEEDS APPROVAL**\n\n**${name}** | ${doctor.clinic_name || 'No clinic'}\n📍 ${loc || 'No location'}\n🔗 https://neurochiro.co/directory/${doctor.slug}\n\nApprove at: https://neurochiro.co/admin/directory`,
        }),
      }).catch(() => {});
    }
  }

  return { success: true };
}

export async function updateOnboardingProfile(data: {
  specialties: string[];
  bio?: string;
}) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const admin = createAdminClient();
  const updateData: any = { specialties: data.specialties };
  if (data.bio) updateData.bio = data.bio;

  await admin.from('doctors').update(updateData).eq('user_id', user.id);
  return { success: true };
}
