import { getSeminarBySlug } from "@/lib/seminars/queries";
import { buildIcs } from "@/lib/seminars/ics";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const seminar = await getSeminarBySlug(slug);
  if (!seminar?.startDate) return new Response("Not found", { status: 404 });
  const body = buildIcs(seminar);
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${seminar.slug}.ics"`,
    },
  });
}
