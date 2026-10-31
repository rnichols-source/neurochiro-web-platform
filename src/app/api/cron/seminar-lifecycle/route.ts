import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

function missing(error: { message?: string; code?: string } | null): boolean {
  const message = error?.message || "";
  return error?.code === "42P01" || error?.code === "PGRST204" || error?.code === "PGRST205" || /schema cache|does not exist|could not find/i.test(message);
}

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient() as unknown as { from: (table: string) => any };
  const now = new Date().toISOString();
  const completed = await admin.from("seminars").update({ status: "completed" }).eq("status", "published").lt("ends_at", now);
  if (completed.error && missing(completed.error)) return NextResponse.json({ ok: true, skipped: true });
  const featured = await admin.from("seminars").update({ is_featured: false }).eq("is_featured", true).lt("featured_until", now);
  if (featured.error && missing(featured.error)) return NextResponse.json({ ok: true, skipped: true });
  return NextResponse.json({ ok: true, completed: !completed.error, featured: !featured.error });
}
