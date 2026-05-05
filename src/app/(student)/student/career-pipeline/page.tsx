"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Compass,
  ClipboardList,
  Briefcase,
  FileText,
  DollarSign,
  CheckCircle,
  ArrowRight,
  ChevronRight,
  Loader2,
  Map,
  Zap,
  Target,
  Award,
  Check,
} from "lucide-react";
import { getCareerReadinessData } from "../dashboard/actions";

interface StageConfig {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  description: string;
  icon: any;
  href: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  estimatedTime: string;
  tasks: string[];
  checkComplete: (m: any, mods: number) => boolean;
  checkActive: (m: any, mods: number) => boolean;
}

const STAGES: StageConfig[] = [
  {
    id: "foundation",
    number: 1,
    title: "Build Your Foundation",
    subtitle: "Nervous System Foundations + Neuroplasticity",
    description: "Master the core principles that separate nervous system chiropractors from everyone else. These two courses give you the clinical lens your school didn't.",
    icon: BookOpen,
    href: "/student/academy",
    estimatedTime: "4-6 hours",
    tasks: [
      "Complete Nervous System Foundations (3 modules)",
      "Complete Neuroplasticity (3 modules)",
      "Apply the nervous system lens to 3 clinical observations",
    ],
    checkComplete: (m: any) => m.firstCourseCompleted,
    checkActive: (m: any) => !m.firstCourseCompleted,
  },
  {
    id: "technique",
    number: 2,
    title: "Find Your Technique",
    subtitle: "Technique Explorer + Find Your Fit Quiz",
    description: "Explore 18 chiropractic techniques side by side. Take the quiz to discover which ones match your personality and practice goals.",
    icon: Compass,
    href: "/student/techniques",
    estimatedTime: "1-2 hours",
    tasks: [
      "Browse the Technique Explorer",
      "Take the Find Your Fit quiz",
      "Compare your top 3 techniques in the Comparison Tool",
    ],
    checkComplete: (_m: any, mods: number) => mods >= 8,
    checkActive: (m: any) => m.firstCourseCompleted,
  },
  {
    id: "identity",
    number: 3,
    title: "Develop Clinical Identity",
    subtitle: "Clinical Identity + Clinical Confidence courses",
    description: "Build your brand. Learn to communicate with patients, present yourself to employers, and develop the confidence that gets you hired.",
    icon: Target,
    href: "/student/academy",
    estimatedTime: "6-8 hours",
    tasks: [
      "Complete Clinical Identity course (4 modules)",
      "Complete Clinical Confidence course (4 modules)",
      "Write your 30-second elevator pitch",
      "Draft your one-paragraph professional bio",
    ],
    checkComplete: (_m: any, mods: number) => mods >= 14,
    checkActive: (_m: any, mods: number) => mods >= 6,
  },
  {
    id: "interview",
    number: 4,
    title: "Prepare for Interviews",
    subtitle: "Interview Prep + Associate Playbook",
    description: "Practice real interview questions doctors ask. Learn the frameworks that turn 'I don't know' into 'I got the job.'",
    icon: ClipboardList,
    href: "/student/interview-prep",
    secondaryHref: "/student/academy",
    secondaryLabel: "Associate Playbook",
    estimatedTime: "3-5 hours",
    tasks: [
      "Practice 20+ interview questions",
      "Learn the STAR framework",
      "Complete the Associate Playbook course",
      "Prepare your questions to ask the interviewer",
    ],
    checkComplete: (_m: any, mods: number) => mods >= 18,
    checkActive: (_m: any, mods: number) => mods >= 12,
  },
  {
    id: "jobs",
    number: 5,
    title: "Land Your Position",
    subtitle: "Job Board + Applications",
    description: "Browse matched jobs, filter by what matters to you, and submit your first application. Your profile, courses, and interview prep have prepared you for this.",
    icon: Briefcase,
    href: "/student/jobs",
    estimatedTime: "Ongoing",
    tasks: [
      "Review your top job matches",
      "Apply to at least 3 positions",
      "Follow up on applications within 48 hours",
    ],
    checkComplete: (m: any) => m.firstJobApp,
    checkActive: (_m: any, mods: number) => mods >= 14,
  },
  {
    id: "secure",
    number: 6,
    title: "Secure Your Future",
    subtitle: "Contract Lab + Financial Planner",
    description: "Don't sign a contract without reviewing it first. Then plan your finances so you know exactly what your first year looks like.",
    icon: DollarSign,
    href: "/student/contract-lab",
    secondaryHref: "/student/financial-planner",
    secondaryLabel: "Financial Planner",
    estimatedTime: "2-4 hours",
    tasks: [
      "Run your contract through Contract Lab",
      "Identify red flags and negotiation points",
      "Complete your financial plan",
      "Set up your student loan repayment strategy",
    ],
    checkComplete: (m: any) => m.contractReviewed && m.financialPlanCreated,
    checkActive: (m: any) => m.firstJobApp,
  },
];

