"use server";

import { createServerSupabase } from "@/lib/supabase-server";
import { Automations } from "@/lib/automations";

export async function getPublicJobs(filters: { category?: string; employment_type?: string }) {
  const supabase = createServerSupabase();

  let query = supabase
    .from("job_postings")
    .select("*")
    .in("status", ["Active", "open"]);

  if (filters.category) query = query.eq("category", filters.category);
  if (filters.employment_type) query = query.eq("employment_type", filters.employment_type);

  // Exclude expired listings
  query = query.or("expires_at.is.null,expires_at.gt." + new Date().toISOString());
  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching public jobs:", error);
    return [];
  }

  if (data && data.length > 0) {
    const doctorIds = [...new Set(data.map((j) => j.doctor_id))];
    const { data: doctors } = await supabase
      .from("doctors")
      .select("user_id, clinic_name, city, state, slug")
      .in("user_id", doctorIds);

    const clinicMap = new Map(
      (doctors || []).map((d) => [
        d.user_id,
        { clinic_name: d.clinic_name, city: d.city, state: d.state, slug: d.slug },
      ])
    );
    return data.map((j) => {
      const doc = clinicMap.get(j.doctor_id) || { clinic_name: "", city: "", state: "", slug: "" };
      return { ...j, clinic_name: doc.clinic_name, clinic_city: doc.city, clinic_state: doc.state, slug: doc.slug };
    });
  }

  return data || [];
}

export async function getJobById(id: string) {
  const supabase = createServerSupabase();

  const { data: job, error } = await supabase
    .from("job_postings")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !job) return null;

  const { data: doctor } = await supabase
    .from("doctors")
    .select("user_id, clinic_name, city, state, slug")
    .eq("user_id", job.doctor_id)
    .single();

  return {
    ...job,
    clinic_name: doctor?.clinic_name || "",
    clinic_city: doctor?.city || "",
    clinic_state: doctor?.state || "",
    slug: doctor?.slug || "",
  };
}

export async function applyToJob(
  jobId: string,
  data: { name: string; email: string; phone?: string; message?: string }
) {
  const supabase = createServerSupabase();

  // Check if user is logged in to link their account
  const { data: { user } } = await supabase.auth.getUser();

  // Insert application
  const { error } = await (supabase as any).from("job_applications").insert({
    job_id: jobId,
    applicant_id: user?.id || null,
    applicant_name: data.name,
    applicant_email: data.email,
    applicant_phone: data.phone || null,
    message: data.message || null,
  });

  if (error) {
    console.error("Error inserting application:", error);
    // Handle duplicate application gracefully
    if (error.code === '23505') {
      throw new Error("You've already applied for this position.");
    }
    throw new Error("Failed to submit application");
  }

  // Notify the doctor
  try {
    const { data: job } = await supabase
      .from("job_postings")
      .select("doctor_id, title")
      .eq("id", jobId)
      .single();

    if (job) {
      // Insert notification
      await supabase.from("notifications").insert({
        user_id: job.doctor_id,
        title: "New Job Application",
        body: `${data.name} applied for "${job.title}"`,
        type: "job_application",
        link: "/doctor/jobs",
      });

      // Try email automation
      const { data: doctorProfile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", job.doctor_id)
        .single();

      await Automations.onJobApplication(
        user?.id || "guest",
        data.email,
        jobId,
        job.title,
        doctorProfile?.email || "support@neurochirodirectory.com"
      );

      // Discord notification
      const discordUrl = process.env.DISCORD_WEBHOOK_URL;
      if (discordUrl) {
        await fetch(discordUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `📋 **NEW JOB APPLICATION**\n\n**Position:** ${job.title}\n**Applicant:** ${data.name}\n**Email:** ${data.email}${data.phone ? `\n**Phone:** ${data.phone}` : ''}`,
          }),
        }).catch(() => {});
      }
    }
  } catch (e) {
    console.error("Notification/automation error:", e);
  }

  return { success: true };
}
