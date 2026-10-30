import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { createServerSupabase } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { sendAdminAlert, type LeadMail } from "@/lib/leads/deliver";
import { isMissingColumn, isMissingTable, updateContactRequest } from "@/lib/leads/schema";
import { parseLegacyNote } from "@/lib/leads/validate";

export const maxDuration = 30;

const STATUS_BY_EVENT: Record<string, string> = {
  "email.sent": "sent",
  "email.delivered": "delivered",
  "email.opened": "opened",
  "email.clicked": "clicked",
  "email.bounced": "bounced",
  "email.complained": "complained",
};

const DOCTOR_KINDS = new Set(["doctor_initial", "doctor_reminder_1", "doctor_reminder_2", "doctor_withdrawn"]);

/**
 * Resend webhook. Verifies the Svix signature when RESEND_WEBHOOK_SECRET is set.
 */
export async function POST(req: Request) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  const raw = await req.text();
  let body: any;

  if (webhookSecret) {
    try {
      const wh = new Webhook(webhookSecret);
      body = wh.verify(raw, {
        "svix-id": req.headers.get("svix-id") || "",
        "svix-timestamp": req.headers.get("svix-timestamp") || "",
        "svix-signature": req.headers.get("svix-signature") || "",
      });
    } catch (err) {
      console.warn("[RESEND WEBHOOK] Invalid signature:", err instanceof Error ? err.message : err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } else {
    console.warn("[RESEND WEBHOOK] RESEND_WEBHOOK_SECRET is not set. Signature was not verified.");
    try {
      body = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
  }

  const supabase = createServerSupabase();
  const adminDb = createAdminClient();
  const eventType = body.type as string;
  const payload = body.data || {};

  try {
    const email = payload.to?.[0] || payload.email;
    const emailId = payload.email_id || payload.emailId;
    const nextStatus = STATUS_BY_EVENT[eventType];

    if (emailId && nextStatus) {
      await applyLeadDeliveryStatus(adminDb, emailId, nextStatus);
    }

    if (!email && eventType !== "email.sent" && eventType !== "email.delivered") {
      return NextResponse.json({ received: true });
    }

    switch (eventType) {
      case "email.bounced":
        if (email) {
          console.warn(`[REPUTATION ALERT] Email bounced for: ${email}`);
          await handleProfileEmailEvent(email, supabase, { has_bounced: true });
          await handleSubscriberUnsubscribe(email, adminDb);
          if (!emailId) await handleContactRequestBounce(email, adminDb);
        }
        break;

      case "email.complained":
        if (email) {
          console.warn(`[REPUTATION ALERT] User marked email as SPAM: ${email}`);
          await handleProfileEmailEvent(email, supabase, { has_complained: true });
          await handleSubscriberUnsubscribe(email, adminDb);
        }
        break;

      case "contact.unsubscribed": {
        const unsubEmail = payload.email || email;
        if (unsubEmail) {
          console.log(`[UNSUBSCRIBE] Contact unsubscribed: ${unsubEmail}`);
          await handleSubscriberUnsubscribe(unsubEmail, adminDb);
        }
        break;
      }

      default:
        if (!nextStatus) console.log(`[RESEND WEBHOOK] Unhandled event: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[RESEND WEBHOOK ERROR]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function applyLeadDeliveryStatus(adminDb: any, emailId: string, status: string) {
  const { data, error } = await adminDb
    .from("lead_notifications")
    .select("id, contact_request_id, kind, recipient")
    .eq("provider_message_id", emailId);

  if (error) {
    if (isMissingTable(error)) {
      console.error("[LEADS] lead_notifications is missing. Webhook status was not stored. Apply migration 20261030000000_lead_followup.sql.", error.message);
      return;
    }
    console.error("[LEADS] lead notification lookup by provider id failed:", error.message);
    return;
  }
  if (!data?.length) return;

  const updated = await adminDb
    .from("lead_notifications")
    .update({ status, updated_at: new Date().toISOString(), error: status === "bounced" ? "Email bounced" : null })
    .eq("provider_message_id", emailId);
  if (updated.error) console.error("[LEADS] lead notification status update failed:", updated.error.message);

  if (status !== "bounced") return;

  for (const row of data) {
    if (!DOCTOR_KINDS.has(row.kind)) continue;
    const flagged = await updateContactRequest(adminDb, row.contact_request_id, {
      needs_admin_attention: true,
      attention_reason: "doctor email bounced",
    });
    if (!flagged.ok && !flagged.missingColumn) {
      console.error("[LEADS] could not flag bounced doctor email:", flagged.error);
    }
    await alertBounce(adminDb, row);
  }
}

async function alertBounce(adminDb: any, notification: { contact_request_id: string; kind: string; recipient?: string | null }) {
  const extended = await adminDb
    .from("contact_requests")
    .select("id, name, phone, note, email, doctor_id, source")
    .eq("id", notification.contact_request_id)
    .maybeSingle();
  let request = extended.data;
  if (extended.error && isMissingColumn(extended.error)) {
    const basic = await adminDb.from("contact_requests").select("id, name, phone, note, doctor_id, source").eq("id", notification.contact_request_id).maybeSingle();
    request = basic.data;
  }
  if (!request) return;

  const { data: doctor } = await adminDb.from("doctors").select("first_name, last_name, clinic_name, email, phone").eq("id", request.doctor_id).maybeSingle();
  const legacy = parseLegacyNote(request.note);
  const doctorName = doctor ? `Dr. ${doctor.first_name || ""} ${doctor.last_name || ""}`.trim() : "Unknown doctor";
  const mail: LeadMail = {
    requestId: request.id,
    patientName: request.name || "",
    patientPhone: request.phone || "",
    patientEmail: request.email || legacy.email || "",
    preferredTime: legacy.preferredTime,
    message: request.note || "",
    source: request.source || "",
    doctorName,
    practiceName: doctor?.clinic_name || doctorName,
    doctorPhone: doctor?.phone || "",
    doctorEmail: notification.recipient || doctor?.email || "",
    doctorRecipients: [],
    acknowledgeToken: "",
    withdrawalToken: "",
    checkinToken: "",
  };
  const sent = await sendAdminAlert(mail, `doctor email bounced (${notification.kind})`);
  if (!sent.ok) console.error("[LEADS] bounce admin alert failed:", sent.error);
}

async function handleProfileEmailEvent(email: string, supabase: any, update: Record<string, boolean>) {
  const userId = await getUserIdFromEmail(email, supabase);
  if (userId) {
    await supabase
      .from("email_preferences")
      .update({ ...update, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
  }
}

async function handleSubscriberUnsubscribe(email: string, adminDb: any) {
  const { data } = await adminDb
    .from("subscribers")
    .select("id, status")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (data && data.status !== "unsubscribed") {
    await adminDb
      .from("subscribers")
      .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
      .eq("id", data.id);
    console.log(`[SUBSCRIBER] Unsubscribed via webhook: ${email}`);
  }
}

/**
 * Legacy path for bounces that have no lead_notifications row.
 * Flags open requests for a doctor whose address bounced.
 */
async function handleContactRequestBounce(email: string, adminDb: any) {
  try {
    const { data: doctors } = await adminDb.from("doctors").select("id").eq("email", email);
    if (!doctors?.length) return;
    const doctorIds = doctors.map((d: any) => d.id);
    const { data: requests } = await adminDb
      .from("contact_requests")
      .select("id")
      .in("doctor_id", doctorIds)
      .eq("status", "new");
    if (!requests?.length) return;

    for (const request of requests) {
      await adminDb
        .from("contact_request_escalations")
        .update({ delivered: false, error: "Email bounced" })
        .eq("contact_request_id", request.id)
        .is("delivered", null);
      await updateContactRequest(adminDb, request.id, {
        needs_admin_attention: true,
        attention_reason: "doctor email bounced",
      });
    }
    console.warn(`[CONTACT_REQUEST] Bounce detected for ${email}, flagged ${requests.length} requests`);
  } catch (err) {
    console.error("[CONTACT_REQUEST] Bounce handler error:", err instanceof Error ? err.message : err);
  }
}

async function getUserIdFromEmail(email: string, supabase: any) {
  const { data } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();
  return data?.id;
}
