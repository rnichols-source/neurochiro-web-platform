import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

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

  let role = profile?.role || 'doctor';

  // 🛡️ FOUNDER OVERRIDE
  if (user.email === 'drray@neurochirodirectory.com') {
    role = 'founder';
  }

  const isAdmin = ['admin', 'regional_admin', 'founder', 'super_admin'].includes(role);

  if (isAdmin) {
    const cookieStore = await cookies();
    cookieStore.delete('nc_demo_role');
    redirect('/admin/dashboard');
  }
  
  if (role.startsWith('doctor') || role === 'doctor') redirect('/doctor/dashboard');
  if (role.startsWith('student') || role === 'student') redirect('/student/dashboard');
  if (role === 'patient') redirect('/portal/dashboard');
  if (role === 'vendor') redirect('/vendor/dashboard');

  // Fallback
  redirect('/doctor/dashboard');
}