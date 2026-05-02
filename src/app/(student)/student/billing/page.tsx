"use client";

import { CreditCard, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { getBillingData } from "./actions";
import { useRegion } from "@/context/RegionContext";

export default function StudentBilling() {
  const { region } = useRegion();
  const [loading, setLoading] = useState(true);
  const [billingData, setBillingData] = useState<any>(null);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  useEffect(() => {
    getBillingData()
      .then((data) => setBillingData(data))
      .finally(() => setLoading(false));
  }, []);

  const handleOpenPortal = async () => {
    setIsPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/create-portal-session", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error || "Failed to open billing portal.");
    } catch {
      alert("An error occurred. Please try again.");
    } finally {
      setIsPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-neuro-orange animate-spin" />
      </div>
    );
  }

  if (!billingData || billingData.noCustomer || billingData.error) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-black text-neuro-navy">Billing</h1>
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-bold text-neuro-navy mb-2">You&apos;re on the free plan</p>
          <p className="text-sm text-gray-500 mb-6">Upgrade to Student Pro for $29/month to unlock Interview Prep, Contract Lab, Financial Planner, and more.</p>
          <Link
            href="/pricing/students"
            className="inline-block px-6 py-3 bg-neuro-orange text-white font-bold rounded-xl text-sm hover:bg-neuro-orange-light transition-colors"
          >
            Upgrade to Student Pro — $29/mo
          </Link>
        </div>
      </div>
    );
  }

  const { subscription, invoices } = billingData;
  const isActive = subscription?.status === "active";

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-black text-neuro-navy">Billing</h1>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-neuro-navy text-lg">Student Membership</h2>
          <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${isActive ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"}`}>
            {subscription?.status || "Unknown"}
          </span>
        </div>
        {subscription?.price != null && (
          <p className="text-2xl font-black text-neuro-navy">
            ${subscription.price}<span className="text-sm font-normal text-gray-400">/{subscription.interval === "month" ? "mo" : "yr"}</span>
          </p>
        )}
        {subscription?.nextBilling && (
          <p className="text-xs text-gray-400">Next billing: {subscription.nextBilling}</p>
        )}
        <button
          onClick={handleOpenPortal}
          disabled={isPortalLoading}
          className="px-6 py-3 bg-neuro-navy text-white font-bold rounded-xl text-sm hover:bg-neuro-navy-light transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isPortalLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          Manage Subscription
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-bold text-neuro-navy text-lg mb-4">Payment History</h2>
        {invoices && invoices.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {invoices.map((inv: any) => (
              <a key={inv.id} href={inv.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors">
                <div>
                  <p className="text-sm font-medium text-neuro-navy">{inv.date}</p>
                  <span className={`text-xs font-bold uppercase ${inv.status === "paid" ? "text-green-600" : "text-gray-400"}`}>{inv.status}</span>
                </div>
                <span className="font-bold text-neuro-navy text-sm">${inv.amount.toFixed(2)}</span>
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-6">No payment history</p>
        )}
      </div>
    </div>
  );
}
