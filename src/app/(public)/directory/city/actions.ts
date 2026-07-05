"use server";

import { createServerSupabase } from "@/lib/supabase-server";

export async function getDoctorsByLocation(city: string, state: string) {
  const supabase = createServerSupabase();

  const decodedCity = decodeURIComponent(city).replace(/-/g, " ");
  const decodedState = decodeURIComponent(state).replace(/-/g, " ");

  const { data: doctors } = await supabase
    .from("doctors")
    .select("id, first_name, last_name, clinic_name, slug, city, state, photo_url, bio, specialties, profile_views")
    .eq("verification_status", "verified")
    .ilike("city", decodedCity)
    .ilike("state", decodedState)
    .order("profile_views", { ascending: false });

  return doctors || [];
}

export async function getDoctorsByState(state: string) {
  const supabase = createServerSupabase();

  const decodedState = decodeURIComponent(state).replace(/-/g, " ");

  const { data: doctors } = await supabase
    .from("doctors")
    .select("id, first_name, last_name, clinic_name, slug, city, state, photo_url, bio, specialties, profile_views")
    .eq("verification_status", "verified")
    .ilike("state", decodedState)
    .order("profile_views", { ascending: false });

  return doctors || [];
}

export async function getCityStats(city: string, state: string) {
  const supabase = createServerSupabase();

  const decodedCity = decodeURIComponent(city).replace(/-/g, " ");
  const decodedState = decodeURIComponent(state).replace(/-/g, " ");

  const { data, count } = await supabase
    .from("doctors")
    .select("profile_views", { count: "exact" })
    .eq("verification_status", "verified")
    .ilike("city", decodedCity)
    .ilike("state", decodedState);

  const totalViews = (data || []).reduce((sum: number, d: any) => sum + (d.profile_views || 0), 0);

  return { doctorCount: count || 0, totalViews };
}
