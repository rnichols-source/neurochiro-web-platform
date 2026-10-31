import { createAdminClient } from "@/lib/supabase-admin";
import { SEMINAR_CONFIG } from "@/config/seminars";
import type { SeminarStore } from "./fulfill";
import { missingColumn, insertFlexible } from "./write";

function admin() {
  return createAdminClient() as unknown as {
    from: (table: string) => any;
  };
}

function missingTable(error: { message?: string; code?: string } | null): boolean {
  const message = error?.message || "";
  return error?.code === "42P01" || error?.code === "PGRST205" || /schema cache|does not exist|could not find the table/i.test(message);
}

export function supabaseSeminarStore(): SeminarStore {
  return {
    async markPaid(input) {
      const db = admin();
      const existing = await db.from("seminar_registrations").select("id, status, payment_status").eq("id", input.registrationId).maybeSingle();
      if (existing.error && missingTable(existing.error)) return "missing";
      if (!existing.data) return "missing";
      if (existing.data.status === "paid" || existing.data.payment_status === "paid") return "already";
      const patch: Record<string, unknown> = {
        status: "paid",
        payment_status: "paid",
        stripe_checkout_session_id: input.sessionId,
        stripe_payment_intent_id: input.paymentIntent,
        amount_total: input.amountTotal,
        amount_paid: input.amountTotal == null ? null : input.amountTotal / 100,
        currency: input.currency,
      };
      let payload = { ...patch };
      for (let i = 0; i < 8; i++) {
        const updated = await db.from("seminar_registrations").update(payload).eq("id", input.registrationId).neq("payment_status", "paid");
        if (!updated.error) break;
        const column = missingColumn(updated.error.message || "");
        if (column && column in payload) {
          delete payload[column];
          continue;
        }
        console.error("[seminars] mark paid failed", updated.error.message);
        return "missing";
      }
      if (input.email) {
        const profile = await db.from("profiles").select("id").eq("email", input.email).maybeSingle();
        if (profile.data?.id) {
          await db.from("seminar_registrations").update({ profile_id: profile.data.id }).eq("id", input.registrationId);
        }
      }
      return "paid";
    },

    async incrementSold(seminarId) {
      const db = admin();
      const row = await db.from("seminars").select("seats_sold").eq("id", seminarId).maybeSingle();
      if (!row.error && row.data) {
        await db.from("seminars").update({ seats_sold: Number(row.data.seats_sold || 0) + 1 }).eq("id", seminarId);
      }
    },

    async enqueueReminders(registrationId, seminarId) {
      const db = admin();
      const seminar = await db.from("seminars").select("starts_at, ends_at, dates").eq("id", seminarId).maybeSingle();
      const start = seminar.data?.starts_at ? new Date(seminar.data.starts_at).getTime() : Date.now() + 1000 * 60 * 60 * 24 * 14;
      const jobs = [
        { kind: "confirmation", sendAt: new Date().toISOString() },
        ...SEMINAR_CONFIG.reminderOffsetsHours.map((hours) => ({
          kind: `reminder-${hours}`,
          sendAt: new Date(start - hours * 60 * 60 * 1000).toISOString(),
        })),
        { kind: "post-event", sendAt: new Date(start + 1000 * 60 * 60 * 6).toISOString() },
      ];
      for (const job of jobs) {
        const inserted = await insertFlexible("seminar_email_jobs", {
          registration_id: registrationId,
          seminar_id: seminarId,
          kind: job.kind,
          send_at: job.sendAt,
        });
        if (inserted.error && !missingTable(inserted.error)) {
          console.error("[seminars] email job", inserted.error.message);
        }
      }
    },

    async cancelPending(registrationId) {
      const db = admin();
      const row = await db.from("seminar_registrations").select("id, status, payment_status").eq("id", registrationId).maybeSingle();
      if (!row.data) return;
      if (row.data.status === "paid" || row.data.payment_status === "paid") return;
      await db.from("seminar_registrations").update({ status: "cancelled", payment_status: "cancelled" }).eq("id", registrationId);
    },

    async markRefunded(paymentIntentId) {
      const db = admin();
      const row = await db.from("seminar_registrations").select("id, status, seminar_id, payment_status").eq("stripe_payment_intent_id", paymentIntentId).maybeSingle();
      if (row.error && missingColumn(row.error.message || "") ) return "missing";
      if (!row.data) return "missing";
      if (row.data.status === "refunded") return "already";
      await db.from("seminar_registrations").update({ status: "refunded", payment_status: "refunded" }).eq("id", row.data.id);
      if (row.data.seminar_id) {
        const seminar = await db.from("seminars").select("seats_sold").eq("id", row.data.seminar_id).maybeSingle();
        if (seminar.data && Number(seminar.data.seats_sold) > 0) {
          await db.from("seminars").update({ seats_sold: Number(seminar.data.seats_sold) - 1 }).eq("id", row.data.seminar_id);
        }
      }
      return "refunded";
    },

    async savePackage(input) {
      const pack = input.packageId === "annual"
        ? { seminars: SEMINAR_CONFIG.packages.annual.seminars, months: SEMINAR_CONFIG.packages.annual.months }
        : { seminars: SEMINAR_CONFIG.packages.single.seminars, months: null as number | null };
      const starts = new Date();
      const expires = pack.months ? new Date(starts.getTime() + pack.months * 30 * 24 * 60 * 60 * 1000) : null;
      const saved = await insertFlexible("host_packages", {
        user_id: input.userId || null,
        package_id: input.packageId,
        stripe_checkout_session_id: input.sessionId,
        seminars_total: pack.seminars,
        seminars_used: 0,
        starts_at: starts.toISOString(),
        expires_at: expires ? expires.toISOString() : null,
        status: "active",
      });
      if (saved.error && missingTable(saved.error)) {
        await insertFlexible("leads", {
          email: input.email || "unknown@neurochiro.co",
          source: "seminar_package_paid",
          metadata: { session_id: input.sessionId, package_id: input.packageId, user_id: input.userId },
        });
      }
    },

    async saveFeatured(input) {
      const starts = new Date();
      const ends = new Date(starts.getTime() + SEMINAR_CONFIG.featuredAddon.days * 24 * 60 * 60 * 1000);
      const saved = await insertFlexible("seminar_featured_purchases", {
        seminar_id: input.seminarId,
        user_id: input.userId || null,
        stripe_checkout_session_id: input.sessionId,
        starts_at: starts.toISOString(),
        ends_at: ends.toISOString(),
      });
      if (!saved.error) {
        const db = admin();
        await db.from("seminars").update({ is_featured: true, featured_until: ends.toISOString() }).eq("id", input.seminarId);
      } else if (missingTable(saved.error)) {
        await insertFlexible("leads", {
          email: "seminars@neurochiro.co",
          source: "seminar_featured_paid",
          metadata: { session_id: input.sessionId, seminar_id: input.seminarId, user_id: input.userId },
        });
      }
    },

    async expirePackage(subscriptionId) {
      const db = admin();
      const updated = await db.from("host_packages").update({ status: "expired" }).eq("stripe_subscription_id", subscriptionId);
      if (updated.error && !missingTable(updated.error)) console.error("[seminars] expire package", updated.error.message);
    },
  };
}
