import Link from "next/link";
import { RegistrationStatus } from "./status";

export default async function RegisteredPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { slug } = await params;
  const query = await searchParams;
  return (
    <main className="min-h-dvh bg-neuro-cream px-5 pb-20 pt-28">
      <div className="mx-auto max-w-lg rounded-3xl bg-white p-6">
        <h1 className="text-3xl font-black text-neuro-navy">You&apos;re almost in</h1>
        <p className="mt-2 text-gray-600">This page waits for Stripe to confirm the payment. It does not mark the ticket paid by itself.</p>
        <RegistrationStatus slug={slug} registrationId={query.registration || ""} sessionId={query.session_id || ""} />
        <Link href={`/seminars/${slug}`} className="mt-6 inline-flex min-h-11 items-center text-sm font-bold text-neuro-orange">Back to the seminar</Link>
      </div>
    </main>
  );
}
