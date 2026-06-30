"use client";

import { useState, useEffect } from "react";
import { Search, FileText, Trash2, Edit2 } from "lucide-react";
import { loadCareplans, deleteCareplan } from "./actions";

interface PatientHistoryProps {
  onEdit: (id: string) => void;
}

export default function PatientHistory({ onEdit }: PatientHistoryProps) {
  const [plans, setPlans] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await loadCareplans({ status: statusFilter, search: search || undefined });
    setPlans(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleSearch = () => load();

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this care plan?")) return;
    await deleteCareplan(id);
    load();
  };

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(cents / 100);

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    presented: "bg-blue-100 text-blue-700",
    accepted: "bg-green-100 text-green-700",
    archived: "bg-gray-100 text-gray-400",
  };

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="Search by patient name..."
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-[#1E2D3B] outline-none"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold text-[#1E2D3B] outline-none">
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="presented">Presented</option>
          <option value="accepted">Accepted</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading care plans...</div>
      ) : plans.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No care plans found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {plans.map(plan => (
            <div key={plan.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 hover:border-blue-200 transition-all">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#1E2D3B] text-sm">{plan.patient_name || "Unnamed"}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColors[plan.status] || ""}`}>{plan.status}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  <span>{new Date(plan.date).toLocaleDateString()}</span>
                  <span>{plan.case_type}</span>
                  <span>{plan.care_track}</span>
                  {plan.total_value > 0 && <span className="font-bold text-green-600">{formatCurrency(plan.total_value)}</span>}
                </div>
              </div>
              <button onClick={() => onEdit(plan.id)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(plan.id)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
