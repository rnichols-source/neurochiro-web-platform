"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  X,
  Briefcase,
  Loader2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
  ChevronLeft,
  Star,
  MessageSquare,
  FileText,
  Phone,
  Mail,
  Award,
  ClipboardCheck,
  Copy,
  Check,
  UserCheck,
  XCircle,
  ChevronDown,
  ChevronUp,
  BarChart3,
} from "lucide-react";
import {
  getJobPostings,
  createJobPosting,
  getApplications,
  updateApplicationStage,
  deleteJobPosting,
  toggleJobStatus,
  updateApplicantRating,
  updateApplicantNotes,
  getApplicationWithHistory,
} from "./actions";
import {
  PIPELINE_STAGES,
  INTERVIEW_QUESTIONS,
  INTERVIEW_CATEGORIES,
  REFERENCE_TEMPLATES,
  OFFER_LETTER_TEMPLATES,
  STAGE_EMAIL_TEMPLATES,
  JOB_TEMPLATES,
} from "./hiring-data";
import type { PipelineStage } from "./hiring-data";
import ChiroScoreInline from "./ChiroScoreInline";

// ─── Utility Components ──────────────────────────────────────────────────────

function StarRating({
  rating,
  onChange,
  size = "sm",
}: {
  rating: number;
  onChange?: (r: number) => void;
  size?: "sm" | "md";
}) {
  const sz = size === "md" ? "w-5 h-5" : "w-4 h-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange?.(s === rating ? 0 : s)}
          className={`${onChange ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-transform`}
        >
          <Star
            className={`${sz} ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        </button>
      ))}
    </div>
  );
}

function Badge({ children, color = "gray" }: { children: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    gray: "bg-gray-100 text-gray-600",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    orange: "bg-orange-100 text-orange-700",
    purple: "bg-purple-100 text-purple-700",
    red: "bg-red-100 text-red-700",
    indigo: "bg-indigo-100 text-indigo-700",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[color] || colors.gray}`}>
      {children}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
    >
      {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

const STAGE_COLORS: Record<string, string> = {
  New: "blue",
  Reviewing: "purple",
  "Phone Screen": "indigo",
  Interview: "orange",
  Offer: "green",
  Hired: "green",
  Rejected: "red",
};

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function JobsPage() {
  return <Suspense><JobsPageInner /></Suspense>
}

function JobsPageInner() {
  const searchParams = useSearchParams()
  const justPosted = searchParams.get('posted') === 'success'
  const [showPostedBanner, setShowPostedBanner] = useState(justPosted)

  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ATS state
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [appDetail, setAppDetail] = useState<any>(null);
  const [appDetailLoading, setAppDetailLoading] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showReferenceModal, setShowReferenceModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailStage, setEmailStage] = useState<string>("");
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});
  const [localRatings, setLocalRatings] = useState<Record<string, number>>({});
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    const [j, a] = await Promise.all([getJobPostings(), getApplications()]);
    setJobs(j);
    setApplications(a);
    // Initialize local ratings/notes from loaded data
    const nr: Record<string, number> = {};
    const nn: Record<string, string> = {};
    a.forEach((app: any) => {
      if (app.rating) nr[app.id] = app.rating;
      if (app.doctorNotes) nn[app.id] = app.doctorNotes;
    });
    setLocalRatings((prev) => ({ ...nr, ...prev }));
    setLocalNotes((prev) => ({ ...nn, ...prev }));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const [applyMethod, setApplyMethod] = useState("neurochiro");
  const [selectedTemplate, setSelectedTemplate] = useState("");

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const benefitsRaw = (fd.get("benefits") as string) || "";
    await createJobPosting({
      title: fd.get("title") as string,
      description: fd.get("description") as string,
      type: fd.get("type") as string,
      salary_min: Number(fd.get("salary_min")) || 0,
      salary_max: Number(fd.get("salary_max")) || 0,
      benefits: benefitsRaw ? benefitsRaw.split(",").map((b: string) => b.trim()).filter(Boolean) : [],
      category: fd.get("category") as string,
      employment_type: fd.get("employment_type") as string,
      apply_method: fd.get("apply_method") as string,
      apply_url: (fd.get("apply_url") as string) || null,
    });
    setShowPostModal(false);
    setApplyMethod("neurochiro");
    setSelectedTemplate("");
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
    // Show email template
    setEmailStage(stage);
    setSelectedAppId(applicationId);
    setShowEmailModal(true);
  }

  async function handleRatingChange(appId: string, rating: number) {
    setLocalRatings((prev) => ({ ...prev, [appId]: rating }));
    try {
      await updateApplicantRating(appId, rating);
    } catch (e) {
      // graceful fallback
    }
  }

  async function handleNotesSave(appId: string) {
    try {
      await updateApplicantNotes(appId, localNotes[appId] || "");
    } catch (e) {
      // graceful fallback
    }
  }

  async function openApplicantDetail(appId: string) {
    setSelectedAppId(appId);
    setAppDetailLoading(true);
    try {
      const detail = await getApplicationWithHistory(appId);
      setAppDetail(detail);
    } catch (e) {
      setAppDetail(null);
    }
    setAppDetailLoading(false);
  }

  function advanceStage(appId: string, currentStage: string, direction: 1 | -1) {
    const stages = PIPELINE_STAGES.filter((s) => s !== "Rejected");
    const idx = stages.indexOf(currentStage as any);
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= stages.length) return;
    handleStageChange(appId, stages[newIdx]);
  }

  async function handleReject(appId: string) {
    await updateApplicationStage(appId, "Rejected");
    const a = await getApplications();
    setApplications(a);
    setShowRejectModal(false);
    setRejectReason("");
    // Save reject reason as note
    if (rejectReason.trim()) {
      const existing = localNotes[appId] || "";
      const updated = existing
        ? `${existing}\n\n[REJECTION REASON]: ${rejectReason}`
        : `[REJECTION REASON]: ${rejectReason}`;
      setLocalNotes((prev) => ({ ...prev, [appId]: updated }));
      try {
        await updateApplicantNotes(appId, updated);
      } catch (e) {
        // graceful fallback
      }
    }
  }

  const selectedJob = jobs.find((j) => j.id === selectedJobId);
  const jobApplicants = selectedJobId
    ? applications.filter((a) => a.jobId === selectedJobId)
    : [];

  // Group applicants by stage
  const applicantsByStage: Record<string, any[]> = {};
  PIPELINE_STAGES.forEach((stage) => {
    applicantsByStage[stage] = jobApplicants.filter((a) => a.stage === stage);
  });

  // Hiring Stats
  const totalActiveJobs = jobs.filter((j) => j.status === "Active").length;
  const totalApplicants = applications.length;
  const applicantCountByStage: Record<string, number> = {};
  PIPELINE_STAGES.forEach((s) => {
    const c = applications.filter((a) => a.stage === s).length;
    if (c > 0) applicantCountByStage[s] = c;
  });

  // Fill placeholders helper
  function fillPlaceholders(template: string, app?: any, job?: any) {
    let t = template;
    t = t.replace(/\[Candidate Name\]/g, app?.name || "[Candidate Name]");
    t = t.replace(/\[Job Title\]/g, job?.title || app?.jobTitle || selectedJob?.title || "[Job Title]");
    t = t.replace(/\[Clinic Name\]/g, "[Your Clinic Name]");
    t = t.replace(/\[Doctor Name\]/g, "[Your Name]");
    t = t.replace(/\[Your Name\]/g, "[Your Name]");
    t = t.replace(/\[Clinic Address\]/g, "[Your Clinic Address]");
    t = t.replace(/\[Date\]/g, new Date().toLocaleDateString());
    t = t.replace(/\[Start Date\]/g, "[TBD]");
    t = t.replace(/\[Response Deadline\]/g, "[TBD]");
    t = t.replace(/\[Salary\]/g, job?.salary_max?.toLocaleString() || app?.jobSalaryMax?.toLocaleString() || "[Salary]");
    t = t.replace(/\[Employment Type\]/g, job?.employment_type || app?.jobEmploymentType || "[Employment Type]");
    t = t.replace(/\[Benefits List\]/g, "[Benefits to be listed]");
    t = t.replace(/\[Reference Name\]/g, "[Reference Name]");
    return t;
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Success banner after Stripe checkout */}
      {showPostedBanner && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-bold text-green-800">Job posted successfully!</p>
              <p className="text-xs text-green-600">Your listing is now live for 30 days. Applications will arrive in your dashboard and by email.</p>
            </div>
          </div>
          <button onClick={() => setShowPostedBanner(false)} className="text-green-400 hover:text-green-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ── Hiring Stats ─────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-neuro-navy" />
          <span className="text-sm font-bold text-neuro-navy">Hiring Overview</span>
        </div>
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div>
            <span className="text-gray-500">Active Jobs:</span>{" "}
            <span className="font-bold text-neuro-navy">{totalActiveJobs}</span>
          </div>
          <div>
            <span className="text-gray-500">Total Applicants:</span>{" "}
            <span className="font-bold text-neuro-navy">{totalApplicants}</span>
          </div>
          {totalApplicants > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {Object.entries(applicantCountByStage).map(([stage, count]) => (
                <Badge key={stage} color={STAGE_COLORS[stage] || "gray"}>
                  {stage} ({count})
                </Badge>
              ))}
            </div>
          )}
        </div>
        {/* Horizontal bar */}
        {totalApplicants > 0 && (
          <div className="flex h-2 rounded-full overflow-hidden mt-3 bg-gray-100">
            {PIPELINE_STAGES.map((stage) => {
              const count = applicantCountByStage[stage] || 0;
              if (count === 0) return null;
              const pct = (count / totalApplicants) * 100;
              const barColors: Record<string, string> = {
                New: "bg-blue-400",
                Reviewing: "bg-purple-400",
                "Phone Screen": "bg-indigo-400",
                Interview: "bg-neuro-orange",
                Offer: "bg-green-400",
                Hired: "bg-green-600",
                Rejected: "bg-red-400",
              };
              return (
                <div
                  key={stage}
                  className={`${barColors[stage] || "bg-gray-400"}`}
                  style={{ width: `${pct}%` }}
                  title={`${stage}: ${count}`}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-black text-neuro-navy">Jobs</h1>
        <button
          onClick={() => setShowPostModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-neuro-orange text-white rounded-lg hover:bg-neuro-orange/90 transition-colors text-sm font-bold"
        >
          <Plus className="w-4 h-4" /> Post New Job
        </button>
      </div>

      {/* ── Job List ─────────────────────────────────────────────────── */}
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
                    onClick={() =>
                      setSelectedJobId(selectedJobId === job.id ? null : job.id)
                    }
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900">{job.title}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${isOpen ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                      >
                        {isOpen ? "Open" : "Closed"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{job.type}</span>
                      {(job.salary_min || job.salary_max) && (
                        <span>
                          ${(job.salary_min || 0).toLocaleString()} - $
                          {(job.salary_max || 0).toLocaleString()}
                        </span>
                      )}
                      <span>
                        {count} applicant{count !== 1 ? "s" : ""}
                      </span>
                      <span>{new Date(job.created_at).toLocaleDateString()}</span>
                    </div>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleStatus(job.id, job.status)}
                      title={isOpen ? "Close posting" : "Reopen posting"}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                    >
                      {isOpen ? (
                        <ToggleRight className="w-5 h-5 text-green-600" />
                      ) : (
                        <ToggleLeft className="w-5 h-5" />
                      )}
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

      {/* ── Pipeline View ────────────────────────────────────────────── */}
      {selectedJobId && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6">
          <h2 className="text-lg font-semibold text-neuro-navy mb-4">
            Pipeline: {selectedJob?.title}
          </h2>
          {jobApplicants.length === 0 ? (
            <p className="text-gray-500 text-sm">No applicants yet.</p>
          ) : (
            <div className="space-y-6">
              {PIPELINE_STAGES.map((stage) => {
                const stageApps = applicantsByStage[stage] || [];
                if (stageApps.length === 0) return null;
                return (
                  <div key={stage}>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge color={STAGE_COLORS[stage] || "gray"}>
                        {stage} ({stageApps.length})
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {stageApps.map((app) => (
                        <div
                          key={app.id}
                          className="border border-gray-100 rounded-xl p-4 hover:border-gray-300 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <button
                              className="flex-1 text-left"
                              onClick={() => openApplicantDetail(app.id)}
                            >
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-neuro-navy">{app.name}</p>
                                {app.candidateId && <ChiroScoreInline candidateId={app.candidateId} />}
                              </div>
                              {app.school && (
                                <p className="text-sm text-gray-500">
                                  {app.school}
                                  {app.gradYear ? ` - Class of ${app.gradYear}` : ""}
                                </p>
                              )}
                              {app.email && !app.school && (
                                <p className="text-sm text-gray-500">{app.email}{app.phone ? ` · ${app.phone}` : ''}</p>
                              )}
                              {app.message && (
                                <p className="text-xs text-gray-400 mt-1 italic">"{app.message}"</p>
                              )}
                              <p className="text-xs text-gray-400 mt-0.5">
                                Applied{" "}
                                {new Date(app.appliedAt).toLocaleDateString()}
                              </p>
                            </button>
                            <div className="flex items-center gap-2 shrink-0">
                              {/* Stage advance buttons */}
                              {stage !== "Rejected" && (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => advanceStage(app.id, stage, -1)}
                                    disabled={stage === "New"}
                                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-gray-500"
                                    title="Move back"
                                  >
                                    <ChevronLeft className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => advanceStage(app.id, stage, 1)}
                                    disabled={stage === "Hired"}
                                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-neuro-orange"
                                    title="Advance"
                                  >
                                    <ChevronRight className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          {/* Star rating + quick notes row */}
                          <div className="mt-2 flex items-center gap-4">
                            <StarRating
                              rating={localRatings[app.id] || 0}
                              onChange={(r) => handleRatingChange(app.id, r)}
                            />
                            <button
                              onClick={() =>
                                setExpandedNotes((prev) => ({
                                  ...prev,
                                  [app.id]: !prev[app.id],
                                }))
                              }
                              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                            >
                              <MessageSquare className="w-3 h-3" />
                              Notes
                              {expandedNotes[app.id] ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>
                            {/* Quick links */}
                            {app.candidateId && (
                              <a
                                href={`/doctor/messages?to=${app.candidateId}`}
                                className="text-xs font-bold text-neuro-orange hover:underline"
                              >
                                Message
                              </a>
                            )}
                            {app.resumeUrl && (
                              <a
                                href={app.resumeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-bold text-blue-600 hover:underline"
                              >
                                Resume
                              </a>
                            )}
                          </div>
                          {/* Expanded notes */}
                          {expandedNotes[app.id] && (
                            <div className="mt-2">
                              <textarea
                                rows={2}
                                value={localNotes[app.id] || ""}
                                onChange={(e) =>
                                  setLocalNotes((prev) => ({
                                    ...prev,
                                    [app.id]: e.target.value,
                                  }))
                                }
                                onBlur={() => handleNotesSave(app.id)}
                                placeholder="Private notes about this applicant..."
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:ring-1 focus:ring-neuro-orange focus:border-neuro-orange"
                              />
                            </div>
                          )}
                          {/* Skills */}
                          {app.skills && app.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {app.skills.slice(0, 4).map((skill: string, i: number) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Applicant Detail Panel ───────────────────────────────────── */}
      {selectedAppId && appDetail && !appDetailLoading && (
        <ApplicantDetailPanel
          appDetail={appDetail}
          localRatings={localRatings}
          localNotes={localNotes}
          onClose={() => {
            setSelectedAppId(null);
            setAppDetail(null);
          }}
          onRatingChange={handleRatingChange}
          onNotesChange={(id, val) =>
            setLocalNotes((prev) => ({ ...prev, [id]: val }))
          }
          onNotesSave={handleNotesSave}
          onShowInterview={() => setShowInterviewModal(true)}
          onShowReference={() => setShowReferenceModal(true)}
          onShowOffer={() => setShowOfferModal(true)}
          onShowEmail={(stage) => {
            setEmailStage(stage);
            setShowEmailModal(true);
          }}
          onReject={() => setShowRejectModal(true)}
          fillPlaceholders={fillPlaceholders}
        />
      )}

      {/* Loading overlay for detail */}
      {appDetailLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl p-8">
            <Loader2 className="w-6 h-6 animate-spin text-neuro-orange mx-auto" />
          </div>
        </div>
      )}

      {/* ── Interview Question Bank Modal ────────────────────────────── */}
      {showInterviewModal && (
        <InterviewModal onClose={() => setShowInterviewModal(false)} />
      )}

      {/* ── Reference Check Modal ────────────────────────────────────── */}
      {showReferenceModal && (
        <ReferenceModal
          appDetail={appDetail}
          fillPlaceholders={fillPlaceholders}
          onClose={() => setShowReferenceModal(false)}
          onSaveNotes={async (notes: string) => {
            if (appDetail) {
              const existing = localNotes[appDetail.id] || "";
              const updated = existing
                ? `${existing}\n\n[REFERENCE NOTES]:\n${notes}`
                : `[REFERENCE NOTES]:\n${notes}`;
              setLocalNotes((prev) => ({ ...prev, [appDetail.id]: updated }));
              try {
                await updateApplicantNotes(appDetail.id, updated);
              } catch (e) {
                // graceful
              }
            }
          }}
        />
      )}

      {/* ── Offer Letter Modal ───────────────────────────────────────── */}
      {showOfferModal && appDetail && (
        <OfferModal
          appDetail={appDetail}
          fillPlaceholders={fillPlaceholders}
          onClose={() => setShowOfferModal(false)}
        />
      )}

      {/* ── Email Template Modal ─────────────────────────────────────── */}
      {showEmailModal && (
        <EmailModal
          stage={emailStage}
          app={
            appDetail ||
            applications.find((a) => a.id === selectedAppId) ||
            null
          }
          selectedJob={selectedJob}
          fillPlaceholders={fillPlaceholders}
          onClose={() => setShowEmailModal(false)}
        />
      )}

      {/* ── Reject Modal ─────────────────────────────────────────────── */}
      {showRejectModal && selectedAppId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Reject Applicant</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will move the applicant to the Rejected stage. You can optionally add a reason.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional, private)..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedAppId)}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Post Job Modal (with templates) ──────────────────────────── */}
      {showPostModal && (
        <PostJobModal
          onClose={() => setShowPostModal(false)}
        />
      )}
    </div>
  );
}

// ─── Applicant Detail Panel Component ────────────────────────────────────────

function ApplicantDetailPanel({
  appDetail,
  localRatings,
  localNotes,
  onClose,
  onRatingChange,
  onNotesChange,
  onNotesSave,
  onShowInterview,
  onShowReference,
  onShowOffer,
  onShowEmail,
  onReject,
  fillPlaceholders,
}: {
  appDetail: any;
  localRatings: Record<string, number>;
  localNotes: Record<string, string>;
  onClose: () => void;
  onRatingChange: (id: string, r: number) => void;
  onNotesChange: (id: string, val: string) => void;
  onNotesSave: (id: string) => void;
  onShowInterview: () => void;
  onShowReference: () => void;
  onShowOffer: () => void;
  onShowEmail: (stage: string) => void;
  onReject: () => void;
  fillPlaceholders: (t: string, app?: any, job?: any) => string;
}) {
  if (!appDetail) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-stretch justify-end bg-black/30">
      <div className="bg-white w-full md:w-[600px] md:max-w-[90vw] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 md:p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold text-neuro-navy">{appDetail.name}</h2>
            <p className="text-sm text-gray-500">
              {appDetail.jobTitle} - <Badge color={STAGE_COLORS[appDetail.stage] || "gray"}>{appDetail.stage}</Badge>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-6">
          {/* Contact Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {appDetail.email && (
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4 text-gray-400" />
                {appDetail.email}
              </div>
            )}
            {appDetail.phone && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4 text-gray-400" />
                {appDetail.phone}
              </div>
            )}
            {appDetail.school && (
              <div className="flex items-center gap-2 text-gray-600">
                <Award className="w-4 h-4 text-gray-400" />
                {appDetail.school}
                {appDetail.gradYear ? ` (${appDetail.gradYear})` : ""}
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-600">
              <FileText className="w-4 h-4 text-gray-400" />
              Applied {new Date(appDetail.appliedAt).toLocaleDateString()}
            </div>
          </div>

          {/* Message / Cover Letter */}
          {appDetail.message && (
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-1">Cover Letter / Message</h4>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">
                {appDetail.message}
              </p>
            </div>
          )}

          {/* Resume */}
          {appDetail.resumeUrl && (
            <a
              href={appDetail.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline"
            >
              <FileText className="w-4 h-4" />
              View Resume
            </a>
          )}

          {/* Rating */}
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-1">Rating</h4>
            <StarRating
              rating={localRatings[appDetail.id] || 0}
              onChange={(r) => onRatingChange(appDetail.id, r)}
              size="md"
            />
          </div>

          {/* Stage History */}
          {appDetail.stageHistory && appDetail.stageHistory.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-2">Stage History</h4>
              <div className="space-y-1">
                {appDetail.stageHistory.map((h: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                    <Badge color={STAGE_COLORS[h.stage] || "gray"}>{h.stage}</Badge>
                    <span>{new Date(h.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Doctor Notes */}
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-1">Private Notes</h4>
            <textarea
              rows={4}
              value={localNotes[appDetail.id] || ""}
              onChange={(e) => onNotesChange(appDetail.id, e.target.value)}
              onBlur={() => onNotesSave(appDetail.id)}
              placeholder="Your private notes about this applicant..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:ring-1 focus:ring-neuro-orange focus:border-neuro-orange"
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onShowInterview}
              className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-bold rounded-lg border border-gray-200 hover:bg-neuro-cream text-neuro-navy transition-colors"
            >
              <ClipboardCheck className="w-4 h-4" />
              Interview Prep
            </button>
            <button
              onClick={onShowReference}
              className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-bold rounded-lg border border-gray-200 hover:bg-neuro-cream text-neuro-navy transition-colors"
            >
              <UserCheck className="w-4 h-4" />
              Reference Check
            </button>
            <button
              onClick={() => onShowOffer()}
              disabled={appDetail.stage !== "Offer"}
              className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-bold rounded-lg border border-gray-200 hover:bg-green-50 text-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <FileText className="w-4 h-4" />
              Generate Offer
            </button>
            <button
              onClick={() => onShowEmail(appDetail.stage)}
              className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-bold rounded-lg border border-gray-200 hover:bg-blue-50 text-blue-700 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Send Email
            </button>
            <button
              onClick={onReject}
              className="col-span-2 flex items-center justify-center gap-2 px-3 py-2 text-sm font-bold rounded-lg border border-red-200 hover:bg-red-50 text-red-600 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Reject Applicant
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Interview Question Bank Modal ───────────────────────────────────────────

function InterviewModal({ onClose }: { onClose: () => void }) {
  const [activeCategory, setActiveCategory] = useState(INTERVIEW_CATEGORIES[0]);
  const [checkedQuestions, setCheckedQuestions] = useState<Set<string>>(new Set());

  const toggleCheck = (id: string) => {
    setCheckedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const categoryQuestions = INTERVIEW_QUESTIONS.filter(
    (q) => q.category === activeCategory
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-neuro-navy">Interview Question Bank</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Category tabs */}
        <div className="flex flex-wrap gap-1 p-4 border-b border-gray-100 bg-gray-50">
          {INTERVIEW_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 text-xs font-bold rounded-full transition-colors ${activeCategory === cat ? "bg-neuro-navy text-white" : "bg-white text-gray-600 hover:bg-gray-200 border border-gray-200"}`}
            >
              {cat}
            </button>
          ))}
        </div>
        {/* Questions */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {categoryQuestions.map((q) => (
            <div
              key={q.id}
              className={`border rounded-lg p-4 transition-colors ${checkedQuestions.has(q.id) ? "bg-green-50 border-green-200" : "border-gray-200"}`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleCheck(q.id)}
                  className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${checkedQuestions.has(q.id) ? "bg-green-500 border-green-500 text-white" : "border-gray-300"}`}
                >
                  {checkedQuestions.has(q.id) && <Check className="w-3 h-3" />}
                </button>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{q.question}</p>
                  <div className="mt-2 space-y-1.5 text-xs text-gray-600">
                    <p>
                      <span className="font-bold text-gray-700">Why ask:</span> {q.whyAsk}
                    </p>
                    <p>
                      <span className="font-bold text-green-700">Great answer:</span>{" "}
                      {q.greatAnswer}
                    </p>
                    <p>
                      <span className="font-bold text-red-600">Red flags:</span> {q.redFlags}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-100 text-center text-xs text-gray-400">
          {checkedQuestions.size} of {INTERVIEW_QUESTIONS.length} questions completed
        </div>
      </div>
    </div>
  );
}

// ─── Reference Check Modal ───────────────────────────────────────────────────

function ReferenceModal({
  appDetail,
  fillPlaceholders,
  onClose,
  onSaveNotes,
}: {
  appDetail: any;
  fillPlaceholders: (t: string, app?: any) => string;
  onClose: () => void;
  onSaveNotes: (notes: string) => Promise<void>;
}) {
  const [selectedType, setSelectedType] = useState(REFERENCE_TEMPLATES[0].type);
  const [refNotes, setRefNotes] = useState<Record<string, string>>({});

  const template = REFERENCE_TEMPLATES.find((t) => t.type === selectedType)!;

  const handleSave = async () => {
    const notesText = template.questions
      .map((q) => `${q.noteLabel}: ${refNotes[q.noteLabel] || "(no notes)"}`)
      .join("\n");
    await onSaveNotes(`[${selectedType} Reference]\n${notesText}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-neuro-navy">Reference Check</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Type selector */}
        <div className="flex gap-2 p-4 border-b border-gray-100 bg-gray-50">
          {REFERENCE_TEMPLATES.map((t) => (
            <button
              key={t.type}
              onClick={() => setSelectedType(t.type)}
              className={`px-3 py-1.5 text-xs font-bold rounded-full transition-colors ${selectedType === t.type ? "bg-neuro-navy text-white" : "bg-white text-gray-600 hover:bg-gray-200 border border-gray-200"}`}
            >
              {t.type}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Intro Script */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs font-bold text-blue-700 mb-1">Intro Script</p>
            <p className="text-sm text-blue-900 whitespace-pre-wrap">
              {fillPlaceholders(template.introScript, appDetail)}
            </p>
            <div className="mt-2">
              <CopyButton text={fillPlaceholders(template.introScript, appDetail)} />
            </div>
          </div>
          {/* Questions */}
          {template.questions.map((q, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-gray-900 mb-2">
                {fillPlaceholders(q.question, appDetail)}
              </p>
              <input
                type="text"
                value={refNotes[q.noteLabel] || ""}
                onChange={(e) =>
                  setRefNotes((prev) => ({ ...prev, [q.noteLabel]: e.target.value }))
                }
                placeholder={q.noteLabel}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-bold text-white bg-neuro-orange hover:bg-neuro-orange/90 rounded-lg"
          >
            Save to Notes
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Offer Letter Modal ──────────────────────────────────────────────────────

function OfferModal({
  appDetail,
  fillPlaceholders,
  onClose,
}: {
  appDetail: any;
  fillPlaceholders: (t: string, app?: any) => string;
  onClose: () => void;
}) {
  const [activeStyle, setActiveStyle] = useState(OFFER_LETTER_TEMPLATES[0].style);

  const template = OFFER_LETTER_TEMPLATES.find((t) => t.style === activeStyle)!;
  const filledText = fillPlaceholders(template.template, appDetail);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-neuro-navy">Offer Letter Generator</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-2 p-4 border-b border-gray-100 bg-gray-50">
          {OFFER_LETTER_TEMPLATES.map((t) => (
            <button
              key={t.style}
              onClick={() => setActiveStyle(t.style)}
              className={`px-3 py-1.5 text-xs font-bold rounded-full transition-colors ${activeStyle === t.style ? "bg-neuro-navy text-white" : "bg-white text-gray-600 hover:bg-gray-200 border border-gray-200"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans bg-gray-50 rounded-lg p-4 border border-gray-200">
            {filledText}
          </pre>
        </div>
        <div className="p-4 border-t border-gray-100 flex justify-end">
          <CopyButton text={filledText} />
        </div>
      </div>
    </div>
  );
}

// ─── Email Template Modal ────────────────────────────────────────────────────

function EmailModal({
  stage,
  app,
  selectedJob,
  fillPlaceholders,
  onClose,
}: {
  stage: string;
  app: any;
  selectedJob: any;
  fillPlaceholders: (t: string, app?: any, job?: any) => string;
  onClose: () => void;
}) {
  const template = STAGE_EMAIL_TEMPLATES.find((t) => t.stage === stage);

  if (!template) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white rounded-xl w-full max-w-md shadow-xl p-6 text-center">
          <p className="text-gray-600 text-sm mb-4">No email template available for the &quot;{stage}&quot; stage.</p>
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-neuro-navy hover:bg-gray-100 rounded-lg">
            Close
          </button>
        </div>
      </div>
    );
  }

  const filledSubject = fillPlaceholders(template.subject, app, selectedJob);
  const filledBody = fillPlaceholders(template.body, app, selectedJob);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-neuro-navy">Email Template</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div>
            <p className="text-xs font-bold text-gray-500 mb-1">Subject</p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-900 flex-1">{filledSubject}</p>
              <CopyButton text={filledSubject} />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 mb-1">Body</p>
            <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans bg-gray-50 rounded-lg p-3 border border-gray-200">
              {filledBody}
            </pre>
            <div className="mt-2">
              <CopyButton text={filledBody} />
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-gray-100 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-neuro-navy hover:bg-gray-100 rounded-lg">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Post Job Modal (with templates) ─────────────────────────────────────────

function PostJobModal({
  onClose,
}: {
  applyMethod?: string;
  setApplyMethod?: (v: string) => void;
  selectedTemplate?: string;
  setSelectedTemplate?: (v: string) => void;
  submitting?: boolean;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<'form' | 'preview'>('form')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '', description: '', employmentType: 'Full-time',
    compensationMin: '', compensationMax: '', compensationType: 'salary',
    city: '', state: '', whatLookingFor: '', applyEmail: '',
  })

  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))
  const compLabel = form.compensationType === 'hourly' ? '/hr' : '/yr'
  const compDisplay = form.compensationMin && form.compensationMax
    ? `$${Number(form.compensationMin).toLocaleString()}${compLabel} – $${Number(form.compensationMax).toLocaleString()}${compLabel}`
    : 'Not set'

  const canPreview = form.title.trim() && form.description.trim() && form.compensationMin && form.compensationMax

  const handleCheckout = async () => {
    setPosting(true)
    setError('')
    try {
      const res = await fetch('/api/jobs/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          employmentType: form.employmentType,
          compensationMin: Number(form.compensationMin),
          compensationMax: Number(form.compensationMax),
          compensationType: form.compensationType,
          city: form.city.trim() || undefined,
          state: form.state.trim() || undefined,
          whatLookingFor: form.whatLookingFor.trim() || undefined,
          applyEmail: form.applyEmail.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        setError(data.error || 'Checkout failed.')
        setPosting(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setPosting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold">{step === 'form' ? 'Post a Job' : 'Review & Pay'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
        </div>

        {step === 'form' ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
              <input value={form.title} onChange={e => update('title', e.target.value)} required placeholder="e.g. Associate Doctor (Full-Time)"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={5} placeholder="Describe the role, your practice, and what a typical day looks like..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
              <select value={form.employmentType} onChange={e => update('employmentType', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="Full-time">Full-time (W-2)</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Independent Contractor (1099)</option>
                <option value="Partnership">Partnership / Buy-In</option>
              </select>
            </div>

            {/* Compensation — required with explanation */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <label className="block text-sm font-bold text-gray-700 mb-1">Compensation Range *</label>
              <p className="text-xs text-gray-500 mb-3">Students filter jobs by pay first. A post without a range gets skipped. Be honest and you'll attract the right candidates.</p>
              <div className="flex items-center gap-2 mb-2">
                <select value={form.compensationType} onChange={e => update('compensationType', e.target.value)}
                  className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white">
                  <option value="salary">Annual Salary</option>
                  <option value="hourly">Hourly Rate</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Minimum ($)</label>
                  <input type="number" min="0" value={form.compensationMin} onChange={e => update('compensationMin', e.target.value)} required
                    placeholder={form.compensationType === 'hourly' ? '35' : '60000'}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Maximum ($)</label>
                  <input type="number" min="0" value={form.compensationMax} onChange={e => update('compensationMax', e.target.value)} required
                    placeholder={form.compensationType === 'hourly' ? '50' : '90000'}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input value={form.city} onChange={e => update('city', e.target.value)} placeholder="e.g. Nashville"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input value={form.state} onChange={e => update('state', e.target.value)} placeholder="e.g. TN"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">What you're looking for (optional)</label>
              <textarea value={form.whatLookingFor} onChange={e => update('whatLookingFor', e.target.value)} rows={3}
                placeholder="Describe your ideal candidate: technique experience, personality fit, goals..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact email for applications</label>
              <input type="email" value={form.applyEmail} onChange={e => update('applyEmail', e.target.value)}
                placeholder="Applications also appear in your dashboard"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>

            <button onClick={() => setStep('preview')} disabled={!canPreview}
              className="w-full py-3 bg-neuro-navy text-white rounded-lg hover:bg-neuro-navy/90 transition-colors text-sm font-bold disabled:opacity-40 min-h-[44px]">
              Preview Listing
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Preview */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-2">How students will see your listing</p>
              <h3 className="text-lg font-bold text-neuro-navy mb-1">{form.title}</h3>
              <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                {form.city && <span>{form.city}{form.state ? `, ${form.state}` : ''}</span>}
                <span>{form.employmentType}</span>
                <span className="text-green-600 font-bold">{compDisplay}</span>
              </div>
              <p className="text-sm text-gray-600 whitespace-pre-line line-clamp-4">{form.description}</p>
              {form.whatLookingFor && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs font-bold text-gray-500 mb-1">Looking for:</p>
                  <p className="text-sm text-gray-600">{form.whatLookingFor}</p>
                </div>
              )}
            </div>

            {/* Pricing */}
            <div className="bg-neuro-orange/5 border border-neuro-orange/20 rounded-xl p-4 text-center">
              <p className="text-2xl font-black text-neuro-navy">$99</p>
              <p className="text-sm text-gray-500">for 30 days on the NeuroChiro Job Board</p>
              <p className="text-xs text-gray-400 mt-2">Your listing will be visible to all verified chiropractic students. Applications go to your dashboard and email. You can edit the listing while it's active.</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep('form')} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-200 min-h-[44px]">
                Edit
              </button>
              <button onClick={handleCheckout} disabled={posting}
                className="flex-1 py-3 bg-neuro-orange text-white rounded-lg text-sm font-bold hover:bg-neuro-orange/90 disabled:opacity-50 min-h-[44px]">
                {posting ? 'Redirecting to checkout...' : 'Pay $99 & Post'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
