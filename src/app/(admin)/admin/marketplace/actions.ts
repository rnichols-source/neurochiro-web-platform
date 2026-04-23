"use server";

import { createServerSupabase } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function getVendors() {
  const supabase = createServerSupabase();
  const { data, error } = await (supabase as any)
    .from("vendors")
    .select("*")
    .order("is_active", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching vendors:", error);
    return [];
  }
  return data || [];
}

export async function toggleVendorActive(vendorId: string, isActive: boolean) {
  const supabase = createServerSupabase();

  const { error } = await (supabase as any)
    .from("vendors")
    .update({ is_active: isActive })
    .eq("id", vendorId);

  if (error) {
    console.error("Error toggling vendor:", error);
    return { error: error.message };
  }

  // Discord notification on approval
  if (isActive) {
    try {
      const { data: vendor } = await (supabase as any)
        .from("vendors")
        .select("name")
        .eq("id", vendorId)
        .single();

      const discordUrl = process.env.DISCORD_WEBHOOK_URL;
      if (discordUrl) {
        await fetch(discordUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: `✅ **VENDOR APPROVED**\n\n**${vendor?.name || "Unknown"}** is now live on the marketplace.`,
          }),
        }).catch(() => {});
      }
    } catch {}
  }

  revalidatePath("/admin/marketplace");
  revalidatePath("/marketplace");
  return { success: true };
}

export async function deleteVendor(vendorId: string) {
  const supabase = createServerSupabase();

  const { error } = await (supabase as any)
    .from("vendors")
    .delete()
    .eq("id", vendorId);

  if (error) {
    console.error("Error deleting vendor:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/marketplace");
  revalidatePath("/marketplace");
  return { success: true };
}
