'use server';

import { createNonMemberCheckout } from '@/lib/jobs/posting';
import { canPostFree, insertMemberPost } from '@/lib/jobs/posting';
import { createServerSupabase } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { LIMIT_MESSAGE } from '@/lib/jobs/posting-pure';

export async function submitOutsidePost(formData: FormData) {
  const tags = String(formData.get('techniques') || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 8);

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  let doctorUserId: string | null = null;
  if (user) {
    const admin = createAdminClient();
    const { data: doctor } = await admin.from('doctors').select('user_id, clinic_name, city, state').eq('user_id', user.id).maybeSingle();
    if (doctor) {
      doctorUserId = user.id;
      const decision = await canPostFree(user.id);
      if (decision.ok) {
        const posted = await insertMemberPost({
          doctorUserId: user.id,
          title: String(formData.get('title') || ''),
          description: String(formData.get('description') || ''),
          type: String(formData.get('type') || 'Associate'),
          salaryMin: Number(formData.get('payMin')) || null,
          salaryMax: Number(formData.get('payMax')) || null,
          city: String(formData.get('city') || doctor.city || ''),
          state: String(formData.get('state') || doctor.state || ''),
          clinicName: String(formData.get('clinicName') || doctor.clinic_name || ''),
          applyEmail: user.email,
        });
        if ('error' in posted) return posted;
        return { posted: true as const };
      }
      if (!decision.ok && decision.reason === 'limit') return { error: LIMIT_MESSAGE };
    }
  }

  const result = await createNonMemberCheckout({
    clinicName: String(formData.get('clinicName') || ''),
    contactName: String(formData.get('contactName') || ''),
    email: String(formData.get('email') || ''),
    phone: String(formData.get('phone') || ''),
    city: String(formData.get('city') || ''),
    state: String(formData.get('state') || ''),
    title: String(formData.get('title') || ''),
    description: String(formData.get('description') || ''),
    type: String(formData.get('type') || 'Associate'),
    payMin: Number(formData.get('payMin')) || null,
    payMax: Number(formData.get('payMax')) || null,
    startDate: String(formData.get('startDate') || '') || null,
    techniqueTags: tags,
    applyMethod: String(formData.get('applyMethod') || 'neurochiro'),
    doctorUserId,
  });
  if ('error' in result && result.error) return { error: result.error };
  if ('checkoutUrl' in result && result.checkoutUrl) return { checkoutUrl: result.checkoutUrl };
  return { error: 'Checkout failed.' };
}
