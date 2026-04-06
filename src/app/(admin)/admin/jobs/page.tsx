"use client";

import { useState, useEffect } from "react";
import { Briefcase, Trash2, CheckCircle2, XCircle, Clock, Search } from "lucide-react";
import { getAdminJobPostings, updateJobStatus, deleteJobPosting } from "./actions";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getAdminJobPostings().then((data) => {
      setJobs(data);
      setLoading(false);
    });
  }, []);

  const handleStatusChange = async (jobId: string, status: string) => {
    await updateJobStatus(jobId, status);
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status } : j)));
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm("Delete this job posting? This cannot be undone.")) return;
    await deleteJobPosting(jobId);
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
  };

  const filtered = jobs.filter((j) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      j.title?.toLowerCase().includes(q) ||
      j.doctor?.clinic_name?.toLowerCase().includes(q) ||
      j.doctor?.first_name?.toLowerCase().includes(q) ||
      j.doctor?.last_name?.toLowerCase().includes(q)
    );
  });

  const statusCounts = {
    all: jobs.length,
    open: jobs.filter((j) => j.status === "open" || j.status === "Active").length,
    closed: jobs.filter((j) => j.status === "closed" || j.status === "filled").length,
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
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-black text-neuro-navy uppercase tracking-tight">Job Postings</h1>
          <p className="text-gray-500 mt-1">{statusCounts.all} total &middot; {statusCounts.open} open &middot; {statusCounts.closed} closed</p>
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by title, clinic, or doctor name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-neuro-orange"
        />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-bold">No job postings found</p>
          </div>
        ) : (
          filtered.map((job) => (
            <div key={job.id} className="bg-white border border-gray-100 rounded-2xl p-6 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="font-black text-neuro-navy">{job.title}</h3>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                      job.status === "open" || job.status === "Active"
                        ? "bg-green-50 text-green-600"
                        : "bg-gray-100 text-gray-500"
                    )}
                  >
                    {job.status}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mt-1">
                  {job.doctor ? `Dr. ${job.doctor.first_name} ${job.doctor.last_name} — ${job.doctor.clinic_name}` : "Unknown Doctor"}
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                  {job.type && ` · ${job.type}`}
                  {job.salary_min && job.salary_max && ` · $${job.salary_min.toLocaleString()}–$${job.salary_max.toLocaleString()}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {(job.status === "open" || job.status === "Active") ? (
                  <button
                    onClick={() => handleStatusChange(job.id, "closed")}
                    className="p-2 hover:bg-red-50 rounded-xl transition-colors text-gray-400 hover:text-red-500"
                    title="Close posting"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusChange(job.id, "open")}
                    className="p-2 hover:bg-green-50 rounded-xl transition-colors text-gray-400 hover:text-green-500"
                    title="Reopen posting"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(job.id)}
                  className="p-2 hover:bg-red-50 rounded-xl transition-colors text-gray-400 hover:text-red-500"
                  title="Delete posting"
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
