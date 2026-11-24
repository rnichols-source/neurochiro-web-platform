"use client";

import { createClient } from "@/lib/supabase";
import { resolveSelectedListing, sortListings } from "@/lib/portal/listings";

/**
 * Check if the current user is a founding member.
 * Founding members get access to ALL products and features — no purchase required.
 */
export async function isFoundingMember(): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase
      .from("doctors")
      .select("id, city, clinic_name, first_name, last_name, is_founding_member")
      .eq("user_id", user.id);
    const rows = Array.isArray(data) ? data as unknown as { id: string; city?: string | null; clinic_name?: string | null; first_name?: string | null; last_name?: string | null; is_founding_member?: boolean | null }[] : [];
    const doctor = resolveSelectedListing(sortListings(rows), null);
    return doctor?.is_founding_member === true;
  } catch {
    return false;
  }
}
