"use server";

import { randomBytes } from "crypto";
import { SEMINAR_CONFIG } from "@/config/seminars";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase-admin";
import { createServerSupabase } from "@/lib/supabase-server";
import { buildFeaturedCheckoutSession, buildPackageCheckoutSession, buildTicketCheckoutSession } from "@/lib/seminars/checkout-params";
import { hostApplicationReceived, rsvpConfirmed, seminarsFrom } from "@/lib/seminars/emails";
import { formatDateRange } from "@/lib/seminars/format";
import { memberTicketPrice } from "@/lib/seminars/utm";
import { STUDENT_CONFIG } from "@/config/students";
import { getStudentMembership } from "@/lib/students/membership";
import { hasMemberAccess } from "@/lib/students/membership-pure";
import { getSeminarBySlug } from "@/lib/seminars/queries";
import { supabaseSeminarStore } from "@/lib/seminars/fulfill-db";
import { insertFlexible } from "@/lib/seminars/write";
import type { SeminarPackageId } from "@/config/seminars";

function ticketingClosed(message: string): boolean {
  return /could not find the function|schema cache|does not exist|PGRST202|42883/i.test(message);
}

export async function rsvpForSeminar(slug: string, formData: FormData) {
  const seminar = await getSeminarBySlug(slug);
  if (!seminar || !seminar.upcoming) return { error: "This seminar is not open for reminders." };
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const email = String(formData.get("email") || user?.email || "").trim().toLowerCase();
  const name = String(formData.get("name") || "").trim();
  if (!email.includes("@")) return { error: "Enter an email so we can remind you." };

  const inserted = await insertFlexible("seminar_registrations", {
    seminar_id: seminar.id,
    profile_id: user?.id || null,
    attendee_name: name || null,
    attendee_email: email,
    status: "rsvp",
    payment_status: "pending",
    source: "rsvp",
  });
  if (inserted.error) {
    await insertFlexible("leads", {
      email,
      full_name: name || null,
      source: "seminar_rsvp",
      metadata: { seminar_id: seminar.id, slug: seminar.slug },
    });
  } else if (inserted.data?.id) {
    await supabaseSeminarStore().enqueueReminders(inserted.data.id, seminar.id);
  }

  try {
    const { Resend } = await import("resend");
    const when = formatDateRange(seminar.startDate, seminar.endDate, seminar.timeZone, seminar.dates);
    const mail = rsvpConfirmed({ title: seminar.title, slug: seminar.slug, when, registrationLink: seminar.registrationLink });
    await new Resend(process.env.RESEND_API_KEY || "").emails.send({
      from: seminarsFrom(),
      to: [email],
      subject: mail.subject,
      html: mail.html,
    });
  } catch (error) {
    console.error("[seminars] rsvp email failed", error instanceof Error ? error.message : "send failed");
  }
  return { success: true as const };
}

