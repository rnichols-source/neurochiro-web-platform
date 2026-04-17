"use client";

import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, Lock, ChevronDown, ChevronUp, Dumbbell, Wind, Sparkles } from "lucide-react";
import Link from "next/link";
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

  // High stress (4-5 on 1-5 scale)
  if (checkin.stress >= 4) {
    return {
      message: "Feeling stressed? Start here.",
      icon: Wind,
      exercises: EXERCISES.filter((e: Exercise) => e.category === "breathing").slice(0, 4),
    };
  }

  // High pain (4-5 on 1-5 scale)
  if (checkin.pain >= 4) {
    return {
      message: "Let\u2019s ease into it gently today.",
      icon: Sparkles,
      exercises: EXERCISES.filter((e: Exercise) => e.difficulty === "Beginner").slice(0, 4),
    };
  }

  // Low energy (1-2 on 1-5 scale)
  if (checkin.energy <= 2) {
    return {
      message: "Let\u2019s wake your body up.",
      icon: Dumbbell,
      exercises: EXERCISES.filter((e: Exercise) => e.category === "full-body").slice(0, 4),
    };
  }

  // All good — maintenance
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
    Beginner: "bg-green-100 text-green-700",
    Intermediate: "bg-yellow-100 text-yellow-700",
    Advanced: "bg-red-100 text-red-700",
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
      className={`bg-white rounded-2xl border transition-all ${
        isCompleted
          ? "border-green-200 bg-green-50/30"
          : locked
          ? "border-gray-100 opacity-75"
          : "border-gray-100 hover:border-neuro-orange/30 hover:shadow-md"
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
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <Lock className="w-4 h-4 text-gray-400" />
            </div>
          ) : isCompleted ? (
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-neuro-orange/10 flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-neuro-orange" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-bold text-neuro-navy text-base">{exercise.name}</h3>
            <DifficultyBadge difficulty={exercise.difficulty} />
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>{exercise.duration}</span>
            <span className="text-gray-200">|</span>
            <span>{exercise.bodyAreas.join(", ")}</span>
          </div>
        </div>

        {!locked && (
          <div className="shrink-0 mt-1">
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-gray-300" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-300" />
            )}
          </div>
        )}
      </button>

      {/* Locked overlay message */}
      {locked && (
        <div className="px-5 pb-4 -mt-1">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Lock className="w-3 h-3" />
            <span>Unlock with Premium &mdash; $9/month</span>
          </div>
        </div>
      )}

      {/* Expanded details */}
      {expanded && !locked && (
        <div className="px-5 pb-5 border-t border-gray-50 pt-4 space-y-4">
          {/* Instructions */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
              Instructions
            </p>
            <p className="text-base text-gray-700 leading-relaxed">{exercise.instructions}</p>
          </div>

          {/* Pro tip */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs font-black text-blue-600 uppercase tracking-wide mb-1">
              Pro Tip
            </p>
            <p className="text-sm text-blue-800 leading-relaxed">{exercise.proTip}</p>
          </div>

          {/* Nervous system note */}
          <p className="text-sm text-neuro-orange font-medium leading-relaxed">
            {exercise.nervousSystemWhy}
          </p>

          {/* Sets & Reps + Frequency */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm">
            <div>
              <span className="text-gray-400 text-xs font-bold uppercase">Sets/Reps:</span>{" "}
              <span className="font-bold text-neuro-navy">{exercise.setsReps}</span>
            </div>
            <div>
              <span className="text-gray-400 text-xs font-bold uppercase">Frequency:</span>{" "}
              <span className="font-bold text-neuro-navy">{exercise.frequency}</span>
            </div>
          </div>

          {/* Mark Complete button */}
          {isCompleted ? (
            <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
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
              className="px-5 py-3 bg-neuro-navy text-white rounded-xl font-bold text-sm hover:bg-neuro-navy/90 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {completing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Mark Complete
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
        <Loader2 className="w-8 h-8 text-neuro-orange animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <header>
        <h1 className="text-2xl font-heading font-black text-neuro-navy uppercase tracking-tight">
          Exercise Library
        </h1>
        <p className="text-gray-500 mt-1">
          Exercises designed for your nervous system health.
        </p>
      </header>

      {/* Daily Recommended Routine */}
      <section className="bg-neuro-navy rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-neuro-orange/20 flex items-center justify-center">
            <recommendation.icon className="w-5 h-5 text-neuro-orange" />
          </div>
          <div>
            <h2 className="font-black text-lg">Today&apos;s Routine</h2>
            {checkin ? (
              <p className="text-gray-300 text-sm">{recommendation.message}</p>
            ) : (
              <p className="text-gray-400 text-sm">
                Check in first to get personalized recommendations.
              </p>
            )}
          </div>
        </div>

        {checkin && recommendation.exercises.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {recommendation.exercises.map((ex) => (
              <div
                key={ex.id}
                className="bg-white/10 rounded-xl p-4 flex items-center gap-3"
              >
                {completedIds.has(ex.id) ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                ) : (
                  <Dumbbell className="w-5 h-5 text-neuro-orange shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{ex.name}</p>
                  <p className="text-xs text-gray-400">
                    {ex.duration} &middot; {ex.difficulty}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : !checkin ? (
          <Link
            href="/portal/track"
            className="mt-4 inline-flex items-center gap-2 px-5 py-3 bg-neuro-orange text-white rounded-xl font-bold text-sm hover:bg-neuro-orange/90 transition-all"
          >
            Log Today&apos;s Check-in
          </Link>
        ) : null}
      </section>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
        <button
          onClick={() => setActiveCategory("all")}
          className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all shrink-0 ${
            activeCategory === "all"
              ? "bg-neuro-navy text-white"
              : "bg-white border border-gray-200 text-gray-500 hover:border-neuro-orange/30"
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
                ? "bg-neuro-navy text-white"
                : "bg-white border border-gray-200 text-gray-500 hover:border-neuro-orange/30"
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
        <div className="bg-neuro-navy rounded-2xl p-6 text-center">
          <Lock className="w-8 h-8 text-neuro-orange mx-auto mb-3" />
          <h3 className="text-white font-black text-lg mb-2">
            Unlock All {EXERCISES.length} Exercises
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            Get personalized routines, track your progress, and access the full
            exercise library.
          </p>
          <p className="text-white font-bold mb-4">
            $9/month &middot; Cancel anytime
          </p>
          <button className="px-6 py-3 bg-neuro-orange text-white rounded-xl font-bold text-sm hover:bg-neuro-orange/90 transition-all">
            Start Free Trial &mdash; 7 Days Free
          </button>
        </div>
      )}
    </div>
  );
}
