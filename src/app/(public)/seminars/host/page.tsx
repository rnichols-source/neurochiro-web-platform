import type { Metadata } from "next";
import Link from "next/link";
import { SEMINAR_CONFIG } from "@/config/seminars";
import { formatMoney } from "@/lib/seminars/format";
import { listSeminars } from "@/lib/seminars/queries";
import { createServerSupabase } from "@/lib/supabase-server";
import { HostInterestForm, PackageButton } from "./interest-form";

export const metadata: Metadata = {
  title: "Host a seminar | NeuroChiro",
  description: "List a chiropractic seminar on NeuroChiro. Single seminar, annual host, and featured placement.",
  alternates: { canonical: "https://www.neurochiro.co/seminars/host" },
};

export default async function HostPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  const upcoming = await listSeminars({});
  const example = upcoming[0];
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const single = formatMoney(SEMINAR_CONFIG.packages.single.priceUsd, "USD");
  const annual = formatMoney(SEMINAR_CONFIG.packages.annual.priceUsd, "USD");
  const featured = formatMoney(SEMINAR_CONFIG.featuredAddon.priceUsd, "USD");

  return (
    <main data-nc-seminars="ready" className="min-h-dvh bg-neuro-cream px-5 pb-20 pt-28">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-black uppercase tracking-widest text-neuro-orange">Host</p>
        <h1 className="mt-2 text-4xl font-black text-neuro-navy">Put your seminar in front of nervous system chiropractors</h1>
        <p className="mt-3 max-w-2xl text-gray-600">Members and approved organizations can host. Every seminar is reviewed. There is no free listing, including for Pro members. {upcoming.length} upcoming events are on the board now.</p>
        {query.canceled ? <p className="mt-4 text-sm font-bold text-neuro-navy">Checkout canceled.</p> : null}

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-3xl bg-white p-5">
            <h2 className="text-xl font-black text-neuro-navy">{SEMINAR_CONFIG.packages.single.name}</h2>
            <p className="mt-2 text-3xl font-black text-neuro-orange">{single}</p>
            <p className="mt-2 text-sm text-gray-600">One seminar. One-time.</p>
            <div className="mt-4"><PackageButton packageId="single" label="Buy single" /></div>
          </article>
          <article className="rounded-3xl bg-white p-5">
            <h2 className="text-xl font-black text-neuro-navy">{SEMINAR_CONFIG.packages.annual.name}</h2>
            <p className="mt-2 text-3xl font-black text-neuro-orange">{annual}</p>
            <p className="mt-2 text-sm text-gray-600">Up to {SEMINAR_CONFIG.packages.annual.seminars} seminars a year.</p>
            <div className="mt-4"><PackageButton packageId="annual" label="Buy annual" /></div>
          </article>
          <article className="rounded-3xl bg-white p-5">
            <h2 className="text-xl font-black text-neuro-navy">Featured</h2>
            <p className="mt-2 text-3xl font-black text-neuro-orange">{featured}</p>
            <p className="mt-2 text-sm text-gray-600">{SEMINAR_CONFIG.featuredAddon.days} days on the featured rail, after the seminar is approved.</p>
          </article>
        </div>

        {example ? (
          <p className="mt-8 text-sm text-gray-600">A live page looks like <Link className="font-bold text-neuro-orange" href={`/seminars/${example.slug}`}>{example.title}</Link>.</p>
        ) : null}

        <section className="mt-10 grid gap-8 rounded-3xl bg-white p-6 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-black text-neuro-navy">Apply to host</h2>
            <p className="mt-2 text-sm text-gray-600">Logged-in doctors can also start a draft from the seminar dashboard. New drafts stay in review until an admin approves them.</p>
            {user ? <Link href="/doctor/seminars" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-neuro-navy px-4 text-sm font-bold text-white">Open your seminars</Link> : null}
          </div>
          <HostInterestForm />
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-black text-neuro-navy">FAQ</h2>
          <p className="mt-3 text-sm text-gray-700">Who can host? NeuroChiro members and approved organizations such as MLS, Dynamic Essentials, and IN8.</p>
          <p className="mt-2 text-sm text-gray-700">Do Pro members host free? No. Everyone pays to host.</p>
          <p className="mt-2 text-sm text-gray-700">Member ticket payouts through Stripe Connect are off.</p>
        </section>
      </div>
    </main>
  );
}
