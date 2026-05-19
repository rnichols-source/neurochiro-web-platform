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
        <Loader2 className="w-8 h-8 text-[#D66829] animate-spin" />
      </div>
    );
  }

  if (!billingData || billingData.noCustomer) {
    return (
      <div className="space-y-8 p-6 md:p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white">Billing</h1>
        <p className="text-xs text-white/35 mt-1">Your membership includes every tool on this platform — no upgrades, no limits.</p>
        <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 p-8 text-center">
          <CreditCard className="w-10 h-10 text-white/10 mx-auto mb-4" />
          <p className="text-lg font-bold text-white mb-2">No active subscription</p>
          <p className="text-sm text-white/40 mb-6">Subscribe to unlock all student tools — Academy courses, Interview Playbook, Contract Lab, Financial Planner, job matching, and mentor discovery. One price, everything included.</p>
          <Link
            href="/pricing/students"
            className="inline-block px-6 py-3 bg-[#D66829] text-white font-bold rounded-lg text-sm hover:bg-[#e8834a] shadow-lg shadow-[#D66829]/20 transition-colors"
          >
            Upgrade to Premium — $12/mo
          </Link>
        </div>
      </div>
    );
  }

  const { subscription, invoices } = billingData;
  const isActive = subscription?.status === "active";

  return (
    <div className="space-y-8 p-6 md:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white">Billing</h1>
      <p className="text-xs text-white/35 mt-1">Your $12/mo membership includes every tool on this platform — no upgrades, no limits.</p>

      <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-white text-lg">Student Membership</h2>
          <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${isActive ? "bg-green-500/10 text-green-400" : "bg-[#D66829]/15 text-[#D66829]"}`}>
            {subscription?.status || "Unknown"}
          </span>
        </div>
        {subscription?.price != null && (
          <p className="text-2xl font-bold text-white">
            ${subscription.price}<span className="text-sm font-normal text-white/30">/{subscription.interval === "month" ? "mo" : "yr"}</span>
          </p>
        )}
        {subscription?.nextBilling && (
          <p className="text-xs text-white/30">Next billing: {subscription.nextBilling}</p>
        )}
        <button
          onClick={handleOpenPortal}
          disabled={isPortalLoading}
          className="px-6 py-3 bg-[#D66829] text-white font-semibold rounded-lg text-sm hover:bg-[#e8834a] shadow-lg shadow-[#D66829]/20 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isPortalLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          Manage Subscription
        </button>
      </div>

      <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 p-6">
        <h2 className="font-bold text-white text-lg mb-4">Payment History</h2>
        {invoices && invoices.length > 0 ? (
          <div className="divide-y divide-white/[0.06]">
            {invoices.map((inv: any) => (
              <a key={inv.id} href={inv.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between py-3 hover:bg-white/[0.04] -mx-2 px-2 rounded-lg transition-colors">
                <div>
                  <p className="text-sm font-medium text-white">{inv.date}</p>
                  <span className={`text-xs font-bold uppercase ${inv.status === "paid" ? "text-green-400" : "text-white/30"}`}>{inv.status}</span>
                </div>
                <span className="font-bold text-white text-sm">${inv.amount.toFixed(2)}</span>
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-white/30 text-center py-6">No payment history</p>
        )}
      </div>
    </div>
  );
}
