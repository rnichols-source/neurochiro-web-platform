import { notFound, permanentRedirect } from "next/navigation";
import { isUuid } from "@/lib/seminars/slug";
import { getSeminarBySlug } from "@/lib/seminars/queries";
import SpeakerClient from "./speaker-client";

export default async function SpeakerPage({ params }: { params: Promise<{ slug: string; speaker: string }> }) {
  const { slug, speaker } = await params;
  if (isUuid(slug)) {
    const seminar = await getSeminarBySlug(slug);
    if (!seminar) notFound();
    permanentRedirect(`/seminars/${seminar.slug}/speakers/${speaker}`);
  }
  return <SpeakerClient slug={slug} speakerParam={speaker} />;
}
