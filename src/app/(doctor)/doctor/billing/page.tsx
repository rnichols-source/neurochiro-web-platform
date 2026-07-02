"use client";

import { CreditCard, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { getBillingData } from "./actions";

export default function DoctorBilling() {
  const [loading, setLoading] = useState(true);
  const [billingData, setBillingData] = useState<any>(null);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  const [error, setError] = useState(false);

  useEffect(() => {
    getBillingData()
      .then((data) => setBillingData(data))
      .catch(() => setError(true))
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

  if (error) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-black text-neuro-navy">Billing</h1>
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <p className="text-red-500 font-bold mb-4">Unable to load billing information.</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-neuro-navy text-white rounded-xl text-sm font-bold">Retry</button>
        </div>
      </div>
    );
  }

  const handleActivatePro = async (cycle: "monthly" | "annual") => {
    setIsPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/upgrade-to-pro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycle }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert("Unable to start checkout. Please try again or contact support.");
    } catch {
      alert("An error occurred. Please try again.");
    } finally {
      setIsPortalLoading(false);
    }
  };

  if (!billingData || billingData.noCustomer) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-black text-neuro-navy">Billing</h1>
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <CreditCard className="w-10 h-10 text-neuro-orange mx-auto mb-4" />
          <p className="text-lg font-bold text-neuro-navy mb-2">Activate NeuroChiro Pro</p>
          <p className="text-sm text-gray-500 mb-2">Get found by patients. Full profile, analytics, messaging, Spotlight eligibility.</p>
          <p className="text-3xl font-black text-neuro-navy mt-4 mb-1">$49<span className="text-sm font-bold text-gray-400">/mo</span></p>
          <p className="text-xs text-gray-400 mb-6">or $490/yr (save $98). Cancel anytime.</p>
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <button
              onClick={() => handleActivatePro("monthly")}
              disabled={isPortalLoading}
              className="w-full px-6 py-4 bg-neuro-orange text-white font-black rounded-xl text-sm hover:bg-neuro-orange/90 transition-colors disabled:opacity-50 uppercase tracking-wider"
            >
              {isPortalLoading ? "Redirecting..." : "Activate Pro — $49/mo"}
            </button>
            <button
              onClick={() => handleActivatePro("annual")}
              disabled={isPortalLoading}
              className="w-full px-6 py-3 bg-neuro-navy text-white font-bold rounded-xl text-sm hover:bg-neuro-navy/90 transition-colors disabled:opacity-50"
            >
              Annual — $490/yr (Save $98)
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-4">Your profile will be removed from the directory on August 1 without an active Pro membership.</p>
        </div>
      </div>
    );
  }

  const { subscription, invoices, tier } = billingData;
  const planLabel = tier === "pro" || tier === "growth" ? "Pro" : "Free";
  const isActive = subscription?.status === "active";

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-black text-neuro-navy">Billing</h1>

      {/* Membership Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-neuro-navy text-lg">{planLabel} Plan</h2>
          <span
            className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${
              isActive ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"
            }`}
          >
            {subscription?.status || "Unknown"}
          </span>
        </div>
        {subscription?.price != null && (
          <p className="text-2xl font-black text-neuro-navy">
            ${subscription.price}
            <span className="text-sm font-normal text-gray-400">
              /{subscription.interval === "month" ? "mo" : "yr"}
            </span>
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
        <p className="text-xs text-gray-400 mt-2">Update your payment method, change plans, or cancel anytime from the Stripe portal.</p>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-bold text-neuro-navy text-lg mb-4">Payment History</h2>
        {invoices && invoices.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {invoices.map((inv: any) => (
              <a
                key={inv.id}
                href={inv.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-neuro-navy">{inv.date}</p>
                  <span
                    className={`text-xs font-bold uppercase ${
                      inv.status === "paid" ? "text-green-600" : "text-gray-400"
                    }`}
                  >
                    {inv.status}
                  </span>
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
