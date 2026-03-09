"use client";

import { CreditCard, CheckCircle2, ShieldCheck, Zap, History, Download, DollarSign, TrendingUp } from "lucide-react";
import { useDoctorTier } from "@/context/DoctorTierContext";

export default function DoctorBilling() {
  const { tier } = useDoctorTier();
  
  const subscription = {
    plan: tier === 'starter' ? "Starter Doctor Membership" : tier === 'growth' ? "Growth Practice Membership" : "Pro Clinical Membership",
    price: tier === 'starter' ? "$199" : tier === 'growth' ? "$499" : "$999",
    billingCycle: "monthly",
    status: "Active",
    nextBilling: "Nov 01, 2026"
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-heading font-black text-neuro-navy">Billing & Subscriptions</h1>
          <p className="text-neuro-gray mt-2 text-lg">Manage your practice membership and payouts.</p>
        </div>
        <div className="bg-green-50 border border-green-100 px-6 py-3 rounded-2xl flex items-center gap-4">
           <div className="p-2 bg-green-100 rounded-xl text-green-600">
              <DollarSign className="w-5 h-5" />
           </div>
           <div>
              <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Next Payout</p>
              <p className="text-xl font-black text-neuro-navy">$4,250.00</p>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Subscription Status */}
          <section className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading font-black text-xl text-neuro-navy flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-neuro-orange" /> Practice Membership
              </h3>
              <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                {subscription.status}
              </span>
            </div>
            
            <div className="flex flex-col md:flex-row gap-8 items-center border-b border-gray-50 pb-8 mb-8">
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Current Plan</p>
                <p className="text-3xl font-black text-neuro-navy">{subscription.plan}</p>
                <p className="text-xs text-gray-400 mt-1 capitalize">{subscription.billingCycle} Billing • Next: {subscription.nextBilling}</p>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{subscription.billingCycle === 'monthly' ? 'Monthly' : 'Annual'} Total</p>
                <p className="text-3xl font-black text-neuro-navy">{subscription.price}<span className="text-sm text-gray-400 font-normal">/{subscription.billingCycle === 'monthly' ? 'mo' : 'yr'}</span></p>
              </div>
            </div>

            {subscription.billingCycle === 'monthly' && (
              <div className="bg-neuro-orange/5 border border-neuro-orange/20 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-neuro-orange rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                    <Zap className="w-6 h-6 fill-current" />
                  </div>
                  <div>
                    <h4 className="font-black text-neuro-navy">Upgrade to Annual</h4>
                    <p className="text-xs text-gray-500">Switch to yearly billing and get <span className="text-neuro-orange font-bold">2 months free</span>.</p>
                  </div>
                </div>
                <button className="px-6 py-3 bg-neuro-navy text-white font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-neuro-navy-light transition-all shadow-xl">
                  Switch to Annual Plan
                </button>
              </div>
            )}

            <div className="flex gap-4">
              <button className="px-6 py-3 bg-white border border-gray-200 text-neuro-navy font-bold rounded-xl hover:bg-gray-50 transition-all text-sm">
                Change Payment Method
              </button>
              <button className="px-6 py-3 bg-white border border-gray-200 text-neuro-navy font-bold rounded-xl hover:bg-gray-50 transition-all text-sm text-red-500 hover:text-red-600 hover:border-red-100 hover:bg-red-50">
                Cancel Subscription
              </button>
            </div>
          </section>

          {/* Transaction History */}
          <section className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
            <h3 className="font-heading font-black text-xl text-neuro-navy mb-6 flex items-center gap-2">
              <History className="w-6 h-6 text-gray-400" /> Transaction History
            </h3>
            <div className="space-y-2">
              {[
                { date: "Oct 01, 2026", desc: "Monthly Membership", amount: `-${subscription.price}.00`, type: "debit" },
                { date: "Sep 15, 2026", desc: "Seminar Payout - PHX", amount: "+$3,240.00", type: "credit" },
                { date: "Sep 01, 2026", desc: "Monthly Membership", amount: `-${subscription.price}.00`, type: "debit" }
              ].map((tx, i) => (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors group cursor-pointer border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl ${tx.type === 'credit' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                      {tx.type === 'credit' ? <TrendingUp className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-bold text-neuro-navy text-sm">{tx.desc}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">{tx.date}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <span className={`font-black ${tx.type === 'credit' ? 'text-green-600' : 'text-neuro-navy'}`}>{tx.amount}</span>
                    <Download className="w-4 h-4 text-gray-300 group-hover:text-neuro-orange transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <section className="bg-neuro-navy rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-neuro-orange/10 blur-3xl -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <h3 className="text-xl font-heading font-black mb-4">Payout Settings</h3>
              <p className="text-gray-400 text-xs mb-6 leading-relaxed">
                 Manage how you receive payments for seminar ticket sales and mastermind subscriptions.
              </p>
              
              <div className="bg-white/10 rounded-xl p-4 border border-white/10 mb-6">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Account</p>
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-bold">Stripe Connect •••• 4291</span>
                 </div>
              </div>

              <button className="w-full py-3 bg-neuro-orange text-white font-black rounded-xl hover:bg-neuro-orange-light transition-all shadow-lg text-xs uppercase tracking-widest">
                Manage Payouts
              </button>
            </div>
          </section>

          <section className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
             <h4 className="font-bold text-neuro-navy mb-4 text-sm uppercase tracking-widest">Tax Documents</h4>
             <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                   <span className="text-xs font-bold text-neuro-navy">2025 1099-K</span>
                   <Download className="w-4 h-4 text-gray-400" />
                </button>
                <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                   <span className="text-xs font-bold text-neuro-navy">2024 1099-K</span>
                   <Download className="w-4 h-4 text-gray-400" />
                </button>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
}
