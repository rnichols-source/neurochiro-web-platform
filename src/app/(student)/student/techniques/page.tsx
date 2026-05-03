"use client";
import StudentUpgradeGate from "@/components/student/UpgradeGate";
import { saveToolData, loadToolData } from "@/app/actions/tool-data";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Compass,
  Search,
  ChevronDown,
  ChevronRight,
  Lock,
  X,
  Check,
  Star,
  ArrowRight,
  ArrowLeft,
  BarChart3,
  Filter,
} from "lucide-react";
import {
  TECHNIQUES,
  QUIZ_QUESTIONS,
  CATEGORIES,
  type Technique,
  type QuizQuestion,
} from "./technique-data";
import { createClient } from "@/lib/supabase";

// ─── Constants ───────────────────────────────────────────────────────────────

const LS_KEY = "neurochiro-technique-quiz";
const FREE_TECHNIQUE_LIMIT = 5;
const FREE_QUIZ_LIMIT = 5;
const BRAND_NAVY = "#1a2744";
const BRAND_ORANGE = "#e97325";

const CATEGORY_COLORS: Record<string, string> = {
  structural: "#3b82f6",
  tonal: "#8b5cf6",
  "upper-cervical": "#ec4899",
  instrument: "#f59e0b",
  "soft-tissue": "#22c55e",
};

const TAB_LABELS = ["Technique Explorer", "Find Your Fit", "Comparison Tool"];

