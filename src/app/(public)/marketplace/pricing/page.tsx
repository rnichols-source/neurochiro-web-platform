"use client";

import Link from "next/link";
import { CheckCircle2, Star, Zap } from "lucide-react";

const tiers = [
  {
    name: "Starter",
    price: 99,
    key: "starter" as const,
    description: "Get listed and start connecting with chiropractors.",
    features: [
      "Listed in marketplace directory",
      "Company profile page",
      "Exclusive member discount code",
      "Monthly analytics (views, clicks)",
      "Category listing",
    ],
    cta: "Get Started",
    highlight: false,
    badge: null,
  },
  {
    name: "Growth",
    price: 249,
    key: "growth" as const,
    description: "Stand out and generate leads with premium features.",
    features: [
      "Everything in Starter",
      "Featured placement in category",
      "Monthly vendor spotlight email to all doctors",
      "Publish educational content",
      "Lead capture form on profile",
      '"Growth" badge on listing',
    ],
    cta: "Choose Growth",
    highlight: true,
    badge: "Most Popular",
  },
  {
    name: "Partner",
    price: 499,
    key: "partner" as const,
    description: "The ultimate partnership for maximum visibility and trust.",
    features: [
      "Everything in Growth",
      'Homepage "Trusted Partners" section',
      "Sponsor a Spotlight episode",
      "Co-branded content with NeuroChiro",
      "Direct intros to top practices",
      '"NeuroChiro Recommended" badge',
      "Priority support",
    ],
    cta: "Become a Partner",
    highlight: false,
    badge: null,
  },
];

const faqs = [
  {
    q: "Can I switch tiers later?",
    a: "Yes. You can upgrade or downgrade your tier at any time. Changes take effect at the start of your next billing cycle.",
  },
  {
    q: "Is there a contract or commitment?",
    a: "No long-term contracts. All plans are month-to-month and you can cancel anytime.",
  },
  {
    q: "What happens after I apply?",
    a: "After payment, our team reviews your application within 48 hours. Once approved, your listing goes live in the marketplace.",
  },
  {
    q: "How do member discounts work?",
    a: "You provide an exclusive discount code for NeuroChiro members. We display it on your listing and promote it to our community.",
  },
  {
    q: "Can I sponsor content or events?",
    a: "Partner-tier vendors can sponsor Spotlight episodes and co-create content with NeuroChiro. Growth-tier vendors can publish educational content on the platform.",
  },
];

export default function MarketplacePricingPage() {
  return (
    <div className="min-h-dvh bg-[#F5F3EF] pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <span className="text-[#D66829] font-black uppercase tracking-[0.4em] text-[10px]">
            Pricing
          </span>
          <h1 className="text-4xl md:text-5xl font-heading font-black text-[#1E2D3B]">
            Choose Your Marketplace Tier
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto text-lg">
            Reach hundreds of nervous-system-first chiropractic practices. Pick
            the plan that fits your growth goals.
          </p>
        </div>

        {/* Tier Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {tiers.map((tier) => (
            <div
              key={tier.key}
              className={`relative bg-white rounded-2xl border p-8 flex flex-col transition-all ${
                tier.highlight
                  ? "border-[#D66829] shadow-2xl shadow-[#D66829]/10 scale-[1.02] md:scale-105 z-10"
                  : "border-gray-100 shadow-lg"
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#D66829] text-white text-xs font-black uppercase tracking-widest rounded-full">
                    <Star className="w-3.5 h-3.5 fill-white" />
                    {tier.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-xl font-heading font-black text-[#1E2D3B] mb-1">
                  {tier.name}
                </h2>
                <p className="text-gray-400 text-sm">{tier.description}</p>
              </div>

              <div className="mb-8">
                <span className="text-5xl font-black text-[#1E2D3B]">
                  ${tier.price}
                </span>
                <span className="text-gray-400 text-lg font-bold">/month</span>
              </div>

              <div className="space-y-3 mb-8 flex-1">
                {tier.features.map((f) => (
                  <div key={f} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-[#1E2D3B]/80">
                      {f}
                    </span>
                  </div>
                ))}
              </div>

              <Link
                href={`/marketplace/apply?tier=${tier.key}`}
                className={`block w-full py-4 font-black uppercase tracking-widest rounded-xl text-center text-sm transition-all ${
                  tier.highlight
                    ? "bg-[#D66829] text-white hover:bg-[#c25a22] shadow-lg shadow-[#D66829]/20"
                    : "bg-[#1E2D3B] text-white hover:bg-[#1E2D3B]/90"
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-heading font-black text-[#1E2D3B] text-center mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="bg-white rounded-xl border border-gray-100 p-6"
              >
                <h3 className="font-bold text-[#1E2D3B] mb-2">{faq.q}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-12">
          <Link
            href="/marketplace"
            className="inline-block text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-[#D66829] transition-colors"
          >
            Back to Marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}
