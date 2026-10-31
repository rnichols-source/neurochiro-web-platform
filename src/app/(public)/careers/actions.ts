"use server";

import { createServerSupabase } from "@/lib/supabase-server";
import { Automations } from "@/lib/automations";
import { loadPublicBoard, loadPublicJob } from "@/lib/jobs/board";

export async function getPublicJobs(filters: { category?: string; employment_type?: string }) {
  const rows = await loadPublicBoard({});
  return rows.filter((job) => {
    const row = job as { category?: string | null; employment_type?: string | null };
    if (filters.category && row.category !== filters.category) return false;
    if (filters.employment_type && row.employment_type !== filters.employment_type) return false;
    return true;
  });
}

export async function getJobById(id: string) {
  return loadPublicJob(id);
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
