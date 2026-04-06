"use client";

import { useState, useEffect } from "react";
import { Calendar, Trash2, CheckCircle2, XCircle, Search, MapPin, Globe } from "lucide-react";
import { getAdminSeminars, toggleSeminarApproval, deleteSeminar } from "./actions";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export default function AdminSeminarsPage() {
  const [seminars, setSeminars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");

  useEffect(() => {
    getAdminSeminars().then((data) => {
      setSeminars(data);
      setLoading(false);
    });
  }, []);

  const handleApproval = async (id: string, approve: boolean) => {
    await toggleSeminarApproval(id, approve);
    setSeminars((prev) => prev.map((s) => (s.id === id ? { ...s, is_approved: approve } : s)));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this seminar? This cannot be undone.")) return;
    await deleteSeminar(id);
    setSeminars((prev) => prev.filter((s) => s.id !== id));
  };

  const filtered = seminars.filter((s) => {
    if (filter === "pending" && s.is_approved) return false;
    if (filter === "approved" && !s.is_approved) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.title?.toLowerCase().includes(q) ||
      s.city?.toLowerCase().includes(q) ||
      s.country?.toLowerCase().includes(q) ||
      s.host?.full_name?.toLowerCase().includes(q)
    );
  });

  const counts = {
    all: seminars.length,
    pending: seminars.filter((s) => !s.is_approved).length,
    approved: seminars.filter((s) => s.is_approved).length,
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-neuro-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-heading font-black text-neuro-navy uppercase tracking-tight">Seminars</h1>
        <p className="text-gray-500 mt-1">{counts.all} total &middot; {counts.pending} pending approval &middot; {counts.approved} approved</p>
      </header>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title, location, or host..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-neuro-orange"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "pending", "approved"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                filter === tab ? "bg-neuro-navy text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              )}
            >
              {tab} ({counts[tab]})
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-bold">No seminars found</p>
          </div>
        ) : (
          filtered.map((sem) => (
            <div key={sem.id} className="bg-white border border-gray-100 rounded-2xl p-6 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="font-black text-neuro-navy">{sem.title}</h3>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                      sem.is_approved ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
                    )}
                  >
                    {sem.is_approved ? "Approved" : "Pending"}
                  </span>
                  {sem.payment_status && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600">
                      {sem.payment_status}
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-sm mt-1">
                  Hosted by {sem.host?.full_name || "Unknown"} {sem.host?.email && `(${sem.host.email})`}
                </p>
                <div className="flex items-center gap-4 text-gray-400 text-xs mt-1">
                  {sem.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {sem.city}{sem.country ? `, ${sem.country}` : ""}
                    </span>
                  )}
                  {sem.dates && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {sem.dates}
                    </span>
                  )}
                  <span>Created {formatDistanceToNow(new Date(sem.created_at), { addSuffix: true })}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!sem.is_approved ? (
                  <button
                    onClick={() => handleApproval(sem.id, true)}
                    className="p-2 hover:bg-green-50 rounded-xl transition-colors text-gray-400 hover:text-green-500"
                    title="Approve"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleApproval(sem.id, false)}
                    className="p-2 hover:bg-amber-50 rounded-xl transition-colors text-gray-400 hover:text-amber-500"
                    title="Unapprove"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(sem.id)}
                  className="p-2 hover:bg-red-50 rounded-xl transition-colors text-gray-400 hover:text-red-500"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
