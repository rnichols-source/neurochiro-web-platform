"use client";

import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, Lock, ChevronDown, ChevronUp, Dumbbell, Wind, Sparkles } from "lucide-react";
import Link from "next/link";
import { createPremiumCheckout } from "../premium-actions";
import { EXERCISES, EXERCISE_CATEGORIES, type Exercise } from "../exercises-data";
import {
  markExerciseComplete,
  getCompletedExercises,
  getTodayCheckin,
  isPremiumMember,
} from "../premium-actions";

const FREE_LIMIT = 5;

type CheckinData = {
  date: string;
  sleep: number;
  stress: number;
  energy: number;
  pain: number;
  score: number;
  note: string | null;
} | null;

function getDailyRecommendation(checkin: CheckinData): {
  message: string;
  exercises: Exercise[];
  icon: typeof Wind;
} {
  if (!checkin) {
    return { message: "", exercises: [], icon: Sparkles };
  }

  if (checkin.stress >= 4) {
    return {
      message: "Feeling stressed? Start here.",
      icon: Wind,
      exercises: EXERCISES.filter((e: Exercise) => e.category === "breathing").slice(0, 4),
    };
  }

  if (checkin.pain >= 4) {
    return {
      message: "Let\u2019s ease into it gently today.",
      icon: Sparkles,
      exercises: EXERCISES.filter((e: Exercise) => e.difficulty === "Beginner").slice(0, 4),
    };
  }

  if (checkin.energy <= 2) {
    return {
      message: "Let\u2019s wake your body up.",
      icon: Dumbbell,
      exercises: EXERCISES.filter((e: Exercise) => e.category === "full-body").slice(0, 4),
    };
  }

  return {
    message: "Great day \u2014 let\u2019s keep the momentum.",
    icon: Sparkles,
    exercises: [
      EXERCISES.find((e: Exercise) => e.id === "chin-tuck"),
      EXERCISES.find((e: Exercise) => e.category === "low-back-core"),
      EXERCISES.find((e: Exercise) => e.category === "breathing"),
      EXERCISES.find((e: Exercise) => e.category === "full-body"),
    ].filter(Boolean) as Exercise[],
  };
}

