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
} from "lucide-react";
import { motion } from "framer-motion";
import { getCareerReadinessData } from "../dashboard/actions";

const BRAND_NAVY = "#1a2744";
const BRAND_ORANGE = "#e97325";

interface StageConfig {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  description: string;
  icon: any;
  color: string;
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
    color: "#8b5cf6",
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
    color: "#3b82f6",
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
    color: "#ec4899",
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
    description: "Practice real interview questions doctors ask. Learn the frameworks that turn 'I don't know' into 'I got the job.' Complete the Associate Playbook for the full picture.",
    icon: ClipboardList,
    color: "#f59e0b",
    href: "/student/interview-prep",
    secondaryHref: "/student/academy",
    secondaryLabel: "Associate Playbook Course",
    estimatedTime: "3-5 hours",
    tasks: [
      "Practice 20+ interview questions",
      "Learn the STAR framework for behavioral questions",
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
    color: BRAND_ORANGE,
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
    description: "Don't sign a contract without reviewing it first. Then plan your finances so you know exactly what your first year looks like — loans, taxes, budget, everything.",
    icon: DollarSign,
    color: "#06b6d4",
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

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
};

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
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-neuro-orange/10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-neuro-orange animate-spin" />
          </div>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading pipeline...</p>
        </div>
      </div>
    );
  }

  const milestones = readiness?.milestones || {};
  const modulesCompleted = readiness?.raw?.modulesCompleted || 0;
  const completedStages = STAGES.filter((s) => s.checkComplete(milestones, modulesCompleted)).length;

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <motion.div {...fadeUp}>
        <div className="flex items-center gap-3 mb-2">
          <Map className="w-8 h-8 text-neuro-orange" />
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-black text-neuro-navy">
              Career Pipeline
            </h1>
            <p className="text-gray-400 text-sm">
              Your guided path from student to associate
            </p>
          </div>
        </div>
      </motion.div>

      {/* Progress summary */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 }}>
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            {STAGES.map((stage) => {
              const done = stage.checkComplete(milestones, modulesCompleted);
              return (
                <div
                  key={stage.id}
                  className="w-8 h-2 rounded-full transition-colors"
                  style={{ backgroundColor: done ? stage.color : "#e5e7eb" }}
                />
              );
            })}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-neuro-navy">
              {completedStages} of {STAGES.length} stages complete
            </p>
            <p className="text-xs text-gray-400">
              {completedStages === STAGES.length
                ? "You've completed the entire pipeline. You're ready."
                : completedStages === 0
                ? "Start with Stage 1 — build your foundation."
                : "Keep going — every stage gets you closer to your career."}
            </p>
          </div>
          {readiness && (
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-neuro-orange/10 rounded-full">
              <Zap className="w-4 h-4 text-neuro-orange" />
              <span className="text-sm font-black text-neuro-orange">{readiness.totalScore}%</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Stages */}
      <div className="space-y-4">
        {STAGES.map((stage, idx) => {
          const done = stage.checkComplete(milestones, modulesCompleted);
          const active = !done && stage.checkActive(milestones, modulesCompleted);
          const Icon = stage.icon;

          return (
            <motion.div
              key={stage.id}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.1 + idx * 0.05 }}
            >
              <div
                className={`bg-white rounded-3xl border shadow-sm overflow-hidden transition-all ${
                  done
                    ? "border-gray-100"
                    : active
                    ? "border-[#e97325]/30 shadow-md"
                    : "border-gray-100 opacity-75"
                }`}
              >
                <div className="p-6 md:p-8">
                  <div className="flex items-start gap-4">
                    {/* Stage number/icon */}
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: done ? stage.color : active ? `${stage.color}15` : "#f3f4f6",
                      }}
                    >
                      {done ? (
                        <CheckCircle className="w-6 h-6 text-white" />
                      ) : (
                        <Icon className="w-6 h-6" style={{ color: active ? stage.color : "#9ca3af" }} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-[10px] font-black uppercase tracking-widest"
                          style={{ color: done ? stage.color : active ? stage.color : "#9ca3af" }}
                        >
                          Stage {stage.number}
                        </span>
                        {done && (
                          <span className="text-[10px] font-black uppercase tracking-widest text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            Complete
                          </span>
                        )}
                        {active && (
                          <span className="text-[10px] font-black uppercase tracking-widest text-neuro-orange bg-neuro-orange/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5" /> Current
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-heading font-black text-neuro-navy mb-0.5">
                        {stage.title}
                      </h3>
                      <p className="text-xs font-bold text-gray-400 mb-2">{stage.subtitle}</p>
                      <p className="text-sm text-gray-500 leading-relaxed mb-4">
                        {stage.description}
                      </p>

                      {/* Tasks */}
                      <div className="space-y-1.5 mb-4">
                        {stage.tasks.map((task, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <div className="w-4 h-4 rounded border border-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                              {done && <CheckCircle className="w-3 h-3 text-green-500" />}
                            </div>
                            <span className={`text-xs ${done ? "text-gray-400 line-through" : "text-gray-600"}`}>
                              {task}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* CTAs */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <Link
                          href={stage.href}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                          style={{
                            backgroundColor: done ? "#f3f4f6" : active ? BRAND_ORANGE : `${stage.color}10`,
                            color: done ? "#9ca3af" : active ? "#fff" : stage.color,
                          }}
                        >
                          {done ? "Review" : active ? "Start This Stage" : "Preview"}
                          {!done && <ArrowRight className="w-4 h-4" />}
                        </Link>
                        {stage.secondaryHref && (
                          <Link
                            href={stage.secondaryHref}
                            className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-neuro-orange transition-colors"
                          >
                            {stage.secondaryLabel} <ChevronRight className="w-3 h-3" />
                          </Link>
                        )}
                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest ml-auto">
                          ~{stage.estimatedTime}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Connecting line between stages */}
                {idx < STAGES.length - 1 && (
                  <div className="flex justify-start px-8 md:px-12">
                    <div className="w-0.5 h-4" style={{ backgroundColor: done ? stage.color : "#e5e7eb" }} />
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Completion state */}
      {completedStages === STAGES.length && (
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.5 }}>
          <div className="bg-neuro-navy rounded-3xl p-8 md:p-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "var(--grid-pattern)" }} />
            <div className="relative">
              <div className="w-16 h-16 bg-neuro-orange/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-neuro-orange" />
              </div>
              <h2 className="text-2xl font-heading font-black text-white mb-2">
                Pipeline Complete
              </h2>
              <p className="text-gray-400 max-w-md mx-auto">
                You&apos;ve completed every stage. You have the knowledge, the skills, and the plan.
                Now go build the career you deserve.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
