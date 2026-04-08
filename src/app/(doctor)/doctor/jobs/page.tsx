"use client";

import { useState, useEffect } from "react";
import { Plus, X, Briefcase, Loader2, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import {
  getJobPostings,
  createJobPosting,
  getApplications,
  updateApplicationStage,
  deleteJobPosting,
  toggleJobStatus,
} from "./actions";

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    setLoading(true);
    const [j, a] = await Promise.all([getJobPostings(), getApplications()]);
    setJobs(j);
    setApplications(a);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    await createJobPosting({
      title: fd.get("title") as string,
      description: fd.get("description") as string,
      type: fd.get("type") as string,
      salary_min: Number(fd.get("salary_min")) || 0,
      salary_max: Number(fd.get("salary_max")) || 0,
    });
    setShowPostModal(false);
    setSubmitting(false);
    loadData();
  }

  async function handleDelete(jobId: string) {
    if (!confirm("Delete this job posting?")) return;
    await deleteJobPosting(jobId);
    if (selectedJobId === jobId) setSelectedJobId(null);
    loadData();
  }

  async function handleToggleStatus(jobId: string, currentStatus: string) {
    await toggleJobStatus(jobId, currentStatus);
    loadData();
  }

  async function handleStageChange(applicationId: string, stage: string) {
    await updateApplicationStage(applicationId, stage);
    const a = await getApplications();
    setApplications(a);
  }

  const jobApplicants = selectedJobId
    ? applications.filter((a) => a.jobId === selectedJobId)
    : [];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-black text-neuro-navy">Jobs</h1>
        <button
          onClick={() => setShowPostModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Post New Job
        </button>
      </div>

      {/* Job List */}
      {jobs.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Briefcase className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p>No job postings yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => {
            const count = job.applications?.[0]?.count ?? 0;
            const isOpen = job.status === "Active";
            return (
              <div
                key={job.id}
                className={`bg-white border rounded-lg p-5 hover:shadow-sm transition-shadow ${selectedJobId === job.id ? "ring-2 ring-blue-500" : "border-gray-200"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <button
                    className="text-left flex-1"
                    onClick={() => setSelectedJobId(selectedJobId === job.id ? null : job.id)}
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900">{job.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isOpen ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {isOpen ? "Open" : "Closed"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{job.type}</span>
                      {(job.salary_min || job.salary_max) && (
                        <span>
                          ${(job.salary_min || 0).toLocaleString()} - ${(job.salary_max || 0).toLocaleString()}
                        </span>
                      )}
                      <span>{count} applicant{count !== 1 ? "s" : ""}</span>
                      <span>{new Date(job.created_at).toLocaleDateString()}</span>
                    </div>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleStatus(job.id, job.status)}
                      title={isOpen ? "Close posting" : "Reopen posting"}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                    >
                      {isOpen ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => handleDelete(job.id)}
                      className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Applicants Panel */}
      {selectedJobId && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Applicants for {jobs.find((j) => j.id === selectedJobId)?.title}
          </h2>
          {jobApplicants.length === 0 ? (
            <p className="text-gray-500 text-sm">No applicants yet.</p>
          ) : (
            <div className="space-y-3">
              {jobApplicants.map((app) => (
                <div key={app.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{app.name}</p>
                    <p className="text-sm text-gray-500">
                      Applied {new Date(app.appliedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <select
                    value={app.stage}
                    onChange={(e) => handleStageChange(app.id, e.target.value)}
                    className="text-sm border border-gray-200 rounded-md px-3 py-1.5 bg-white"
                  >
                    {["New", "Screening", "Interview", "Offer", "Hired", "Rejected"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Post Job Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold">Post New Job</h2>
              <button onClick={() => setShowPostModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input name="title" required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select name="type" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="Associate">Associate</option>
                  <option value="Independent Contractor">Independent Contractor</option>
                  <option value="Buy-In">Buy-In</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salary Min</label>
                  <input name="salary_min" type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salary Max</label>
                  <input name="salary_max" type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {submitting ? "Posting..." : "Post Job"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