function DifficultyBadge({ difficulty }: { difficulty: Exercise["difficulty"] }) {
  const colors = {
    Beginner: "bg-green-500/10 text-green-400",
    Intermediate: "bg-yellow-500/10 text-yellow-400",
    Advanced: "bg-red-500/10 text-red-400",
  };
  return (
    <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full ${colors[difficulty]}`}>
      {difficulty}
    </span>
  );
}

function ExerciseCard({
  exercise,
  globalIndex,
  isCompleted,
  isPremium,
  onComplete,
}: {
  exercise: Exercise;
  globalIndex: number;
  isCompleted: boolean;
  isPremium: boolean;
  onComplete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [completing, setCompleting] = useState(false);
  const locked = !isPremium && globalIndex >= FREE_LIMIT;

  return (
    <div
      className={`bg-[#162231] rounded-2xl border transition-all ${
        isCompleted
          ? "border-green-500/20 bg-green-500/[0.03]"
          : locked
          ? "border-white/[0.08] opacity-75"
          : "border-white/[0.08] hover:border-[#D66829]/20 hover:shadow-lg hover:shadow-black/20"
      }`}
    >
      <button
        onClick={() => !locked && setExpanded(!expanded)}
        className="w-full text-left p-5 flex items-start gap-4"
        disabled={locked}
      >
        {/* Completion indicator or lock */}
        <div className="shrink-0 mt-0.5">
          {locked ? (
            <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center">
              <Lock className="w-4 h-4 text-white/35" />
            </div>
          ) : isCompleted ? (
            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#D66829]/10 flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-[#D66829]" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-bold text-white text-base">{exercise.name}</h3>
            <DifficultyBadge difficulty={exercise.difficulty} />
          </div>
          <div className="flex items-center gap-3 text-xs text-white/35">
            <span>{exercise.duration}</span>
            <span className="text-white/20">|</span>
            <span>{exercise.bodyAreas.join(", ")}</span>
          </div>
        </div>

        {!locked && (
          <div className="shrink-0 mt-1">
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-white/20" />
            ) : (
              <ChevronDown className="w-5 h-5 text-white/20" />
            )}
          </div>
        )}
      </button>

      {/* Locked overlay message */}
      {locked && (
        <div className="px-5 pb-4 -mt-1">
          <div className="flex items-center gap-2 text-xs text-white/35">
            <Lock className="w-3 h-3" />
            <span>Unlock with Premium &mdash; $9/month</span>
          </div>
        </div>
      )}

      {/* Expanded details */}
      {expanded && !locked && (
        <div className="px-5 pb-5 border-t border-white/[0.06] pt-4 space-y-4">
          {/* Instructions */}
          <div>
            <p className="text-xs font-bold text-white/35 uppercase tracking-wide mb-2">
              Instructions
            </p>
            <p className="text-[13px] text-white/60 leading-relaxed">{exercise.instructions}</p>
          </div>

          {/* Pro tip */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <p className="text-xs font-black text-blue-400 uppercase tracking-wide mb-1">
              Pro Tip
            </p>
            <p className="text-sm text-blue-300 leading-relaxed">{exercise.proTip}</p>
          </div>

          {/* Nervous system note */}
          <p className="text-sm text-[#D66829] font-medium leading-relaxed">
            {exercise.nervousSystemWhy}
          </p>

          {/* Sets & Reps + Frequency */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm">
            <div>
              <span className="text-white/35 text-xs font-bold uppercase">Sets/Reps:</span>{" "}
              <span className="font-bold text-white">{exercise.setsReps}</span>
            </div>
            <div>
              <span className="text-white/35 text-xs font-bold uppercase">Frequency:</span>{" "}
              <span className="font-bold text-white">{exercise.frequency}</span>
            </div>
          </div>

          {/* Mark Complete button */}
          {isCompleted ? (
            <div className="flex items-center gap-2 text-green-400 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              Completed today
            </div>
          ) : (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                setCompleting(true);
                try {
                  await markExerciseComplete(exercise.id);
                  onComplete(exercise.id);
                } catch {
                  // Silently fail
                }
                setCompleting(false);
              }}
              disabled={completing}
              className="px-5 py-3 bg-[#D66829] text-white rounded-xl font-bold text-sm hover:bg-[#e8834a] transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-[#D66829]/20"
            >
              {completing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Done -- Mark Complete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function ExercisesPage() {
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [checkin, setCheckin] = useState<CheckinData>(null);
  const [premium, setPremium] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [checkinData, completedData, premiumStatus] = await Promise.all([
          getTodayCheckin(),
          getCompletedExercises(),
          isPremiumMember(),
        ]);
        setCheckin(checkinData);
        const todayStr = new Date().toISOString().split("T")[0];
        const todayCompleted = (completedData || [])
          .filter((c) => c.completed_at?.startsWith(todayStr))
          .map((c) => c.exercise_id);
        setCompletedIds(new Set(todayCompleted));
        setPremium(premiumStatus);
      } catch {
        // Graceful fallback
      }
      setLoading(false);
    }
    load();
  }, []);

  const recommendation = getDailyRecommendation(checkin);

  const filteredExercises =
    activeCategory === "all"
      ? EXERCISES
      : EXERCISES.filter((e) => e.category === activeCategory);

  const handleComplete = (id: string) => {
    setCompletedIds((prev) => new Set([...prev, id]));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-5 h-5 text-[#D66829] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <header>
        <h1 className="text-2xl font-bold text-white">
          Exercises
        </h1>
        <p className="text-xs text-white/35 mt-1">
          Stretches and movements to help your body feel better. Start with what feels right for you.
        </p>
      </header>

      {/* Daily Recommended Routine */}
      <section className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl p-6 border border-white/[0.08] shadow-lg shadow-black/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#D66829]/20 flex items-center justify-center">
            <recommendation.icon className="w-5 h-5 text-[#D66829]" />
          </div>
          <div>
            <h2 className="font-black text-lg text-white">Today&apos;s Routine</h2>
            {checkin ? (
              <p className="text-white/40 text-sm">{recommendation.message}</p>
            ) : (
              <p className="text-white/35 text-sm">
                Log today&apos;s check-in first so we can recommend the best exercises for how you&apos;re feeling.
              </p>
            )}
          </div>
        </div>

        {checkin && recommendation.exercises.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {recommendation.exercises.map((ex) => (
              <div
                key={ex.id}
                className="bg-white/[0.06] rounded-xl p-4 flex items-center gap-3 border border-white/[0.08]"
              >
                {completedIds.has(ex.id) ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                ) : (
                  <Dumbbell className="w-5 h-5 text-[#D66829] shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-bold text-sm text-white truncate">{ex.name}</p>
                  <p className="text-xs text-white/35">
                    {ex.duration} &middot; {ex.difficulty}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : !checkin ? (
          <Link
            href="/portal/track"
            className="mt-4 inline-flex items-center gap-2 px-5 py-3 bg-[#D66829] text-white rounded-xl font-bold text-sm hover:bg-[#e8834a] transition-all shadow-lg shadow-[#D66829]/20"
          >
            Log Today&apos;s Check-In First
          </Link>
        ) : null}
      </section>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
        <button
          onClick={() => setActiveCategory("all")}
          className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all shrink-0 ${
            activeCategory === "all"
              ? "bg-[#D66829] text-white"
              : "bg-white/[0.04] border border-white/[0.08] text-white/40 hover:text-white hover:bg-white/[0.1]"
          }`}
        >
          All
        </button>
        {EXERCISE_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all shrink-0 ${
              activeCategory === cat.key
                ? "bg-[#D66829] text-white"
                : "bg-white/[0.04] border border-white/[0.08] text-white/40 hover:text-white hover:bg-white/[0.1]"
            }`}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Exercise Cards */}
      <div className="space-y-3">
        {filteredExercises.map((exercise) => {
          const globalIndex = EXERCISES.indexOf(exercise);
          return (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              globalIndex={globalIndex}
              isCompleted={completedIds.has(exercise.id)}
              isPremium={premium}
              onComplete={handleComplete}
            />
          );
        })}
      </div>

      {/* Premium upsell at bottom if not premium */}
      {!premium && (
        <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl p-6 text-center border border-white/[0.08] shadow-lg shadow-black/20">
          <Lock className="w-8 h-8 text-[#D66829] mx-auto mb-3" />
          <h3 className="text-white font-black text-lg mb-2">
            Get All {EXERCISES.length} Exercises
          </h3>
          <p className="text-white/40 text-sm mb-4">
            Premium members get daily routines personalized to how they&apos;re feeling,
            plus access to every exercise with detailed instructions.
          </p>
          <p className="text-white font-bold mb-4">
            $9/month &middot; Cancel anytime
          </p>
          <button onClick={async () => { const r = await createPremiumCheckout(); if (r?.url) window.location.href = r.url; }} className="px-6 py-3 bg-[#D66829] text-white rounded-xl font-bold text-sm hover:bg-[#e8834a] transition-all shadow-lg shadow-[#D66829]/20">
            Start Free Trial &mdash; 7 Days Free
          </button>
        </div>
      )}
    </div>
  );
}
