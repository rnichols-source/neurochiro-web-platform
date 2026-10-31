import { Suspense } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import { isUuid } from "@/lib/seminars/slug";
import { getSeminarBySlug } from "@/lib/seminars/queries";
import CheckInClient from "./check-in-client";

export default async function CheckInPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (isUuid(slug)) {
    const seminar = await getSeminarBySlug(slug);
    if (!seminar) notFound();
    permanentRedirect(`/seminars/${seminar.slug}/checkin`);
  }
  return <Suspense fallback={null}><CheckInClient /></Suspense>;
}
