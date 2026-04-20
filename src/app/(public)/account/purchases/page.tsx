"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  Crown,
  ArrowRight,
  ShoppingBag,
  ExternalLink,
  LogIn,
  Check,
  Clock,
} from "lucide-react";
import Footer from "@/components/landing/Footer";
import {
  STORE_PRODUCTS,
  CATEGORY_INFO,
  formatPrice,
  type StoreProduct,
} from "../../store/store-data";
import { getMyPurchases, type PurchaseRecord } from "./actions";

// Map product IDs to where they can be accessed
function getAccessLink(productId: string): { href: string; label: string } | null {
  // Courses -> student academy
  if (productId.startsWith("course-")) {
    return { href: "/student/academy", label: "Go to Academy" };
  }
  // Workshop kits -> doctor workshops
  if (productId.startsWith("workshop-")) {
    return { href: "/doctor/workshops", label: "Open Workshop Kit" };
  }
  // Contracts -> doctor contract lab
  if (productId.startsWith("contract-")) {
    return { href: "/student/contract-lab", label: "Open Contract Lab" };
  }
  // P&L Analyzer
  if (productId === "pl-analyzer") {
    return { href: "/doctor/pl-analyzer", label: "Open P&L Analyzer" };
  }
  // KPI Tracker
  if (productId === "kpi-tracker") {
    return { href: "/doctor/kpi", label: "Open KPI Tracker" };
  }
  // Scan Report Generator
  if (productId === "scan-report") {
    return { href: "/doctor/scan-reports", label: "Open Scan Reports" };
  }
  // Billing Guide
  if (productId === "billing-guide") {
    return { href: "/doctor/billing", label: "Open Billing Toolkit" };
  }
  // Content Library
  if (productId === "content-library") {
    return { href: "/doctor/content-library", label: "Open Content Library" };
  }
  // Patient products
  if (productId === "patient-premium") {
    return { href: "/portal/dashboard", label: "Go to Patient Portal" };
  }
  if (productId.startsWith("patient-")) {
    return { href: "/portal/dashboard", label: "Go to Patient Portal" };
  }
  return null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function MyPurchasesPage() {
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const result = await getMyPurchases();
      setPurchases(result.purchases);
      setEmail(result.email);
      if (result.error) setError(result.error);
      setLoading(false);
    })();
  }, []);

  // Match purchases to product catalog
  const purchasedProducts = purchases
    .map((p) => {
      const product = STORE_PRODUCTS.find((sp) => sp.id === p.course_id);
      return product ? { purchase: p, product } : null;
    })
    .filter(Boolean) as { purchase: PurchaseRecord; product: StoreProduct }[];

  // Calculate member savings
  const totalPaid = purchasedProducts.reduce(
    (s, { purchase }) => s + (purchase.amount || 0),
    0,
  );
  const memberWouldPay = purchasedProducts.reduce(
    (s, { product }) => s + product.memberPrice,
    0,
  );
  const couldHaveSaved = totalPaid - memberWouldPay;

  if (loading) {
    return (
      <div className="min-h-dvh bg-[#fafbfc] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-neuro-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in
  if (error === "not_logged_in") {
    return (
      <div className="min-h-dvh bg-[#fafbfc]">
        <div className="pt-32 pb-20 px-6">
          <div className="max-w-md mx-auto text-center">
            <LogIn className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-black text-neuro-navy mb-2">
              Sign in to view your purchases
            </h1>
            <p className="text-gray-500 text-sm mb-6">
              Log in with the email you used at checkout to access everything
              you&apos;ve bought.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-neuro-navy text-white font-bold rounded-xl hover:bg-neuro-navy/90 transition-colors"
            >
              Sign In <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-xs text-gray-400 mt-4">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-neuro-orange font-semibold hover:underline"
              >
                Create one free
              </Link>{" "}
              — your purchases will link automatically.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#fafbfc]">
      {/* Header */}
      <section className="bg-neuro-navy text-white pt-32 pb-12 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neuro-orange mb-3">
            My Account
          </p>
          <h1 className="text-3xl md:text-4xl font-black mb-2">
            My Purchases
          </h1>
          <p className="text-gray-400">
            {email && (
              <>
                Signed in as{" "}
                <span className="text-white font-semibold">{email}</span>
              </>
            )}
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Member Upsell */}
        {couldHaveSaved > 0 && (
          <div className="bg-gradient-to-r from-neuro-navy to-[#2d3f5e] rounded-2xl p-6 text-white mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-neuro-orange" />
              <span className="text-xs font-black uppercase tracking-widest text-neuro-orange">
                Save on future purchases
              </span>
            </div>
            <p className="text-lg font-bold mb-1">
              You could have saved ${formatPrice(couldHaveSaved)} as a member
            </p>
            <p className="text-sm text-gray-400 mb-4">
              Members get every product at the lowest price — plus the full
              NeuroChiro platform.
            </p>
            <Link
              href="/pricing/doctors"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-neuro-orange text-white text-sm font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors"
            >
              See Membership Plans <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Purchases List */}
        {purchasedProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-neuro-navy mb-2">
              No purchases yet
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              Browse the store and find tools to grow your practice.
            </p>
            <Link
              href="/store"
              className="inline-flex items-center gap-2 px-6 py-3 bg-neuro-orange text-white font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors"
            >
              Browse the Store <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {purchasedProducts.map(({ purchase, product }) => {
              const access = getAccessLink(product.id);
              const categoryLabel = CATEGORY_INFO[product.category]?.label;

              return (
                <div
                  key={purchase.id}
                  className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Check className="w-5 h-5 text-green-600" />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-neuro-navy text-sm">
                            {product.name}
                          </h3>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {categoryLabel}
                            {purchase.created_at && (
                              <>
                                {" "}
                                <span className="mx-1">·</span>{" "}
                                <Clock className="w-3 h-3 inline -mt-0.5" />{" "}
                                {formatDate(purchase.created_at)}
                              </>
                            )}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-neuro-navy whitespace-nowrap">
                          {purchase.amount
                            ? `$${formatPrice(purchase.amount)}`
                            : `$${formatPrice(product.retailPrice)}`}
                        </span>
                      </div>

                      {/* Access Button */}
                      {access && (
                        <Link
                          href={access.href}
                          className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-neuro-navy text-white text-xs font-bold rounded-lg hover:bg-neuro-navy/90 transition-colors"
                        >
                          {access.label}
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Continue Shopping */}
        <div className="text-center mt-10">
          <Link
            href="/store"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-neuro-navy transition-colors font-semibold"
          >
            <ShoppingBag className="w-4 h-4" />
            Continue Shopping
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
