"use client";

import { CreditCard, CheckCircle2, ShieldCheck, Zap, History, Download, DollarSign, TrendingUp, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { getBillingData } from "./actions";

export default function DoctorBilling() {
  const [loading, setLoading] = useState(true);
  const [billingData, setBillingData] = useState<any>(null);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      const data = await getBillingData();
      setBillingData(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleOpenPortal = async () => {
    setIsPortalLoading(true);
    try {
      const response = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to open billing portal.");
      }
    } catch (err) {
      alert("An error occurred. Please try again.");
    } finally {
      setIsPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-neuro-cream">
        <Loader2 className="w-10 h-10 text-neuro-orange animate-spin mb-4" />
        <p className="text-[10px] font-black text-neuro-navy uppercase tracking-[0.3em]">Synchronizing Secure Billing...</p>
      </div>
    );
  }

  if (!billingData || billingData.noCustomer) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-[2rem] flex items-center justify-center mb-6">
          <CreditCard className="w-10 h-10 text-gray-400" />
        </div>
        <h1 className="text-3xl font-black text-neuro-navy mb-4">No Active Subscription</h1>
        <p className="text-gray-500 max-w-md mb-8">
          You are currently on the <span className="font-bold text-neuro-orange capitalize">{billingData?.tier || 'free'}</span> tier. Upgrade to unlock full clinical analytics and student discovery.
        </p>
        <Link 
          href="/pricing" 
          className="px-10 py-4 bg-neuro-orange text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-xl shadow-neuro-orange/30 hover:scale-105 transition-all"
        >
          View Membership Plans
        </Link>
      </div>
    );
  }

  const { subscription, invoices, tier } = billingData;
  const planName = tier === 'starter' ? "Starter Doctor Membership" : tier === 'growth' ? "Growth Practice Membership" : "Pro Clinical Membership";

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-heading font-black text-neuro-navy">Billing & Subscriptions</h1>
          <p className="text-neuro-gray mt-2 text-lg">Manage your practice membership and history.</p>
        </div>
        <div className="bg-white border border-gray-100 px-6 py-3 rounded-2xl flex items-center gap-4 shadow-sm">
           <div className="p-2 bg-neuro-orange/10 rounded-xl text-neuro-orange">
              <ShieldCheck className="w-5 h-5" />
           </div>
           <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Status</p>
              <p className="text-lg font-black text-neuro-navy capitalize">{subscription?.status || 'Active'}</p>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Subscription Status */}
          <section className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading font-black text-xl text-neuro-navy flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-neuro-orange" /> Practice Membership
              </h3>
              <span className={cn(
                "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full",
                subscription?.status === 'active' ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"
              )}>
                {subscription?.status || 'Unknown'}
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 border-b border-gray-50 pb-8 mb-8">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Plan</p>
                <p className="text-2xl font-black text-neuro-navy">{planName}</p>
                <p className="text-xs text-gray-400 mt-1 capitalize">{subscription?.interval} Billing • Next: {subscription?.nextBilling}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Billing Amount</p>
                <p className="text-2xl font-black text-neuro-navy">${subscription?.price}<span className="text-sm text-gray-400 font-normal">/{subscription?.interval === 'month' ? 'mo' : 'yr'}</span></p>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                   <ShieldCheck className="w-3 h-3 text-green-500" /> Card ending in {subscription?.paymentMethod || '••••'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <button 
                onClick={handleOpenPortal}
                disabled={isPortalLoading}
                className="px-8 py-4 bg-neuro-navy text-white font-black rounded-2xl uppercase tracking-widest text-[10px] hover:bg-neuro-navy-light transition-all shadow-xl disabled:opacity-50 flex items-center gap-2"
              >
                {isPortalLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                Manage Billing & Plan
              </button>
              <button 
                onClick={handleOpenPortal}
                className="px-8 py-4 bg-white border border-gray-200 text-gray-400 font-black rounded-2xl uppercase tracking-widest text-[10px] hover:bg-gray-50 transition-all"
              >
                Update Payment Method
              </button>
            </div>
          </section>

          {/* Transaction History */}
          <section className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
            <h3 className="font-heading font-black text-xl text-neuro-navy mb-6 flex items-center gap-2">
              <History className="w-6 h-6 text-gray-400" /> Transaction History
            </h3>
            <div className="space-y-2">
              {invoices && invoices.length > 0 ? invoices.map((inv: any, i: number) => (
                <a 
                  key={i} 
                  href={inv.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors group cursor-pointer border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-xl bg-gray-100 text-gray-500">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-neuro-navy text-sm">Membership Invoice {inv.number}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">{inv.date}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-6">
                    <div className="hidden sm:block">
                       <span className={cn(
                         "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                         inv.status === 'paid' ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-400"
                       )}>
                         {inv.status}
                       </span>
                    </div>
                    <span className="font-black text-neuro-navy text-sm">${inv.amount.toFixed(2)}</span>
                    <Download className="w-4 h-4 text-gray-300 group-hover:text-neuro-orange transition-colors" />
                  </div>
                </a>
              )) : (
                <div className="py-8 text-center">
                   <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">No transaction history found</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <section className="bg-neuro-navy rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-neuro-orange/10 blur-3xl -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <h3 className="text-xl font-heading font-black mb-4">Practice Payouts</h3>
              <p className="text-gray-400 text-xs mb-6 leading-relaxed font-bold">
                 Manage how you receive payments for seminar ticket sales and associate recruitment bonuses.
              </p>
              
              <div className="bg-white/10 rounded-xl p-4 border border-white/10 mb-6">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Linked Account</p>
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-bold">Stripe Connect Active</span>
                 </div>
              </div>

              <button className="w-full py-4 bg-neuro-orange text-white font-black rounded-xl hover:bg-neuro-orange-light transition-all shadow-lg text-[10px] uppercase tracking-widest">
                Manage Payout Dashboard
              </button>
            </div>
          </section>

          <section className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
             <h4 className="font-black text-neuro-navy mb-6 text-[10px] uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-neuro-orange" /> Legal & Tax
             </h4>
             <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                   <span className="text-xs font-bold text-neuro-navy">2025 1099-K (Digital)</span>
                   <Download className="w-4 h-4 text-gray-400" />
                </button>
                <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                   <span className="text-xs font-bold text-neuro-navy">Membership Agreement</span>
                   <Download className="w-4 h-4 text-gray-400" />
                </button>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
