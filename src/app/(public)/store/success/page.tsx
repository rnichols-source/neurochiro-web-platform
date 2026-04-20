"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, ArrowRight, Crown, UserPlus, ShoppingBag } from "lucide-react";
import Footer from "@/components/landing/Footer";
import { STORE_PRODUCTS, AUDIENCE_INFO, formatPrice } from "../store-data";
import { getSessionDetails } from "./actions";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }
    (async () => {
      const result = await getSessionDetails(sessionId);
      setDetails(result);
      setLoading(false);

      // Store purchased IDs in localStorage for "already purchased" state
      if (result?.productIds) {
        const existing = JSON.parse(localStorage.getItem("neurochiro-purchases") || "[]");
        const updated = [...new Set([...existing, ...result.productIds])];
        localStorage.setItem("neurochiro-purchases", JSON.stringify(updated));
      }
    })();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-[#fafbfc] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-neuro-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const products = (details?.productIds || [])
    .map((id: string) => STORE_PRODUCTS.find((p) => p.id === id))
    .filter(Boolean);

  const totalPaid = details?.amountTotal || 0;
  const memberTotal = products.reduce((s: number, p: any) => s + p.memberPrice, 0);
  const wouldHaveSaved = totalPaid - memberTotal;

  return (
    <div className="min-h-dvh bg-[#fafbfc]">
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-lg mx-auto">
          {/* Success Icon */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <Check className="w-10 h-10 text-green-600" strokeWidth={3} />
            </div>
            <h1 className="text-3xl font-black text-neuro-navy mb-2">
              Purchase Complete!
            </h1>
            <p className="text-gray-500">
              Thank you for your order. Here&apos;s what you got:
            </p>
          </div>

          {/* Purchased Items */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
            {products.map((product: any, i: number) => (
              <div
                key={product.id}
                className={`flex items-center gap-3 p-4 ${
                  i > 0 ? "border-t border-gray-50" : ""
                }`}
              >
                <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-neuro-navy text-sm truncate">
                    {product.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {product.billing === "monthly" ? "Monthly subscription" : "One-time purchase"}
                  </p>
                </div>
                <span className="text-sm font-bold text-neuro-navy">
                  ${formatPrice(product.retailPrice)}
                  {product.billing === "monthly" ? "/mo" : ""}
                </span>
              </div>
            ))}
            {products.length > 0 && (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-500">Total</span>
                <span className="text-lg font-black text-neuro-navy">
                  ${formatPrice(totalPaid)}
                </span>
              </div>
            )}
          </div>

          {/* Next Steps */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
            <h2 className="font-black text-neuro-navy mb-4">Next Steps</h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <UserPlus className="w-5 h-5 text-neuro-orange flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-neuro-navy">
                    Create your free account
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Sign up to access your purchases anytime. We&apos;ll link
                    everything to your account automatically.
                  </p>
                  <Link
                    href={`/register${details?.email ? `?email=${encodeURIComponent(details.email)}` : ""}`}
                    className="inline-flex items-center gap-1.5 mt-2 px-4 py-2 bg-neuro-navy text-white text-xs font-bold rounded-lg hover:bg-neuro-navy/90 transition-colors"
                  >
                    Create Account <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
              <div className="flex gap-3">
                <ShoppingBag className="w-5 h-5 text-neuro-orange flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-neuro-navy">
                    Check your email
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    A receipt has been sent to{" "}
                    {details?.email ? (
                      <span className="font-semibold">{details.email}</span>
                    ) : (
                      "your email"
                    )}
                    .
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Check className="w-5 h-5 text-neuro-orange flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-neuro-navy">
                    Access your purchases
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Once you&apos;re signed in, all your purchases will be
                    waiting for you.
                  </p>
                  <Link
                    href="/account/purchases"
                    className="inline-flex items-center gap-1.5 mt-2 px-4 py-2 bg-gray-100 text-neuro-navy text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    My Purchases <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Member Upsell */}
          {wouldHaveSaved > 0 && (
            <div className="bg-gradient-to-r from-neuro-navy to-[#2d3f5e] rounded-2xl p-6 text-white mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-neuro-orange" />
                <span className="text-xs font-black uppercase tracking-widest text-neuro-orange">
                  You could have saved more
                </span>
              </div>
              <p className="text-lg font-black mb-1">
                Members would have paid ${formatPrice(memberTotal)} for this
                order
              </p>
              <p className="text-sm text-gray-400 mb-4">
                That&apos;s ${formatPrice(wouldHaveSaved)} in savings — plus access
                to the full NeuroChiro platform.
              </p>
              <Link
                href="/pricing/doctors"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-neuro-orange text-white text-sm font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors"
              >
                See Membership Plans <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Continue Shopping */}
          <div className="text-center">
            <Link
              href="/store"
              className="text-sm text-gray-400 hover:text-neuro-navy transition-colors font-semibold"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-[#fafbfc] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-neuro-orange border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
