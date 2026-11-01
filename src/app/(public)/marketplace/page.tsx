"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ExternalLink, Store } from "lucide-react";
import Link from "next/link";
import Footer from "@/components/landing/Footer";
import PartnerDisclosure from "@/components/synapse/PartnerDisclosure";
import { getMarketplaceHome, type PublicVendor } from "./actions";

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").toUpperCase().slice(0, 2);
}

export default function MarketplacePage() {
  const [vendors, setVendors] = useState<PublicVendor[]>([]);
  const [activeSeats, setActiveSeats] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMarketplaceHome().then((home) => {
      setVendors(home.vendors);
      setActiveSeats(home.activeSeats);
      setLoading(false);
    });
  }, []);

  const categories = new Map<string, number>();
  for (const vendor of vendors) {
    for (const category of vendor.categories || []) {
      categories.set(category, (categories.get(category) || 0) + 1);
    }
  }

  return (
    <div className="min-h-dvh bg-[#F5F3EF]">
      <section className="bg-[#F5F3EF] px-6 pb-16 pt-32">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-[10px] font-black uppercase tracking-[0.4em] text-[#D66829]">NeuroChiro Synapse</p>
          <h1 className="mb-4 font-heading text-4xl font-black text-[#1E2D3B] md:text-6xl">Synapse</h1>
          {loading ? (
            <p className="text-gray-500">Loading partners…</p>
          ) : activeSeats === 0 ? (
            <>
              <p className="mx-auto mb-8 max-w-xl text-lg text-gray-600">Founding partners coming soon.</p>
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/marketplace/request" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1E2D3B] px-6 py-3 text-sm font-bold text-white">
                  Tell us which tools you want member deals on <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/marketplace/founding" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#D66829] px-6 py-3 text-sm font-bold text-white">
                  Apply for a founding seat
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="mx-auto mb-8 max-w-xl text-lg text-gray-600">
                {activeSeats} active {activeSeats === 1 ? "seat" : "seats"} across {categories.size} {categories.size === 1 ? "category" : "categories"}.
              </p>
              <Link href="/marketplace/founding" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#D66829] px-6 py-3 text-sm font-bold text-white">
                Apply for a seat <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>
      </section>

      {!loading && activeSeats > 0 && categories.size > 0 ? (
        <section className="mx-auto max-w-6xl px-6 pb-8">
          <div className="flex flex-wrap gap-2">
            {[...categories.entries()].map(([name, count]) => (
              <span key={name} className="inline-flex min-h-11 items-center rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold text-[#1E2D3B]">
                {name} · {count}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {!loading && vendors.length > 0 ? (
        <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-20 sm:grid-cols-2">
          {vendors.map((vendor) => {
            const kind = vendor.seatTier === "ally" ? "ally" : "anchor";
            return (
              <article key={vendor.id} className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6">
                <div className="mb-3 flex items-center gap-3">
                  {vendor.logo_url && /^https?:\/\//i.test(vendor.logo_url) && !/["'()]/.test(vendor.logo_url) ? (
                    <div role="img" aria-label="" className="h-12 w-12 rounded-xl bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${vendor.logo_url})` }} />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1E2D3B] text-sm font-black text-white">{initials(vendor.name || "V")}</div>
                  )}
                  <div>
                    <h2 className="font-heading text-lg font-black text-[#1E2D3B]">{vendor.name}</h2>
                    <p className="text-xs text-gray-400">{vendor.categories?.[0]}</p>
                  </div>
                </div>
                {vendor.short_description ? <p className="mb-4 line-clamp-3 text-sm text-gray-500">{vendor.short_description}</p> : null}
                <PartnerDisclosure kind={kind as "anchor" | "ally"} />
                <p className="mt-3 text-sm text-gray-600">Members unlock this perk in the portal.</p>
                <div className="mt-4 flex gap-2">
                  {vendor.slug ? (
                    <Link href={`/marketplace/${vendor.slug}`} className="inline-flex min-h-11 items-center rounded-xl bg-gray-100 px-4 text-sm font-bold text-[#1E2D3B]">Details</Link>
                  ) : null}
                  {vendor.website_url ? (
                    <a href={vendor.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#D66829] px-4 text-sm font-bold text-white">
                      Visit <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                </div>
              </article>
            );
          })}
        </section>
      ) : null}

      {!loading && activeSeats === 0 ? (
        <section className="mx-auto max-w-xl px-6 pb-20 text-center">
          <Store className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-500">No founding seats are live yet.</p>
        </section>
      ) : null}
      <Footer />
    </div>
  );
}
