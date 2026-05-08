'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function submitRFP(data: {
  category: string;
  description: string;
  budget: string;
  timeline: string;
}) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'You must be logged in to submit a request.' };

  // Verify doctor role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'doctor') {
    return { error: 'Only doctors can submit quote requests.' };
  }

  const admin = createAdminClient() as any;
  const { error } = await admin.from('vendor_rfps').insert({
    doctor_user_id: user.id,
    category: data.category,
    description: data.description.slice(0, 2000),
    budget: data.budget,
    timeline: data.timeline,
    status: 'open',
  });

  if (error) return { error: error.message };
  return { success: true };
}
