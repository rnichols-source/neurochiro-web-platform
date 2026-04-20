"use server";

import { createServerSupabase } from "@/lib/supabase-server";

export interface PurchaseRecord {
  id: string;
  course_id: string;
  amount: number;
  created_at: string;
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

    // Get all purchases for this user
    const { data } = await (supabase as any)
      .from("course_purchases")
      .select("id, course_id, amount, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Deduplicate by course_id (keep most recent)
    const seen = new Set<string>();
    const unique: PurchaseRecord[] = [];
    for (const p of data || []) {
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
