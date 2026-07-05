"use server";

import { createAdminClient } from "@/lib/supabase-admin";

export async function findMatchingDoctors(data: {
  concern: string;
  city: string;
  state: string;
  experience: string;
  priority: string;
  email: string;
}) {
  const supabase = createAdminClient();

  // Save lead
  await supabase.from("leads").insert({
    email: data.email,
    source: "quiz_funnel",
    role: "patient",
    location: `${data.city}, ${data.state}`,
    status: "new",
    metadata: {
      concern: data.concern,
      experience: data.experience,
      priority: data.priority,
    },
  } as any);

  // Find doctors in or near the patient's state
  let query = supabase
    .from("doctors")
    .select("id, first_name, last_name, clinic_name, slug, city, state, photo_url, bio, specialties, profile_views")
    .eq("verification_status", "verified")
    .order("profile_views", { ascending: false });

  // Try city match first
  if (data.city && data.state) {
    const { data: cityDocs } = await query
      .ilike("state", data.state)
      .limit(6);

    if (cityDocs && cityDocs.length > 0) {
      // Sort: exact city matches first, then same state
      const sorted = cityDocs.sort((a: any, b: any) => {
        const aCity = a.city?.toLowerCase() === data.city.toLowerCase() ? 1 : 0;
        const bCity = b.city?.toLowerCase() === data.city.toLowerCase() ? 1 : 0;
        return bCity - aCity;
      });
      return sorted.slice(0, 3);
    }
  }

  // Fallback: any doctors, sorted by views
  const { data: allDocs } = await supabase
    .from("doctors")
    .select("id, first_name, last_name, clinic_name, slug, city, state, photo_url, bio, specialties, profile_views")
    .eq("verification_status", "verified")
    .order("profile_views", { ascending: false })
    .limit(3);

  return allDocs || [];
}
