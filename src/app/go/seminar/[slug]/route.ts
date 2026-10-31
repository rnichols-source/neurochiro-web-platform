import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getSeminarBySlug } from "@/lib/seminars/queries";
import { appendUtm } from "@/lib/seminars/utm";
import { insertFlexible } from "@/lib/seminars/write";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const seminar = await getSeminarBySlug(slug);
  if (!seminar?.registrationLink) {
    return NextResponse.redirect(new URL("/seminars", request.url), 302);
  }
  let target: string;
  try {
    target = appendUtm(seminar.registrationLink, seminar.slug);
  } catch {
    return NextResponse.json({ error: "Registration link must be HTTPS" }, { status: 400 });
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
  const salt = process.env.CRON_SECRET || "neurochiro-seminar-click";
  const ipHash = ip ? createHash("sha256").update(`${salt}:${ip}`).digest("hex") : null;
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const url = new URL(target);
  await insertFlexible("seminar_outbound_clicks", {
    seminar_id: seminar.id,
    profile_id: user?.id || null,
    ip_hash: ipHash,
    ua: (request.headers.get("user-agent") || "").slice(0, 180),
    utm: {
      utm_source: url.searchParams.get("utm_source"),
      utm_medium: url.searchParams.get("utm_medium"),
      utm_campaign: url.searchParams.get("utm_campaign"),
    },
  });
  return NextResponse.redirect(target, 302);
}
