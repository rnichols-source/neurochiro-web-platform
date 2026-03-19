import { CreditCard, CheckCircle2, ShieldCheck, Zap, History, Download } from "lucide-react";

export default function StudentBilling() {
  const currentPlan = {
    name: "Foundation Membership",
    price: "$12",
    billingCycle: "monthly",
    status: "Active",
    nextBilling: "Nov 01, 2026"
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <header>
        <h1 className="text-4xl font-heading font-black text-neuro-navy">Billing & Membership</h1>
        <p className="text-neuro-gray mt-2 text-lg">Manage your subscription and payment methods.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Current Plan */}
          <section className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading font-black text-xl text-neuro-navy flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-neuro-orange" /> Current Membership
              </h3>
              <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                {currentPlan.status}
              </span>
            </div>
            
            <div className="flex flex-col md:flex-row gap-8 items-center border-b border-gray-50 pb-8 mb-8">
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Plan</p>
                <p className="text-3xl font-black text-neuro-navy">{currentPlan.name}</p>
                <p className="text-xs text-gray-400 mt-1 capitalize">{currentPlan.billingCycle} Billing • Renews: {currentPlan.nextBilling}</p>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{currentPlan.billingCycle === 'monthly' ? 'Monthly' : 'Annual'} Amount</p>
                <p className="text-3xl font-black text-neuro-navy">{currentPlan.price}<span className="text-sm text-gray-400 font-normal">/{currentPlan.billingCycle === 'monthly' ? 'mo' : 'yr'}</span></p>
              </div>
            </div>

            {currentPlan.billingCycle === 'monthly' && (
              <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                    <Zap className="w-6 h-6 fill-current" />
                  </div>
                  <div>
                    <h4 className="font-black text-neuro-navy uppercase tracking-tight">Switch to Annual & Save</h4>
                    <p className="text-xs text-gray-500">Switch to yearly billing and get <span className="text-blue-600 font-bold">2 months free</span> ($24 savings).</p>
                  </div>
                </div>
                <button className="px-6 py-3 bg-neuro-navy text-white font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-neuro-navy-light transition-all shadow-xl">
                  Upgrade to Annual
                </button>
              </div>
            )}

            <div className="mt-8 pt-8 border-t border-gray-50 flex gap-4">
              <button className="px-6 py-3 bg-neuro-navy text-white font-black rounded-xl hover:bg-neuro-navy-light transition-all shadow-lg text-sm">
                Upgrade Plan
              </button>
              <button className="px-6 py-3 bg-white border border-gray-200 text-neuro-navy font-bold rounded-xl hover:bg-gray-50 transition-all text-sm">
                Cancel Membership
              </button>
            </div>
          </section>

          {/* Payment Method */}
          <section className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
            <h3 className="font-heading font-black text-xl text-neuro-navy mb-6 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-blue-500" /> Payment Method
            </h3>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-8 bg-white rounded border border-gray-200 flex items-center justify-center">
                  <span className="font-black text-xs italic">VISA</span>
                </div>
                <div>
                  <p className="font-bold text-neuro-navy text-sm">•••• •••• •••• 4242</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">Expires 12/28</p>
                </div>
              </div>
              <button className="text-xs font-bold text-neuro-orange hover:underline">Update</button>
            </div>
          </section>

          {/* Invoice History */}
          <section className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
            <h3 className="font-heading font-black text-xl text-neuro-navy mb-6 flex items-center gap-2">
              <History className="w-6 h-6 text-gray-400" /> Payment History
            </h3>
            <div className="space-y-4">
              {[
                { date: "Oct 01, 2026", amount: "$0.00", status: "Paid", invoice: "INV-001" },
                { date: "Sep 01, 2026", amount: "$0.00", status: "Paid", invoice: "INV-000" }
              ].map((inv, i) => (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-green-50 rounded-xl text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-neuro-navy text-sm">{inv.date}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">{inv.invoice}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <span className="font-black text-neuro-navy">{inv.amount}</span>
                    <Download className="w-4 h-4 text-gray-300 group-hover:text-neuro-orange transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Upgrade Sidebar */}
        <div className="space-y-6">
          <section className="bg-gradient-to-br from-neuro-navy to-neuro-navy-dark rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-neuro-orange/20 blur-3xl -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <Zap className="w-6 h-6 text-neuro-orange" />
                <span className="text-xs font-black uppercase tracking-widest text-neuro-orange">Premium Benefits</span>
              </div>
              <h3 className="text-2xl font-heading font-black mb-4 leading-tight">Unlock your full potential.</h3>
              <ul className="space-y-3 mb-8">
                {[
                  "Clinical Playbooks",
                  "Job Applications",
                  "Mentor Messaging",
                  "Seminar Discounts"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-neuro-orange shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <button className="w-full py-4 bg-neuro-orange text-white font-black rounded-2xl hover:bg-neuro-orange-light transition-all shadow-xl shadow-neuro-orange/20">
                Upgrade for $19/mo
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
