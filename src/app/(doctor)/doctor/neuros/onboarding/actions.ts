"use server";

import { createServerSupabase } from "@/lib/supabase-server";

export async function loadPracticeConfig() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("neuros_practice_config")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return data;
}

export async function savePracticeConfig(config: any) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("neuros_practice_config")
    .upsert({
      user_id: user.id,
      ...config,
      updated_at: new Date().toISOString(),
    } as any, { onConflict: "user_id" });

  return { success: !error, error: error?.message };
}

export async function markOnboardingComplete() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const { error } = await supabase
    .from("neuros_practice_config")
    .update({ onboarding_completed: true, updated_at: new Date().toISOString() } as any)
    .eq("user_id", user.id);

  return { success: !error };
}

export async function loadDoctorInfo() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("doctors")
    .select("first_name, last_name, clinic_name, phone, address, city, state")
    .eq("user_id", user.id)
    .single();

  return data;
}
