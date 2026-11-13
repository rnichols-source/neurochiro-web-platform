import { cache } from 'react';
import { createServerSupabase } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { isAdminRole } from '@/lib/founder';

export type AdminActor = {
  user: { id: string; email?: string | null };
  role: string;
  name: string;
};

/**
 * One auth read and one profile read per request.
 * Layouts and pages both call this; React cache() collapses them.
 */
export const loadAdminActor = cache(async (): Promise<AdminActor | null> => {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .maybeSingle() as { data: { role: string | null; full_name: string | null } | null };

  return {
    user,
    role: profile?.role || '',
    name: profile?.full_name || '',
  };
});

/**
 * Shared admin authorization check for server actions.
 * Verifies the user is authenticated AND has an admin role in the profiles table.
 * Reads role via service role client (not anon) so it's authoritative.
 * NEVER checks user_metadata — users can edit that themselves.
 * Throws an error if unauthorized — callers should catch and return a safe default.
 */
export async function checkAdminAuth() {
  const actor = await loadAdminActor();
  if (!actor) throw new Error("Unauthorized");
  if (!isAdminRole(actor.role)) {
    throw new Error("Forbidden: Admin access required");
  }
  return actor.user;
}
