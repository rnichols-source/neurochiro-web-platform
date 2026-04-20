"use server";

import { createServerSupabase } from "@/lib/supabase-server";

export interface PurchaseRecord {
  id: string;
  course_id: string;
  amount: number;
  created_at: string;
  source: string | null;
}

export async function getMyPurchases(): Promise<{
  purchases: PurchaseRecord[];
  email: string | null;
  error?: string;
}> {
  try {
    const supabase = createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { purchases: [], email: null, error: "not_logged_in" };
    }

    // Get purchases by user_id
    const { data: byUser } = await (supabase as any)
      .from("course_purchases")
      .select("id, course_id, amount, created_at, source")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Also get any guest purchases by email that haven't been linked yet
    const { data: byEmail } = await (supabase as any)
      .from("course_purchases")
      .select("id, course_id, amount, created_at, source")
      .eq("guest_email", user.email)
      .is("user_id", null)
      .order("created_at", { ascending: false });

    // Link guest purchases to this user
    if (byEmail && byEmail.length > 0) {
      const guestIds = byEmail.map((p: any) => p.id);
      await (supabase as any)
        .from("course_purchases")
        .update({ user_id: user.id, guest_email: null })
        .in("id", guestIds);
    }

    // Combine and deduplicate by course_id
    const all = [...(byUser || []), ...(byEmail || [])];
    const seen = new Set<string>();
    const unique: PurchaseRecord[] = [];
    for (const p of all) {
      if (!seen.has(p.course_id)) {
        seen.add(p.course_id);
        unique.push(p);
      }
    }

    return { purchases: unique, email: user.email || null };
  } catch {
    return { purchases: [], email: null, error: "unknown" };
  }
}
