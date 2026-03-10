import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';

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

  const role = profile?.role || 'doctor';

  if (role === 'admin' || role === 'regional_admin' || role === 'founder' || role === 'super_admin') redirect('/admin/dashboard');
  if (role.startsWith('doctor') || role === 'doctor') redirect('/doctor/dashboard');
  if (role.startsWith('student') || role === 'student') redirect('/student/dashboard');
  if (role === 'patient') redirect('/portal/dashboard');
  if (role === 'vendor') redirect('/vendor/dashboard');

  // Fallback
  redirect('/doctor/dashboard');
}