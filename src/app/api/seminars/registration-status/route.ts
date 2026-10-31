import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const registrationId = url.searchParams.get("registration") || "";
  if (!registrationId) return NextResponse.json({ status: "pending" });
  const admin = createAdminClient() as unknown as { from: (table: string) => any };
  const row = await admin.from("seminar_registrations").select("status, payment_status, stripe_checkout_session_id").eq("id", registrationId).maybeSingle();
  if (row.error || !row.data) return NextResponse.json({ status: "pending" });
  const sessionId = url.searchParams.get("session_id");
  if (row.data.stripe_checkout_session_id && sessionId && row.data.stripe_checkout_session_id !== sessionId) {
    return NextResponse.json({ status: "pending" });
  }
  const status = row.data.status || row.data.payment_status || "pending";
  return NextResponse.json({ status });
}