export async function createSeminarCheckout(input: {
  slug: string;
  ticketTypeId: string;
  attendeeName: string;
  attendeeEmail: string;
}) {
  const seminar = await getSeminarBySlug(input.slug);
  if (!seminar || !seminar.upcoming) return { error: "This seminar is not open." };
  if (seminar.registrationMode !== "neurochiro") return { error: "This seminar registers on the host site." };
  const admin = createAdminClient() as unknown as { from: (table: string) => any; rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: string | null; error: { message: string } | null }> };
  let ticket = await admin.from("seminar_ticket_types").select("id, name, price, member_price, currency, early_bird_price, early_bird_ends_at, is_active, audience").eq("id", input.ticketTypeId).eq("seminar_id", seminar.id).maybeSingle();
  if (ticket.error && /audience|42703|schema cache/i.test(ticket.error.message || "")) {
    ticket = await admin.from("seminar_ticket_types").select("id, name, price, member_price, currency, early_bird_price, early_bird_ends_at, is_active").eq("id", input.ticketTypeId).eq("seminar_id", seminar.id).maybeSingle();
  }
  if (ticket.error) {
    if (ticketingClosed(ticket.error.message || "")) return { error: "Ticketing is not open yet." };
    return { error: "That ticket is not available." };
  }
  if (!ticket.data?.is_active) return { error: "That ticket is not available." };

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  let isMember = false;
  let discountPct: number = SEMINAR_CONFIG.defaultMemberDiscountPct;
  if (user) {
    const doctor = await admin.from("doctors").select("membership_tier").eq("user_id", user.id).maybeSingle();
    isMember = doctor.data?.membership_tier === "pro";
    if (!isMember) {
      const studentMembership = await getStudentMembership(user.id);
      const profile = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
      if ((profile.data as { role?: string } | null)?.role === "student" && hasMemberAccess(studentMembership)) {
        isMember = true;
        discountPct = STUDENT_CONFIG.seminars.studentDiscountPct;
      }
    }
  }
  const audience = (ticket.data as { audience?: string | null }).audience || (ticket.data.name === "Student" ? "student" : "all");
  if (audience === "student") {
    const profile = user ? await admin.from("profiles").select("role").eq("id", user.id).maybeSingle() : { data: null };
    if (!user || (profile.data as { role?: string } | null)?.role !== "student") {
      return { error: "Sign in with a student account to use this ticket." };
    }
  }
  const priced = memberTicketPrice({
    price: Number(ticket.data.price || 0),
    memberPrice: ticket.data.member_price,
    earlyBirdPrice: ticket.data.early_bird_price,
    earlyBirdEndsAt: ticket.data.early_bird_ends_at,
    isMember,
    discountPct,
  });
  const email = (input.attendeeEmail || user?.email || "").trim().toLowerCase();
  if (!email.includes("@")) return { error: "Enter the email for this ticket." };
  const qr = randomBytes(16).toString("hex");
  const reserved = await admin.rpc("seminar_reserve_seat", {
    p_seminar_id: seminar.id,
    p_ticket_type_id: ticket.data.id,
    p_name: input.attendeeName || "",
    p_email: email,
    p_profile_id: user?.id || null,
    p_amount_cents: Math.round(priced.amount * 100),
    p_currency: (ticket.data.currency || seminar.currency || "usd").toLowerCase(),
    p_member_discount: priced.memberDiscountApplied,
    p_hold_minutes: SEMINAR_CONFIG.seatHoldMinutes,
    p_qr_token: qr,
  });
  if (reserved.error) {
    if (ticketingClosed(reserved.error.message || "")) return { error: "Ticketing is not open yet." };
    return { error: "Could not hold a seat." };
  }
  if (!reserved.data) return { error: "Those seats are gone." };

  const params = buildTicketCheckoutSession({
    slug: seminar.slug,
    title: seminar.title,
    ticketName: ticket.data.name,
    currency: ticket.data.currency || seminar.currency || "usd",
    unitAmountCents: Math.round(priced.amount * 100),
    email,
    registrationId: reserved.data,
    seminarId: seminar.id,
  });
  const session = await stripe.checkout.sessions.create(params);
  await admin.from("seminar_registrations").update({ stripe_checkout_session_id: session.id }).eq("id", reserved.data);
  return { url: session.url };
}

export async function createHostPackageCheckout(packageId: SeminarPackageId): Promise<{ url: string | null } | { error: string; loginUrl?: string }> {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    const next = `/seminars/host?pkg=${packageId}`;
    return { error: "Log in to buy a host package.", loginUrl: `/login?redirect=${encodeURIComponent(next)}` };
  }
  const built = buildPackageCheckoutSession({ packageId, email: user.email, userId: user.id });
  if ("error" in built && built.error) return { error: built.error };
  const { subscription_data, ...rest } = built;
  const session = await stripe.checkout.sessions.create(subscription_data ? built : rest);
  return { url: session.url };
}

export async function createFeaturedCheckout(slug: string) {
  const seminar = await getSeminarBySlug(slug);
  if (!seminar) return { error: "Seminar not found." };
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Log in to feature a seminar." };
  if (seminar.hostId && seminar.hostId !== user.id) return { error: "Only the host can feature this seminar." };
  const built = buildFeaturedCheckoutSession({ seminarId: seminar.id, slug: seminar.slug, email: user.email, userId: user.id });
  if ("error" in built && built.error) return { error: built.error };
  const session = await stripe.checkout.sessions.create(built);
  return { url: session.url };
}

export async function submitHostInterest(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const name = String(formData.get("name") || "").trim();
  const org = String(formData.get("org") || "").trim();
  const website = String(formData.get("website") || "").trim();
  const topics = String(formData.get("topics") || "").split(",").map((topic) => topic.trim()).filter(Boolean);
  if (!email.includes("@") || !name) return { error: "Name and email are required." };
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const host = await insertFlexible("seminar_hosts", {
    user_id: user?.id || null,
    display_name: name,
    org_name: org || name,
    website: website || null,
    topics,
    status: "applied",
    application: { email, topics, website },
  });
  let saved = !host.error;
  if (host.error) {
    const lead = await insertFlexible("leads", {
      email,
      full_name: name,
      source: "seminar_host_interest",
      metadata: { org, website, topics },
    });
    saved = !lead.error;
  }
  if (!saved) return { ok: false as const, error: "Could not submit your application. Try again." };
  const discordUrl = process.env.DISCORD_WEBHOOK_URL;
  if (discordUrl) {
    await fetch(discordUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: `Seminar host interest\n${name} (${org || "no org"})\nStatus: submitted for review` }),
    }).catch(() => {});
  }
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend");
      const message = hostApplicationReceived(name);
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({ from: seminarsFrom(), to: email, subject: message.subject, html: message.html });
    } catch {
      // A missing or rejected sender must not fail a saved application.
    }
  }
  return { success: true as const };
}
