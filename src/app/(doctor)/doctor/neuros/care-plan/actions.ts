"use server";

import { createServerSupabase } from "@/lib/supabase-server";

// Cast supabase to any for NeurOS tables not yet in generated types
function getSupabase() {
  return createServerSupabase() as any;
}

async function getUser() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function saveCareplan(data: any) {
  const user = await getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  const supabase = getSupabase();

  const payload = {
    user_id: user.id,
    patient_name: data.patient_name || "",
    patient_email: data.patient_email || null,
    patient_phone: data.patient_phone || null,
    date: data.date || new Date().toISOString().split("T")[0],
    case_type: data.case_type || "cash",
    insurance_payer: data.insurance_payer || null,
    care_track: data.care_track || "corrective",
    scoring_data: data.scoring_data || {},
    phases: data.phases || [],
    supplements: data.supplements || [],
    lifestyle_recs: data.lifestyle_recs || [],
    payment_options: data.payment_options || {},
    billing_sheet: data.billing_sheet || {},
    notes: data.notes || "",
    status: data.status || "draft",
    total_value: data.total_value || 0,
    updated_at: new Date().toISOString(),
  };

  if (data.id) {
    const { error } = await supabase
      .from("neuros_care_plans")
      .update(payload)
      .eq("id", data.id)
      .eq("user_id", user.id);
    return { success: !error, error: error?.message, id: data.id };
  }

  const { data: row, error } = await supabase
    .from("neuros_care_plans")
    .insert(payload)
    .select("id")
    .single();

  return { success: !error, error: error?.message, id: row?.id };
}

export async function loadCareplans(filters?: { status?: string; search?: string }) {
  const user = await getUser();
  if (!user) return [];
  const supabase = getSupabase();

  let query = supabase
    .from("neuros_care_plans")
    .select("id, patient_name, date, case_type, care_track, status, total_value, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters?.search) {
    query = query.ilike("patient_name", `%${filters.search}%`);
  }

  const { data } = await query;
  return data || [];
}

export async function loadCareplan(id: string) {
  const user = await getUser();
  if (!user) return null;
  const supabase = getSupabase();

  const { data } = await supabase
    .from("neuros_care_plans")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  return data;
}

export async function deleteCareplan(id: string) {
  const user = await getUser();
  if (!user) return { success: false };
  const supabase = getSupabase();

  const { error } = await supabase
    .from("neuros_care_plans")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  return { success: !error };
}

export async function loadPracticeConfig() {
  const user = await getUser();
  if (!user) return null;
  const supabase = getSupabase();

  const { data } = await supabase
    .from("neuros_practice_config")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return data;
}

export async function lookupFeeSchedule(payerCode: string, cptCodes: string[]) {
  const supabase = getSupabase();

  const { data } = await supabase
    .from("neuros_fee_schedules")
    .select("cpt_code, allowed_amount")
    .eq("payer_code", payerCode)
    .in("cpt_code", cptCodes);

  if (!data || data.length === 0) {
    const { DEFAULT_FEE_SCHEDULES } = await import("./fee-schedule-data");
    return cptCodes.map((code: string) => {
      const entry = DEFAULT_FEE_SCHEDULES.find(f => f.payer_code === payerCode && f.cpt_code === code);
      return { cpt_code: code, allowed_amount: entry?.allowed_amount || 0 };
    });
  }

  return data;
}
