"use client";

import { useState, useEffect } from "react";
import { getRevenueData } from "./actions";

export default function AdminRevenue() {
  const [timeRange, setTimeRange] = useState("30D");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    const result = await getRevenueData(timeRange);
    if (result.success) setData(result.data);
    else setError(result.error || "Unknown error");
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [timeRange]);

  const fmt = (val: number) => val.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 });

  const handleExport = () => {
    if (!data?.transactions) return;
    const rows = [
      ["Transaction ID", "User", "Amount", "Status", "Date", "Type"].join(","),
      ...data.transactions.map((tx: any) => `"${tx.id}","${tx.user}","${tx.amount}","${tx.status}","${tx.date}","${tx.type}"`),
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${timeRange}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading && !data) return <p className="text-gray-500 text-center py-20">Loading...</p>;

  const stats = [
    { label: "Total Revenue", value: data ? fmt(data.totalRevenue) : "$0" },
    { label: "MRR", value: data ? fmt(data.mrr) : "$0" },
    { label: "Failed Payments", value: data ? String(data.failedPayments) : "0" },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto text-white space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">Revenue</h1>
        <div className="flex items-center gap-3">
          <div className="flex bg-white/5 rounded-lg border border-white/5">
            {["7D", "30D", "90D", "1Y"].map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${timeRange === r ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}
              >{r}</button>
            ))}
          </div>
          <button onClick={handleExport} className="px-4 py-1.5 bg-white/10 rounded-lg text-xs hover:bg-white/20">
            Export CSV
          </button>
        </div>
      </div>

      {error && <p className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-red-400 text-sm">{error}</p>}

      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white/5 border border-white/5 rounded-xl p-5">
            <p className="text-xs text-gray-400 uppercase mb-1">{s.label}</p>
            <p className="text-2xl font-bold">{loading ? "..." : s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white/5 border border-white/5 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h2 className="font-semibold">Transactions</h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {!data?.transactions?.length ? (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-gray-500">No transactions.</td></tr>
            ) : (
              data.transactions.map((tx: any, i: number) => (
                <tr key={i} className="hover:bg-white/5">
                  <td className="px-4 py-3 text-gray-400">{tx.date}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{tx.user}</p>
                    <p className="text-xs text-gray-500">{tx.type}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      tx.status === "Succeeded" ? "bg-green-500/10 text-green-400" :
                      tx.status === "Refunded" ? "bg-gray-500/10 text-gray-400" :
                      "bg-red-500/10 text-red-400"
                    }`}>{tx.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{tx.amount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
