"use client";

import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  Download, 
  Filter,
  BarChart3,
  PieChart,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { useState } from "react";

export default function AdminRevenue() {
  const [timeRange, setTimeRange] = useState("30D");

  const revenueStats = [
    { label: "Total Revenue", value: "$124,500", trend: "+12.5%", isUp: true, icon: DollarSign },
    { label: "MRR", value: "$42,200", trend: "+8.1%", isUp: true, icon: TrendingUp },
    { label: "Active Subscriptions", value: "842", trend: "+14", isUp: true, icon: CreditCard },
    { label: "Failed Payments", value: "12", trend: "-3", isUp: false, icon: AlertCircle },
  ];

  const transactions = [
    { id: "TX-9021", user: "Dr. Sarah Chen", amount: "$299.00", status: "Succeeded", date: "2m ago", type: "Pro Plan (Monthly)" },
    { id: "TX-9020", user: "Dr. James Wilson", amount: "$2,990.00", status: "Succeeded", date: "14m ago", type: "Mastermind (Annual)" },
    { id: "TX-9019", user: "Life University Student", amount: "$49.00", status: "Succeeded", date: "1h ago", type: "Student Pass" },
    { id: "TX-9018", user: "Dr. Emily Taylor", amount: "$299.00", status: "Failed", date: "3h ago", type: "Pro Plan (Monthly)" },
  ];

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-10">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 text-white">
        <div className="space-y-2">
          <h1 className="text-4xl font-heading font-black tracking-tight">Revenue & Payments</h1>
          <p className="text-gray-400 text-lg font-medium">Financial health and transaction governance.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
            {["7D", "30D", "90D", "1Y"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  timeRange === range ? "bg-neuro-orange text-white" : "text-gray-500 hover:text-white"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </header>

      {/* Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {revenueStats.map((stat, i) => (
          <section key={i} className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 group hover:border-white/10 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-neuro-orange">
                <stat.icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black ${
                stat.isUp ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
              }`}>
                {stat.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.trend}
              </div>
            </div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
            <p className="text-3xl font-black text-white">{stat.value}</p>
          </section>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Transaction Feed */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white/5 border border-white/5 rounded-[3rem] overflow-hidden">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xl font-heading font-black text-white text-white">Recent Transactions</h3>
              <div className="flex gap-2">
                <button className="p-2 text-gray-500 hover:text-white"><Filter className="w-4 h-4" /></button>
                <button className="p-2 text-gray-500 hover:text-white"><RefreshCw className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-4">Transaction ID</th>
                    <th className="px-8 py-4">Entity</th>
                    <th className="px-8 py-4 text-center">Status</th>
                    <th className="px-8 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {transactions.map((tx, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-all group">
                      <td className="px-8 py-6">
                        <p className="text-xs font-bold text-white">{tx.id}</p>
                        <p className="text-[10px] text-gray-500">{tx.type}</p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-bold text-white">{tx.user}</p>
                        <p className="text-[10px] text-gray-500">{tx.date}</p>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          tx.status === 'Succeeded' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right font-black text-white">
                        {tx.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Breakdown Analytics */}
        <div className="space-y-8">
          <section className="bg-white/5 border border-white/5 rounded-[3rem] p-10">
            <h3 className="text-xl font-heading font-black text-white mb-8">Revenue Breakdown</h3>
            <div className="space-y-6">
              {[
                { label: "Doctor Subscriptions", value: 65, color: "bg-neuro-orange" },
                { label: "LMS & Programs", value: 20, color: "bg-blue-500" },
                { label: "Vendor Commissions", value: 10, color: "bg-purple-500" },
                { label: "Student Network", value: 5, color: "bg-emerald-500" }
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-gray-400">{item.label}</span>
                    <span className="text-white">{item.value}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color}`} style={{ width: `${item.value}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all mt-10">
              <PieChart className="w-5 h-5 text-neuro-orange" />
              <span className="text-xs font-black uppercase tracking-widest text-white">Detailed Attribution</span>
            </button>
          </section>

          <section className="bg-gradient-to-br from-neuro-navy to-slate-900 border border-white/10 rounded-[3rem] p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-neuro-orange/10 blur-3xl -mr-16 -mt-16"></div>
            <h3 className="text-xl font-heading font-black text-white mb-2 text-white">Projected Growth</h3>
            <p className="text-xs text-gray-400 mb-8 font-medium">Based on current acquisition velocity.</p>
            <div className="text-4xl font-black text-white mb-2">$1.2M</div>
            <p className="text-[10px] font-black text-green-500 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-3 h-3" />
              +24% EOY Forecast
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
