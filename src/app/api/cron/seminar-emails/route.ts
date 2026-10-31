import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { postEventEmail, registrationConfirmed, reminderEmail, rsvpConfirmed, seminarsFrom } from "@/lib/seminars/emails";
import { formatDateRange } from "@/lib/seminars/format";
import { parseSeminarDates, timezoneForCity } from "@/lib/seminars/dates";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

function missing(error: { message?: string; code?: string } | null): boolean {
  const message = error?.message || "";
  return error?.code === "42P01" || error?.code === "PGRST205" || /schema cache|does not exist|could not find/i.test(message);
}

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient() as unknown as { from: (table: string) => any };
  const due = await admin
    .from("seminar_email_jobs")
    .select("id, registration_id, seminar_id, kind, attempts")
    .is("sent_at", null)
    .lt("attempts", 3)
    .lte("send_at", new Date().toISOString())
    .limit(25);
  if (due.error && missing(due.error)) return NextResponse.json({ ok: true, skipped: true });
  if (due.error) return NextResponse.json({ error: due.error.message }, { status: 500 });

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY || "");
  let sent = 0;
  for (const job of due.data || []) {
    try {
      const registration = job.registration_id
        ? await admin.from("seminar_registrations").select("attendee_email, attendee_name, qr_token, status, profile_id").eq("id", job.registration_id).maybeSingle()
        : { data: null };
      const seminar = await admin.from("seminars").select("title, slug, dates, city, country, venue_name, registration_link, refund_policy, virtual_url").eq("id", job.seminar_id).maybeSingle();
      const row = seminar.data;
      if (!row) throw new Error("Seminar missing");
      const email = registration.data?.attendee_email;
      if (!email) throw new Error("No recipient");
      const parsed = parseSeminarDates(row.dates);
      const zone = timezoneForCity(row.city, row.country);
      const when = formatDateRange(parsed?.start || null, parsed?.end || null, zone, row.dates);
      const place = [row.venue_name, row.city].filter(Boolean).join(", ");
      const slug = row.slug || job.seminar_id;
      let mail = registrationConfirmed({ title: row.title, slug, when, place, qrToken: registration.data?.qr_token, refundPolicy: row.refund_policy });
      if (job.kind === "rsvp" || registration.data?.status === "rsvp") {
        mail = rsvpConfirmed({ title: row.title, slug, when, registrationLink: row.registration_link });
      }
      if (String(job.kind).startsWith("reminder-")) {
        const hours = Number(String(job.kind).replace("reminder-", "")) || 24;
        mail = reminderEmail({ title: row.title, slug, when, place, hours, virtualUrl: hours <= 2 ? row.virtual_url : null });
      }
      if (job.kind === "post-event") mail = postEventEmail({ title: row.title, slug });
      await resend.emails.send({ from: seminarsFrom(), to: [email], subject: mail.subject, html: mail.html });
      await admin.from("seminar_email_jobs").update({ sent_at: new Date().toISOString(), error: null }).eq("id", job.id);
      sent += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "send failed";
      await admin.from("seminar_email_jobs").update({ attempts: Number(job.attempts || 0) + 1, error: message.slice(0, 300) }).eq("id", job.id);
    }
  }
  return NextResponse.json({ ok: true, sent });
}