const RADAR_AXES = [
  { key: "structural", label: "Structural" },
  { key: "tonal", label: "Tonal" },
  { key: "upper-cervical", label: "Upper Cervical" },
  { key: "instrument", label: "Instrument" },
  { key: "soft-tissue", label: "Soft Tissue" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function buildPolygonPoints(
  cx: number,
  cy: number,
  values: number[],
  maxVal: number,
  radius: number
) {
  return values
    .map((v, i) => {
      const angle = (360 / values.length) * i;
      const r = maxVal > 0 ? (v / maxVal) * radius : 0;
      const { x, y } = polarToXY(cx, cy, r, angle);
      return `${x},${y}`;
    })
    .join(" ");
}

// ─── State Types ─────────────────────────────────────────────────────────────

interface QuizState {
  currentQuestion: number;
  answers: Record<number, string>;
  completed: boolean;
}

const INITIAL_QUIZ: QuizState = {
  currentQuestion: 0,
  answers: {},
  completed: false,
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function TechniqueComparisonGuide() {
  return (
    <StudentUpgradeGate feature="Techniques Library" description="Compare every adjustment technique side by side. Learn the pros, cons, and applications before you commit to your path.">
      <TechniqueComparisonContent />
    </StudentUpgradeGate>
  );
}

function TechniqueComparisonContent() {
  const [activeTab, setActiveTab] = useState(0);
  const [purchased, setPurchased] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Tab 1 state
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Tab 2 state
  const [quiz, setQuiz] = useState<QuizState>(INITIAL_QUIZ);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tab 3 state
  const [compareIds, setCompareIds] = useState<string[]>(["diversified", "gonstead"]);
  const [showThird, setShowThird] = useState(false);

  // localStorage debounce
  const quizRef = useRef(quiz);
  quizRef.current = quiz;

  // ─── Purchase check ────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    async function checkPurchase() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data } = await (supabase as any)
            .from("course_purchases")
            .select("id")
            .eq("course_id", "technique-guide")
            .eq("user_id", user.id)
            .maybeSingle();
          if (!cancelled && data) setPurchased(true);
        }
      } catch {
        // Not logged in or table missing — treat as unpurchased
      }
    }
    checkPurchase();
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Load quiz from Supabase (localStorage fallback) ──────────────────────

  useEffect(() => {
    loadToolData('technique_quiz').then((cloud) => {
      if (cloud) {
        setQuiz((prev) => ({ ...prev, ...cloud }));
      } else {
        try {
          const saved = localStorage.getItem(LS_KEY);
          if (saved) setQuiz((prev) => ({ ...prev, ...JSON.parse(saved) }));
        } catch {}
      }
      setLoaded(true);
    }).catch(() => {
      try {
        const saved = localStorage.getItem(LS_KEY);
        if (saved) setQuiz((prev) => ({ ...prev, ...JSON.parse(saved) }));
      } catch {}
      setLoaded(true);
    });
  }, []);

  // ─── Save quiz to Supabase + localStorage (debounced) ────────────────────

  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(() => {
      const data = quizRef.current;
      saveToolData('technique_quiz', data).catch(() => {});
      try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {}
    }, 500);
    return () => clearTimeout(timer);
  }, [quiz, loaded]);

  // ─── Cleanup advance timer ────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  // ─── Filtering ─────────────────────────────────────────────────────────────

  const filteredTechniques = TECHNIQUES.filter((t) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.summary.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q);
    const matchesCategory =
      categoryFilter === "all" || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // ─── Quiz scoring ─────────────────────────────────────────────────────────

  const computeScores = useCallback(() => {
    const scores: Record<string, number> = {
      structural: 0,
      tonal: 0,
      "upper-cervical": 0,
      instrument: 0,
      "soft-tissue": 0,
    };
    for (const q of QUIZ_QUESTIONS) {
      const ansLabel = quiz.answers[q.id];
      if (!ansLabel) continue;
      const opt = q.options.find((o) => o.label === ansLabel);
      if (!opt) continue;
      for (const [k, v] of Object.entries(opt.points)) {
        scores[k] = (scores[k] || 0) + v;
      }
    }
    return scores;
  }, [quiz.answers]);

  const getTopTechniques = useCallback(() => {
    const scores = computeScores();
    // Score each technique based on how well its category matches
    const ranked = TECHNIQUES.map((t) => {
      const catScore = scores[t.category] || 0;
      const total = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
      const pct = Math.round((catScore / total) * 100);
      return { technique: t, score: catScore, pct };
    });
    ranked.sort((a, b) => b.score - a.score);
    // Deduplicate by picking top 3 from different categories if possible
    const top: typeof ranked = [];
    const seenCats = new Set<string>();
    for (const r of ranked) {
      if (top.length >= 3) break;
      if (!seenCats.has(r.technique.category)) {
        top.push(r);
        seenCats.add(r.technique.category);
      }
    }
    // Fill remaining if less than 3
    if (top.length < 3) {
      for (const r of ranked) {
        if (top.length >= 3) break;
        if (!top.some((t) => t.technique.id === r.technique.id)) {
          top.push(r);
        }
      }
    }
    return top;
  }, [computeScores]);

  const handleAnswer = useCallback(
    (questionId: number, label: string) => {
      setQuiz((prev) => {
        const newAnswers = { ...prev.answers, [questionId]: label };
        const newQ = { ...prev, answers: newAnswers };
        return newQ;
      });
      // Auto-advance after 500ms
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      advanceTimer.current = setTimeout(() => {
        setQuiz((prev) => {
          const qIdx = prev.currentQuestion;
          const maxFree = purchased ? QUIZ_QUESTIONS.length : FREE_QUIZ_LIMIT;
          if (qIdx < QUIZ_QUESTIONS.length - 1 && qIdx < maxFree - 1) {
            return { ...prev, currentQuestion: qIdx + 1 };
          }
          return { ...prev, completed: true };
        });
      }, 500);
    },
    [purchased]
  );

  const resetQuiz = useCallback(() => {
    setQuiz(INITIAL_QUIZ);
    localStorage.removeItem(LS_KEY);
    saveToolData('technique_quiz', null).catch(() => {});
  }, []);

  // ─── Comparison helpers ────────────────────────────────────────────────────

  const setCompareId = (idx: number, val: string) => {
    setCompareIds((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const addThirdColumn = () => {
    setShowThird(true);
    const used = new Set(compareIds);
    const avail = TECHNIQUES.find((t) => !used.has(t.id));
    if (avail) setCompareIds((prev) => [...prev.slice(0, 2), avail.id]);
  };

  const removeThirdColumn = () => {
    setShowThird(false);
    setCompareIds((prev) => prev.slice(0, 2));
  };

  const comparedTechniques = compareIds
    .slice(0, showThird ? 3 : 2)
    .map((id) => TECHNIQUES.find((t) => t.id === id)!)
    .filter(Boolean);

  const generateSummary = useCallback(() => {
    if (comparedTechniques.length < 2) return "";
    const [a, b] = comparedTechniques;
    const parts: string[] = [];
    if (a.forceLevel !== b.forceLevel)
      parts.push(
        `${a.name} uses ${a.forceLevel.toLowerCase()} force while ${b.name} uses ${b.forceLevel.toLowerCase()} force`
      );
    if (a.category !== b.category)
      parts.push(
        `${a.name} is a ${a.category} technique and ${b.name} is ${b.category}`
      );
    if (a.evidenceLevel !== b.evidenceLevel)
      parts.push(
        `${a.name} has ${a.evidenceLevel.toLowerCase()} evidence vs. ${b.name}'s ${b.evidenceLevel.toLowerCase()} evidence`
      );
    if (parts.length === 0)
      return `${a.name} and ${b.name} are similar in many respects. Your choice may come down to personal preference and practice model.`;
    return parts.join(". ") + ". Consider which factors align best with your practice goals.";
  }, [comparedTechniques]);

  if (!loaded) return null;

  // ─── Purchase Gate Overlay ─────────────────────────────────────────────────

  const [purchasing, setPurchasing] = useState(false);
  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      const { createCourseCheckout } = await import("../academy/purchase-actions");
      const result = await createCourseCheckout("course-clinical-identity");
      if (result.url) {
        window.location.href = result.url;
      } else {
        alert(result.error || "Unable to start checkout.");
        setPurchasing(false);
      }
    } catch {
      alert("Unable to start checkout. Please try again.");
      setPurchasing(false);
    }
  };

  const PurchaseGate = ({ message }: { message?: string }) => (
    <div className="absolute inset-0 z-10 backdrop-blur-sm bg-white/70 rounded-2xl flex flex-col items-center justify-center p-6 text-center">
      <Lock className="w-8 h-8 mb-3" style={{ color: BRAND_NAVY }} />
      <p className="font-bold text-lg" style={{ color: BRAND_NAVY }}>
        {message || "$19 — Unlock Full Guide"}
      </p>
      <p className="text-gray-500 text-sm mt-1 max-w-xs">
        Get access to all 18 techniques, the full quiz, and the comparison tool.
      </p>
      <button
        onClick={handlePurchase}
        disabled={purchasing}
        className="mt-4 px-6 py-3 rounded-xl text-white font-bold text-sm transition-colors hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: BRAND_ORANGE }}
      >
        {purchasing ? "Loading..." : "Unlock for $19"}
      </button>
    </div>
  );

  // ─── Tab 1: Technique Explorer ─────────────────────────────────────────────

  const renderExplorer = () => (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <Compass className="w-7 h-7" style={{ color: BRAND_ORANGE }} />
        <h2
          className="text-2xl font-heading font-black"
          style={{ color: BRAND_NAVY }}
        >
          Technique Explorer
        </h2>
      </div>
      <p className="text-gray-500 text-sm mb-6">
        Browse all 18 chiropractic techniques. Search, filter, and expand any card for the complete breakdown.
      </p>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search techniques by name, category, or keyword..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#e97325] transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map((cat) => {
          const isActive = categoryFilter === cat.id;
          const color =
            cat.id === "all" ? BRAND_NAVY : CATEGORY_COLORS[cat.id] || BRAND_NAVY;
          return (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className="px-4 py-1.5 rounded-full text-xs font-bold transition-all border"
              style={{
                backgroundColor: isActive ? color : "transparent",
                color: isActive ? "#fff" : color,
                borderColor: color,
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Technique cards */}
      <div className="space-y-3">
        {filteredTechniques.map((t, idx) => {
          const globalIdx = TECHNIQUES.indexOf(t);
          const isFree = globalIdx < FREE_TECHNIQUE_LIMIT || purchased;
          const isExpanded = expandedId === t.id;
          const catColor = CATEGORY_COLORS[t.category] || BRAND_NAVY;

          return (
            <div
              key={t.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative"
            >
              {/* Collapsed header — always visible */}
              <button
                onClick={() => {
                  if (isFree) setExpandedId(isExpanded ? null : t.id);
                }}
                className="w-full text-left p-5 flex items-start gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3
                      className="font-bold text-base"
                      style={{ color: BRAND_NAVY }}
                    >
                      {t.name}
                    </h3>
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: catColor }}
                    >
                      {t.category.replace("-", " ")}
                    </span>
                    {t.popularity === "Very Common" && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {t.popularity}
                      </span>
                    )}
                    {t.popularity === "Common" && (
                      <span className="text-[10px] font-bold text-gray-400">
                        {t.popularity}
                      </span>
                    )}
                    {(t.popularity === "Specialized" || t.popularity === "Niche") && (
                      <span className="text-[10px] font-bold text-gray-400 italic">
                        {t.popularity}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {t.summary}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-gray-400">
                    <span>
                      <span className="font-bold text-gray-600">Learn:</span>{" "}
                      {t.learningTime}
                    </span>
                    <span>
                      <span className="font-bold text-gray-600">Cert:</span>{" "}
                      {t.certCost}
                    </span>
                    <span>
                      <span className="font-bold text-gray-600">Evidence:</span>{" "}
                      {t.evidenceLevel}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 mt-1">
                  {isFree ? (
                    isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )
                  ) : (
                    <Lock className="w-5 h-5 text-gray-300" />
                  )}
                </div>
              </button>

              {/* Locked overlay for techniques 6+ */}
              {!isFree && (
                <PurchaseGate />
              )}

              {/* Expanded details */}
              {isExpanded && isFree && (
                <div className="px-5 pb-6 pt-0 space-y-5 border-t border-gray-100">
                  {renderDetailSection("What It Is", t.whatItIs)}
                  {renderDetailSection("Philosophy", t.philosophy)}
                  {renderDetailSection("In Practice", t.inPractice)}
                  {renderDetailSection("Who It Works For", t.whoItWorksFor)}
                  {renderDetailSection("Evidence Base", t.evidence)}
                  {renderDetailSection("Learning Path", t.learningPath)}
                  {renderDetailSection("Practice Impact", t.practiceImpact)}
                  {renderDetailSection("Personality Fit", t.personalityDetail)}

                  {/* Quick stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {renderStatCard("Force Level", t.forceLevel)}
                    {renderStatCard("Patient Vol.", t.patientVolume)}
                    {renderStatCard("Visit Time", t.visitTime)}
                    {renderStatCard("Equipment", t.equipmentNeeded)}
                  </div>

                  {/* Best For & Personality */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-green-50 rounded-xl p-4">
                      <p className="text-[10px] font-bold text-green-700 uppercase tracking-wide mb-1">
                        Best For
                      </p>
                      <p className="text-sm text-green-900">{t.bestFor}</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4">
                      <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wide mb-1">
                        Personality Fit
                      </p>
                      <p className="text-sm text-blue-900">{t.personalityFit}</p>
                    </div>
                  </div>

                  {/* Pros & Cons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p
                        className="text-[10px] font-bold uppercase tracking-wide mb-2"
                        style={{ color: "#16a34a" }}
                      >
                        Pros
                      </p>
                      <ul className="space-y-1.5">
                        {t.pros.map((p, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p
                        className="text-[10px] font-bold uppercase tracking-wide mb-2"
                        style={{ color: "#dc2626" }}
                      >
                        Cons
                      </p>
                      <ul className="space-y-1.5">
                        {t.cons.map((c, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Cross-links */}
                  <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Next:</span>
                    <a href="/student/seminars" className="text-xs font-bold text-[#e97325] hover:underline">Find Seminars &rarr;</a>
                    <a href="/directory" className="text-xs font-bold text-[#e97325] hover:underline">Find Doctors Who Use This &rarr;</a>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filteredTechniques.length === 0 && (
          <p className="text-center text-gray-400 py-12">
            No techniques match your search.
          </p>
        )}
      </div>
    </div>
  );

  // ─── Tab 2: Find Your Fit (Quiz) ──────────────────────────────────────────

  const renderQuiz = () => {
    if (quiz.completed) return renderQuizResults();

    const qIdx = quiz.currentQuestion;
    const q = QUIZ_QUESTIONS[qIdx];
    const maxFree = purchased ? QUIZ_QUESTIONS.length : FREE_QUIZ_LIMIT;
    const isLocked = qIdx >= maxFree;
    const progress = ((qIdx + 1) / QUIZ_QUESTIONS.length) * 100;

    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="w-7 h-7" style={{ color: BRAND_ORANGE }} />
          <h2
            className="text-2xl font-heading font-black"
            style={{ color: BRAND_NAVY }}
          >
            Find Your Fit
          </h2>
        </div>
        <p className="text-gray-500 text-sm mb-6">
          Answer 10 questions to discover which techniques match your personality and goals.
        </p>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs font-bold mb-1.5">
            <span style={{ color: BRAND_NAVY }}>
              Question {qIdx + 1} of {QUIZ_QUESTIONS.length}
            </span>
            <span className="text-gray-400">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, backgroundColor: BRAND_ORANGE }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="relative">
          {isLocked && <PurchaseGate message="Unlock remaining questions for $19" />}
          <div className={isLocked ? "pointer-events-none select-none" : ""}>
            <h3
              className="text-lg font-bold mb-5"
              style={{ color: BRAND_NAVY }}
            >
              {q.question}
            </h3>
            <div className="space-y-3">
              {q.options.map((opt) => {
                const selected = quiz.answers[q.id] === opt.label;
                return (
                  <button
                    key={opt.label}
                    onClick={() => handleAnswer(q.id, opt.label)}
                    className="w-full text-left p-4 rounded-xl border-2 transition-all"
                    style={{
                      borderColor: selected ? BRAND_ORANGE : "#e5e7eb",
                      backgroundColor: selected ? `${BRAND_ORANGE}10` : "#fff",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{
                          backgroundColor: selected ? BRAND_ORANGE : "#f3f4f6",
                          color: selected ? "#fff" : "#6b7280",
                        }}
                      >
                        {opt.label}
                      </span>
                      <span className="text-sm" style={{ color: BRAND_NAVY }}>
                        {opt.text}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          {qIdx > 0 ? (
            <button
              onClick={() =>
                setQuiz((prev) => ({
                  ...prev,
                  currentQuestion: prev.currentQuestion - 1,
                }))
              }
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div />
          )}
          {quiz.answers[q.id] && qIdx < QUIZ_QUESTIONS.length - 1 && !isLocked && (
            <button
              onClick={() =>
                setQuiz((prev) => ({
                  ...prev,
                  currentQuestion: prev.currentQuestion + 1,
                }))
              }
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-colors"
              style={{ backgroundColor: BRAND_ORANGE }}
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderQuizResults = () => {
    const scores = computeScores();
    const top = getTopTechniques();
    const maxScore =
      Math.max(...Object.values(scores), 1);
    const radarValues = RADAR_AXES.map((a) => scores[a.key] || 0);

    const cx = 100,
      cy = 100,
      radius = 75;

    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Star className="w-7 h-7" style={{ color: BRAND_ORANGE }} />
          <h2
            className="text-2xl font-heading font-black"
            style={{ color: BRAND_NAVY }}
          >
            Your Top 3 Technique Matches
          </h2>
        </div>
        <p className="text-gray-500 text-sm mb-6">
          Based on your answers, here are the technique categories that fit you best.
        </p>

        {/* Top 3 cards */}
        <div className="space-y-3 mb-8">
          {top.map((item, rank) => {
            const catColor = CATEGORY_COLORS[item.technique.category] || BRAND_NAVY;
            return (
              <div
                key={item.technique.id}
                className="bg-white rounded-2xl border-2 p-5 flex items-start gap-4"
                style={{ borderColor: rank === 0 ? BRAND_ORANGE : "#e5e7eb" }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                  style={{
                    backgroundColor: rank === 0 ? BRAND_ORANGE : BRAND_NAVY,
                  }}
                >
                  #{rank + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold" style={{ color: BRAND_NAVY }}>
                      {item.technique.name}
                    </h3>
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: catColor }}
                    >
                      {item.technique.category.replace("-", " ")}
                    </span>
                    <span className="text-sm font-bold" style={{ color: BRAND_ORANGE }}>
                      {item.pct}% match
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {item.technique.personalityFit}
                  </p>
                  <button
                    onClick={() => {
                      setActiveTab(0);
                      setExpandedId(item.technique.id);
                      setCategoryFilter("all");
                      setSearch("");
                    }}
                    className="mt-2 text-xs font-bold flex items-center gap-1 hover:underline"
                    style={{ color: BRAND_ORANGE }}
                  >
                    View full breakdown <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pentagon radar chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
          <h3
            className="text-xs font-black uppercase tracking-wide mb-4"
            style={{ color: BRAND_NAVY }}
          >
            Your Score Profile
          </h3>
          <div className="flex justify-center">
            <svg viewBox="0 0 200 200" className="w-64 h-64">
              {/* Grid lines */}
              {[0.25, 0.5, 0.75, 1].map((pct) => (
                <polygon
                  key={pct}
                  points={RADAR_AXES.map((_, i) => {
                    const angle = (360 / 5) * i;
                    const { x, y } = polarToXY(cx, cy, radius * pct, angle);
                    return `${x},${y}`;
                  }).join(" ")}
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="0.5"
                />
              ))}
              {/* Axis lines */}
              {RADAR_AXES.map((_, i) => {
                const angle = (360 / 5) * i;
                const { x, y } = polarToXY(cx, cy, radius, angle);
                return (
                  <line
                    key={i}
                    x1={cx}
                    y1={cy}
                    x2={x}
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth="0.5"
                  />
                );
              })}
              {/* Filled polygon */}
              <polygon
                points={buildPolygonPoints(cx, cy, radarValues, maxScore, radius)}
                fill={`${BRAND_ORANGE}30`}
                stroke={BRAND_ORANGE}
                strokeWidth="2"
              />
              {/* Dots */}
              {radarValues.map((v, i) => {
                const angle = (360 / 5) * i;
                const r = maxScore > 0 ? (v / maxScore) * radius : 0;
                const { x, y } = polarToXY(cx, cy, r, angle);
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="3"
                    fill={BRAND_ORANGE}
                  />
                );
              })}
              {/* Labels */}
              {RADAR_AXES.map((axis, i) => {
                const angle = (360 / 5) * i;
                const { x, y } = polarToXY(cx, cy, radius + 16, angle);
                return (
                  <text
                    key={i}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="text-[8px] font-bold"
                    fill="#6b7280"
                  >
                    {axis.label}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Retake */}
        <div className="text-center">
          <button
            onClick={resetQuiz}
            className="px-6 py-3 rounded-xl border-2 text-sm font-bold transition-colors hover:bg-gray-50"
            style={{ borderColor: BRAND_NAVY, color: BRAND_NAVY }}
          >
            Retake Quiz
          </button>
        </div>
      </div>
    );
  };

  // ─── Tab 3: Comparison Tool ────────────────────────────────────────────────

  const renderComparison = () => {
    if (!purchased) {
      return (
        <div className="relative min-h-[400px]">
          <PurchaseGate message="Unlock the Comparison Tool for $19" />
          <div className="pointer-events-none select-none opacity-30">
            {renderComparisonContent()}
          </div>
        </div>
      );
    }
    return renderComparisonContent();
  };

  const renderComparisonContent = () => {
    const cols = comparedTechniques;

    const rows: { label: string; key: string }[] = [
      { label: "Category", key: "category" },
      { label: "Philosophy", key: "philosophy_short" },
      { label: "Force Level", key: "forceLevel" },
      { label: "Patient Volume", key: "patientVolume" },
      { label: "Visit Time", key: "visitTime" },
      { label: "Learning Time", key: "learningTime" },
      { label: "Cert Cost", key: "certCost" },
      { label: "Evidence Level", key: "evidenceLevel" },
      { label: "Equipment Needed", key: "equipmentNeeded" },
      { label: "Best For", key: "bestFor" },
      { label: "Personality Fit", key: "personalityFit" },
    ];

    const getCellValue = (t: Technique, key: string) => {
      if (key === "philosophy_short") {
        return t.philosophy.length > 120
          ? t.philosophy.slice(0, 120) + "..."
          : t.philosophy;
      }
      return (t as unknown as Record<string, unknown>)[key] as string;
    };

    return (
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Filter className="w-7 h-7" style={{ color: BRAND_ORANGE }} />
          <h2
            className="text-2xl font-heading font-black"
            style={{ color: BRAND_NAVY }}
          >
            Comparison Tool
          </h2>
        </div>
        <p className="text-gray-500 text-sm mb-6">
          Compare techniques side-by-side to see the key differences at a glance.
        </p>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {cols.map((t, idx) => (
            <select
              key={idx}
              value={t.id}
              onChange={(e) => setCompareId(idx, e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#e97325] bg-white min-w-[180px]"
              style={{ color: BRAND_NAVY }}
            >
              {TECHNIQUES.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.name}
                </option>
              ))}
            </select>
          ))}
          {!showThird ? (
            <button
              onClick={addThirdColumn}
              className="px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 text-sm font-bold text-gray-400 hover:border-[#e97325] hover:text-[#e97325] transition-colors"
            >
              + Add Third
            </button>
          ) : (
            <button
              onClick={removeThirdColumn}
              className="px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="w-4 h-4 inline mr-1" />
              Remove
            </button>
          )}
        </div>

        {/* Comparison table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: BRAND_NAVY }}>
                <th className="text-left p-4 text-white text-xs font-bold uppercase tracking-wide w-36">
                  Field
                </th>
                {cols.map((t) => (
                  <th
                    key={t.id}
                    className="text-left p-4 text-white text-xs font-bold uppercase tracking-wide"
                  >
                    {t.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rIdx) => (
                <tr
                  key={row.key}
                  className={rIdx % 2 === 0 ? "bg-gray-50" : "bg-white"}
                >
                  <td
                    className="p-4 font-bold text-xs uppercase tracking-wide"
                    style={{ color: BRAND_NAVY }}
                  >
                    {row.label}
                  </td>
                  {cols.map((t) => {
                    const val = getCellValue(t, row.key);
                    if (row.key === "category") {
                      const catColor = CATEGORY_COLORS[t.category] || BRAND_NAVY;
                      return (
                        <td key={t.id} className="p-4">
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                            style={{ backgroundColor: catColor }}
                          >
                            {t.category.replace("-", " ")}
                          </span>
                        </td>
                      );
                    }
                    return (
                      <td key={t.id} className="p-4 text-gray-700">
                        {val}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div
          className="mt-6 rounded-2xl p-6"
          style={{ backgroundColor: `${BRAND_NAVY}08` }}
        >
          <h3
            className="text-xs font-black uppercase tracking-wide mb-2"
            style={{ color: BRAND_NAVY }}
          >
            Which should I choose?
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            {generateSummary()}
          </p>
        </div>
      </div>
    );
  };

  // ─── Detail helpers ────────────────────────────────────────────────────────

  const renderDetailSection = (title: string, content: string) => (
    <div>
      <h4
        className="text-[10px] font-black uppercase tracking-widest mb-1.5"
        style={{ color: BRAND_ORANGE }}
      >
        {title}
      </h4>
      <p className="text-sm text-gray-700 leading-relaxed">{content}</p>
    </div>
  );

  const renderStatCard = (label: string, value: string) => (
    <div className="bg-gray-50 rounded-xl p-3">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p className="text-sm font-bold" style={{ color: BRAND_NAVY }}>
        {value}
      </p>
    </div>
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1
          className="text-2xl font-heading font-black flex items-center gap-3"
          style={{ color: BRAND_NAVY }}
        >
          <Compass className="w-7 h-7" style={{ color: BRAND_ORANGE }} />
          Technique Comparison Guide
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Explore, compare, and find the chiropractic techniques that fit your future practice.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-2xl overflow-hidden border border-gray-200 mb-6">
        {TAB_LABELS.map((label, i) => {
          const isActive = activeTab === i;
          return (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className="flex-1 py-3 px-2 text-xs sm:text-sm font-bold transition-all border-r last:border-r-0 border-gray-200"
              style={{
                backgroundColor: isActive ? BRAND_NAVY : "#fff",
                color: isActive ? "#fff" : "#9ca3af",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 0 && renderExplorer()}
      {activeTab === 1 && renderQuiz()}
      {activeTab === 2 && renderComparison()}
    </div>
  );
}
