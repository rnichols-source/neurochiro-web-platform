import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import { isFounderRole } from '@/lib/founder';

export const dynamic = 'force-dynamic';

export default async function DashboardRedirect() {
  const supabase = createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  let role = (profile as any)?.role || 'doctor';

  // 🛡️ FOUNDER OVERRIDE (role is set in DB at login time)
  if (isFounderRole(role)) {
    role = 'founder';
  }

  const isAdmin = ['admin', 'regional_admin', 'founder', 'super_admin'].includes(role);

  if (isAdmin) {
    redirect('/admin/dashboard');
  }
  
  if (role.startsWith('doctor') || role === 'doctor') redirect('/doctor/dashboard');
  if (role.startsWith('student') || role === 'student') {
    // Check subscription before allowing access to student dashboard
    const { data: studentProfile } = await supabase
      .from('profiles')
      .select('tier, stripe_customer_id')
      .eq('id', user.id)
      .single();
    const tier = studentProfile?.tier;
    const hasStripe = !!(studentProfile as any)?.stripe_customer_id;
    const isSubscribed = hasStripe || (tier && tier !== 'basic' && tier !== 'free');
    if (!isSubscribed) redirect('/student/subscribe');
    redirect('/student/dashboard');
  }
  if (role === 'patient') redirect('/portal/dashboard');
  if (role === 'vendor') redirect('/vendor/dashboard');

  // Fallback
  redirect('/doctor/dashboard');
}