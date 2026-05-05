"use client";

import { createClient } from "@/lib/supabase";

/**
 * Check if the current user is a founding member.
 * Founding members get access to ALL products and features — no purchase required.
 */
export async function isFoundingMember(): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data: doctor } = await supabase
      .from("doctors")
      .select("is_founding_member, membership_tier")
      .eq("user_id", user.id)
      .single() as any;
    return doctor?.is_founding_member === true;
  } catch {
    return false;
  }
}
