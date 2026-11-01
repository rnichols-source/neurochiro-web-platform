"use server";

import { createServerSupabase } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { checkAdminAuth } from "@/lib/admin-auth";
import { asLooseDb, asRow } from "@/lib/synapse/loose-db";

export async function getVendors() {
  await checkAdminAuth();
  const supabase = asLooseDb(createServerSupabase());
  const { data, error } = await supabase
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
  await checkAdminAuth();
  const supabase = asLooseDb(createServerSupabase());
  const { count, error: seatError } = await supabase
    .from("synapse_seats")
    .select("id", { count: "exact", head: true })
    .eq("vendor_id", vendorId)
    .eq("status", "active");
  const derived = !seatError && (count || 0) > 0;
  if (isActive && !derived && !seatError) {
    return { error: "This vendor has no active seat." };
  }
  const nextActive = seatError ? isActive : derived;

  const { error } = await supabase
    .from("vendors")
    .update({ is_active: nextActive })
    .eq("id", vendorId);

  if (error) {
    console.error("Error toggling vendor:", error);
    return { error: error.message };
  }

  // Discord notification on approval
  if (nextActive) {
    try {
      const { data: vendor } = await supabase
        .from("vendors")
        .select("name")
        .eq("id", vendorId)
        .single();
      const vendorName = asRow<{ name?: string | null }>(vendor)?.name;

      const discordUrl = process.env.DISCORD_WEBHOOK_URL;
      if (discordUrl) {
        await fetch(discordUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: `✅ **VENDOR APPROVED**\n\n**${vendorName || "Unknown"}** is now live on the marketplace.`,
          }),
        }).catch(() => {});
      }
    } catch {}
  }

  revalidatePath("/admin/marketplace");
  revalidatePath("/marketplace");
  return { success: true };
}

export async function updateVendorTier(vendorId: string, tier: string) {
  await checkAdminAuth();
  const supabase = asLooseDb(createServerSupabase());
  const { error } = await supabase
    .from("vendors")
    .update({ tier })
    .eq("id", vendorId);

  if (error) {
    console.error("Error updating vendor tier:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/marketplace");
  revalidatePath("/marketplace");
  return { success: true };
}

export async function deleteVendor(vendorId: string) {
  await checkAdminAuth();
  const supabase = asLooseDb(createServerSupabase());

  const { error } = await supabase
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
