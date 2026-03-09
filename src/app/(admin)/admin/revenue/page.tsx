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
  AlertCircle,
  Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { getRevenueData } from "./actions";

export default function AdminRevenue() {
  const [timeRange, setTimeRange] = useState("30D");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    const result = await getRevenueData(timeRange);
    if (result.success) {
      setData(result.data);
    } else {
      setError(result.error || "Unknown error");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const handleExport = () => {
    if (!data || !data.transactions) return;
    
    const headers = ["Transaction ID", "User", "Amount", "Status", "Date", "Type"];
    const csvContent = [
      headers.join(","),
      ...data.transactions.map((tx: any) => 
        `"${tx.id}","${tx.user}","${tx.amount}","${tx.status}","${tx.date}","${tx.type}"`
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neurochiro_transactions_${timeRange}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 text-neuro-orange animate-spin" />
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return val.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 });
  };

  const formatTrend = (val: number) => {
    return `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;
  };

  const revenueStats = [
    { 
      label: "Total Revenue", 
      value: data ? formatCurrency(data.totalRevenue) : "$0", 
      trend: data ? formatTrend(data.revenueTrend) : "+0%", 
      isUp: data ? data.revenueTrend >= 0 : true, 
      icon: DollarSign 
    },
    { 
      label: "MRR", 
      value: data ? formatCurrency(data.mrr) : "$0", 
      trend: data ? formatTrend(data.mrrTrend) : "+0%", 
      isUp: data ? data.mrrTrend >= 0 : true, 
      icon: TrendingUp 
    },
    { 
      label: "Active Subscriptions", 
      value: data ? data.activeSubscriptions.toString() : "0", 
      trend: data ? (data.activeSubscriptionsTrend >= 0 ? `+${data.activeSubscriptionsTrend}` : `${data.activeSubscriptionsTrend}`) : "+0", 
      isUp: data ? data.activeSubscriptionsTrend >= 0 : true, 
      icon: CreditCard 
    },
    { 
      label: "Failed Payments", 
      value: data ? data.failedPayments.toString() : "0", 
      trend: data ? (data.failedPaymentsTrend >= 0 ? `+${data.failedPaymentsTrend}` : `${data.failedPaymentsTrend}`) : "0", 
      isUp: data ? data.failedPaymentsTrend <= 0 : false, 
      icon: AlertCircle 
    },
  ];

  const filteredTransactions = data?.transactions?.filter((tx: any) => {
    if (filterStatus === "All") return true;
    return tx.status === filterStatus;
  }) || [];

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
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all"
          >
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-500 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}

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
            <p className="text-3xl font-black text-white">{loading ? "..." : stat.value}</p>
          </section>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Transaction Feed */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white/5 border border-white/5 rounded-[3rem] overflow-hidden">
            <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-xl font-heading font-black text-white text-white">Recent Transactions</h3>
              <div className="flex gap-2 items-center">
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neuro-orange"
                >
                  <option value="All">All Statuses</option>
                  <option value="Succeeded">Succeeded</option>
                  <option value="Failed">Failed</option>
                  <option value="Refunded">Refunded</option>
                </select>
                <button onClick={fetchData} className="p-2 text-gray-500 hover:text-white transition-colors" title="Refresh Data">
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto relative min-h-[300px]">
              {loading && (
                 <div className="absolute inset-0 bg-[#020617]/50 flex items-center justify-center z-10">
                   <Loader2 className="w-8 h-8 text-neuro-orange animate-spin" />
                 </div>
              )}
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
                  {!loading && filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-12 text-center text-gray-500 font-medium text-sm">
                        No transaction data available yet.
                      </td>
                    </tr>
                  )}
                  {filteredTransactions.map((tx: any, i: number) => (
                    <tr key={i} className="hover:bg-white/5 transition-all group">
                      <td className="px-8 py-6">
                        <p className="text-xs font-bold text-white truncate max-w-[150px]">{tx.id}</p>
                        <p className="text-[10px] text-gray-500 truncate max-w-[150px]">{tx.type}</p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-bold text-white truncate max-w-[200px]">{tx.user}</p>
                        <p className="text-[10px] text-gray-500">{tx.date}</p>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          tx.status === 'Succeeded' ? 'bg-green-500/10 text-green-500' : 
                          tx.status === 'Refunded' ? 'bg-gray-500/10 text-gray-400' :
                          'bg-red-500/10 text-red-500'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right font-black text-white whitespace-nowrap">
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
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
                </div>
              ) : data?.breakdown?.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No revenue data available for this period.</p>
              ) : (
                data?.breakdown?.map((item: any, i: number) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className="text-gray-400">{item.label}</span>
                      <span className="text-white">{item.value}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color}`} style={{ width: `${item.value}%` }}></div>
                    </div>
                  </div>
                ))
              )}
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
            <div className="text-4xl font-black text-white mb-2">
              {loading ? "..." : (data?.projectedGrowth ? formatCurrency(data.projectedGrowth) : "$0")}
            </div>
            <p className="text-[10px] font-black text-green-500 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-3 h-3" />
              Based on active MRR
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
