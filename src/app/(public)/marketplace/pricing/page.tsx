import Link from "next/link";
import Footer from "@/components/landing/Footer";
import { ADDONS, ANCHOR_TERMS, ALLY_ANNUAL_CENTS, formatDollars, RENEWAL_CAP } from "@/lib/synapse/config";

export const metadata = {
  title: "Synapse pricing | NeuroChiro",
  description: "Anchor and Ally seats for NeuroChiro Synapse partners.",
};

export default function MarketplacePricingPage() {
  const cards = [
    {
      name: "Anchor · Core",
      price: `${formatDollars(ANCHOR_TERMS.core.floorCents)} floor`,
      detail: `${formatDollars(ANCHOR_TERMS.core.rateCents)} per active paying member, per year. The fee is the higher of the floor and that rate. One seat per category and country.`,
    },
    {
      name: "Anchor · Standard",
      price: `${formatDollars(ANCHOR_TERMS.standard.floorCents)} floor`,
      detail: `${formatDollars(ANCHOR_TERMS.standard.rateCents)} per active paying member, per year. Same formula, one exclusive seat.`,
    },
    {
      name: "Ally",
      price: `${formatDollars(ALLY_ANNUAL_CENTS)}/yr`,
      detail: "Not exclusive. The perk shows in the member wallet. No category lock.",
    },
  ];

  return (
    <div className="min-h-dvh bg-[#F5F3EF]">
      <section className="mx-auto max-w-5xl px-6 pb-16 pt-32">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D66829]">Synapse</p>
        <h1 className="mt-3 font-heading text-4xl font-black text-[#1E2D3B]">Partner pricing</h1>
        <p className="mt-4 max-w-2xl text-gray-600">
          Founding Anchors pay the floor in year 1. A later renewal cannot rise more than {Math.round((RENEWAL_CAP - 1) * 100)}%.
          A seat needs a Proof Score of at least 4.3, from 5 or more ratings in the last 180 days, and a best-member-price pledge.
          Below 4.3 the seat is at risk. Below 4.0 for two quarters in a row it is in review. NeuroChiro does not revoke a seat automatically.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <article key={card.name} className="rounded-2xl border border-gray-100 bg-white p-6">
              <h2 className="font-heading text-xl font-black text-[#1E2D3B]">{card.name}</h2>
              <p className="mt-2 text-2xl font-black text-[#D66829]">{card.price}</p>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">{card.detail}</p>
            </article>
          ))}
        </div>
        <h2 className="mt-12 font-heading text-2xl font-black text-[#1E2D3B]">Add-ons</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {ADDONS.map((addon) => (
            <li key={addon.key} className="flex min-h-11 items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3">
              <span className="font-bold text-[#1E2D3B]">{addon.label}</span>
              <span className="text-sm font-bold text-[#D66829]">{formatDollars(addon.cents)}</span>
            </li>
          ))}
        </ul>
        <Link href="/marketplace/founding" className="mt-10 inline-flex min-h-11 items-center rounded-xl bg-[#D66829] px-6 py-3 text-sm font-bold text-white">
          Apply for a founding seat
        </Link>
      </section>
      <Footer />
    </div>
  );
}
