import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: 'ChiroMatch',
  description: 'Students and practices on NeuroChiro both say yes before a conversation starts.',
  alternates: { canonical: 'https://neurochiro.co/chiromatch' },
};

export default function ChiroMatchPublicPage() {
  return (
    <div className="min-h-dvh bg-[#F7F8FA] text-[#14212e]">
      <section className="bg-[#14212e] px-6 pb-16 pt-28 text-white">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-heading text-4xl font-bold text-white md:text-5xl">ChiroMatch</h1>
          <p className="mt-4 max-w-2xl text-base text-white">
            Students and practices answer the same questions. You see a match percent and a short reason. A conversation starts only when both of you say yes.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/students" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#D66829] px-5 text-base font-bold text-white">For students</Link>
            <Link href="/pricing/doctors" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white px-5 text-base font-bold text-white">For doctors</Link>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-6 py-14">
        <h2 className="font-heading text-2xl font-bold">How it works</h2>
        <ol className="mt-6 space-y-4">
          <li className="rounded-xl border border-[#e3e8ed] bg-white p-4">
            <h3 className="text-lg font-bold">1. Answer the questions</h3>
            <p className="mt-1 text-base text-[#3d4d5c]">Technique, the people you want to care for, pay, location, and what you are looking for.</p>
          </li>
          <li className="rounded-xl border border-[#e3e8ed] bg-white p-4">
            <h3 className="text-lg font-bold">2. See the match percent</h3>
            <p className="mt-1 text-base text-[#3d4d5c]">The number says how closely the answers line up. It is a starting point, not a verdict.</p>
          </li>
          <li className="rounded-xl border border-[#e3e8ed] bg-white p-4">
            <h3 className="text-lg font-bold">3. Both say yes</h3>
            <p className="mt-1 text-base text-[#3d4d5c]">Then you can message, ask for a shadow day, or set up a call. A pass stays private.</p>
          </li>
        </ol>
      </section>
      <Footer />
    </div>
  );
}
