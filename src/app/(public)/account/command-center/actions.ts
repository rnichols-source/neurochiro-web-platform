"use server";

import { createServerSupabase } from "@/lib/supabase-server";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getUserId(): Promise<string | null> {
  try {
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

function db() {
  return createServerSupabase() as any;
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export async function getEvents() {
  const userId = await getUserId();
  if (!userId) return [];
  const { data } = await db()
    .from("screening_events")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });
  return data || [];
}

export async function upsertEvent(event: any) {
  const userId = await getUserId();
  if (!userId) return { error: "Not authenticated" };
  const { error } = await db()
    .from("screening_events")
    .upsert({ ...event, user_id: userId }, { onConflict: "id" });
  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteEvent(id: string) {
  const userId = await getUserId();
  if (!userId) return { error: "Not authenticated" };
  const { error } = await db()
    .from("screening_events")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) return { error: error.message };
  return { success: true };
}

// ---------------------------------------------------------------------------
// Contacts (Network)
// ---------------------------------------------------------------------------

export async function getContacts() {
  const userId = await getUserId();
  if (!userId) return [];
  const { data } = await db()
    .from("screening_contacts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function upsertContact(contact: any) {
  const userId = await getUserId();
  if (!userId) return { error: "Not authenticated" };
  const { error } = await db()
    .from("screening_contacts")
    .upsert({ ...contact, user_id: userId }, { onConflict: "id" });
  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteContact(id: string) {
  const userId = await getUserId();
  if (!userId) return { error: "Not authenticated" };
  const { error } = await db()
    .from("screening_contacts")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) return { error: error.message };
  return { success: true };
}

// ---------------------------------------------------------------------------
// Vendors
// ---------------------------------------------------------------------------

export async function getVendors() {
  const userId = await getUserId();
  if (!userId) return [];
  const { data } = await db()
    .from("screening_vendors")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function upsertVendor(vendor: any) {
  const userId = await getUserId();
  if (!userId) return { error: "Not authenticated" };
  const { error } = await db()
    .from("screening_vendors")
    .upsert({ ...vendor, user_id: userId }, { onConflict: "id" });
  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteVendor(id: string) {
  const userId = await getUserId();
  if (!userId) return { error: "Not authenticated" };
  const { error } = await db()
    .from("screening_vendors")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) return { error: error.message };
  return { success: true };
}

// ---------------------------------------------------------------------------
// Outreach
// ---------------------------------------------------------------------------

export async function getOutreach() {
  const userId = await getUserId();
  if (!userId) return [];
  const { data } = await db()
    .from("screening_outreach")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function upsertOutreach(item: any) {
  const userId = await getUserId();
  if (!userId) return { error: "Not authenticated" };
  const { error } = await db()
    .from("screening_outreach")
    .upsert({ ...item, user_id: userId }, { onConflict: "id" });
  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteOutreach(id: string) {
  const userId = await getUserId();
  if (!userId) return { error: "Not authenticated" };
  const { error } = await db()
    .from("screening_outreach")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) return { error: error.message };
  return { success: true };
}