export default function CareerPipelinePage() {
  const [readiness, setReadiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCareerReadinessData().then((data) => {
      setReadiness(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-5 h-5 text-[#D66829] animate-spin" />
      </div>
    );
  }

  const milestones = readiness?.milestones || {};
  const modulesCompleted = readiness?.raw?.modulesCompleted || 0;
  const completedStages = STAGES.filter((s) => s.checkComplete(milestones, modulesCompleted)).length;

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Map className="w-6 h-6 text-[#D66829]" />
        <div>
          <h1 className="text-2xl font-bold text-white">Career Pipeline</h1>
          <p className="text-xs text-white/35">Your guided path from student to associate</p>
        </div>
      </div>

      {/* Progress summary */}
      <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 p-5 flex items-center gap-5">
        <div className="flex items-center gap-1">
          {STAGES.map((stage) => {
            const done = stage.checkComplete(milestones, modulesCompleted);
            return (
              <div
                key={stage.id}
                className={`w-8 h-2.5 rounded-sm ${done ? "bg-gradient-to-r from-[#D66829] to-[#e8834a]" : "bg-white/[0.06]"}`}
              />
            );
          })}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">
            {completedStages} of {STAGES.length} stages complete
          </p>
          <p className="text-xs text-white/35">
            {completedStages === STAGES.length
              ? "You've completed the entire pipeline."
              : completedStages === 0
              ? "Start with Stage 1 — build your foundation."
              : "Keep going — every stage gets you closer."}
          </p>
        </div>
        {readiness && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] border border-white/[0.06] rounded-lg">
            <Zap className="w-3.5 h-3.5 text-[#D66829]" />
            <span className="text-sm font-semibold text-[#D66829]">{readiness.totalScore}%</span>
          </div>
        )}
      </div>

      {/* Stages */}
      <div className="space-y-3">
        {STAGES.map((stage, idx) => {
          const done = stage.checkComplete(milestones, modulesCompleted);
          const active = !done && stage.checkActive(milestones, modulesCompleted);
          const Icon = stage.icon;

          return (
            <div key={stage.id}>
              <div
                className={`bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border shadow-lg shadow-black/20 overflow-hidden transition-all ${
                  active
                    ? "border-[#D66829]/30"
                    : "border-white/[0.08]"
                } ${!done && !active ? "opacity-60" : ""}`}
              >
                <div className="p-6 md:p-8">
                  <div className="flex items-start gap-4">
                    {/* Stage icon */}
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        done
                          ? "bg-[#D66829]"
                          : active
                          ? "bg-[#D66829]/15 border border-[#D66829]/30"
                          : "bg-white/[0.04]"
                      }`}
                    >
                      {done ? (
                        <Check className="w-5 h-5 text-white" strokeWidth={3} />
                      ) : (
                        <Icon className={`w-5 h-5 ${active ? "text-[#D66829]" : "text-white/20"}`} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
                          Stage {stage.number}
                        </span>
                        {done && (
                          <span className="text-[10px] font-semibold text-[#D66829] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D66829]" /> Complete
                          </span>
                        )}
                        {active && (
                          <span className="text-[10px] font-semibold text-[#D66829] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D66829] animate-pulse" /> Current
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-white mb-0.5">
                        {stage.title}
                      </h3>
                      <p className="text-[11px] text-white/30 mb-2">{stage.subtitle}</p>
                      <p className="text-[13px] text-white/45 leading-relaxed mb-5">
                        {stage.description}
                      </p>

                      {/* Tasks */}
                      <div className="space-y-2 mb-5">
                        {stage.tasks.map((task, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <div className={`w-4 h-4 rounded-sm border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              done ? "border-[#D66829] bg-[#D66829]" : "border-white/[0.1]"
                            }`}>
                              {done && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                            </div>
                            <span className={`text-[12px] ${done ? "text-white/25 line-through" : "text-white/50"}`}>
                              {task}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* CTAs */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <Link
                          href={stage.href}
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                            done
                              ? "bg-white/[0.04] text-white/30"
                              : active
                              ? "bg-[#D66829] text-white shadow-lg shadow-[#D66829]/20 hover:bg-[#e8834a]"
                              : "bg-white/[0.04] text-white/40"
                          }`}
                        >
                          {done ? "Review" : active ? "Start This Stage" : "Preview"}
                          {!done && <ArrowRight className="w-4 h-4" />}
                        </Link>
                        {stage.secondaryHref && (
                          <Link
                            href={stage.secondaryHref}
                            className="flex items-center gap-1 text-xs text-white/25 hover:text-[#D66829] transition-colors"
                          >
                            {stage.secondaryLabel} <ChevronRight className="w-3 h-3" />
                          </Link>
                        )}
                        <span className="text-[10px] text-white/15 ml-auto">
                          ~{stage.estimatedTime}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Connector */}
              {idx < STAGES.length - 1 && (
                <div className="flex justify-start pl-10 md:pl-12">
                  <div className={`w-px h-3 ${done ? "bg-[#D66829]/40" : "bg-white/[0.06]"}`} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Completion */}
      {completedStages === STAGES.length && (
        <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 p-8 md:p-10 text-center">
          <div className="w-14 h-14 bg-[#D66829]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="w-7 h-7 text-[#D66829]" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Pipeline Complete</h2>
          <p className="text-white/35 max-w-md mx-auto text-sm">
            You&apos;ve completed every stage. You have the knowledge, the skills, and the plan.
            Now go build the career you deserve.
          </p>
        </div>
      )}
    </div>
  );
}
