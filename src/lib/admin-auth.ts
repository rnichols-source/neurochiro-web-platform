import { createServerSupabase } from '@/lib/supabase-server';
import { isAdminRole } from '@/lib/founder';

/**
 * Shared admin authorization check for server actions.
 * Verifies the user is authenticated AND has an admin role in the profiles table.
 * Throws an error if unauthorized — callers should catch and return a safe default.
 */
export async function checkAdminAuth() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null };

  const isAdmin = (profile && 'role' in profile && isAdminRole(profile.role)) ||
                  isAdminRole(user.user_metadata?.role as string);

  if (!isAdmin) throw new Error("Forbidden: Admin access required");
  return user;
}
