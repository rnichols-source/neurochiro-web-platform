"use server";

import { createServerSupabase } from "@/lib/supabase-server";

export async function getUserPurchases(): Promise<string[]> {
  try {
    const supabase = createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await (supabase as any)
      .from("course_purchases")
      .select("course_id")
      .eq("user_id", user.id);

    return (data || []).map((r: any) => r.course_id);
  } catch {
    return [];
  }
}
