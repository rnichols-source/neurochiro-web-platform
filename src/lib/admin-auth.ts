import { createServerSupabase } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { isAdminRole } from '@/lib/founder';

/**
 * Shared admin authorization check for server actions.
 * Verifies the user is authenticated AND has an admin role in the profiles table.
 * Reads role via service role client (not anon) so it's authoritative.
 * NEVER checks user_metadata — users can edit that themselves.
 * Throws an error if unauthorized — callers should catch and return a safe default.
 */
export async function checkAdminAuth() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Read role via admin client — authoritative source, bypasses RLS
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null };

  if (!profile || !isAdminRole(profile.role)) {
    throw new Error("Forbidden: Admin access required");
  }

  return user;
}
