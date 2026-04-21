"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  GraduationCap,
  BookOpen,
  CheckCircle,
  Lock,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Clock,
  Zap,
  Search,
  ArrowLeft,
  Target,
  Award,
  X,
  Menu,
} from "lucide-react";
import { SEED_COURSES } from "./courses-data";
import {
  createCourseCheckout,
  createBundleCheckout,
  getPurchasedCourses,
} from "./purchase-actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CourseProgress = {
  completed: string[];
  lastModule: string;
};

type AllProgress = Record<string, CourseProgress>;

type ViewState =
  | { kind: "catalog" }
  | { kind: "course"; courseId: string; moduleId: string };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = "neurochiro-academy-progress";

const TAGS_MAP: Record<string, string[]> = {
  "course-ns-foundations": ["Nervous System", "Foundation"],
  "course-neuroplasticity": ["Neuroplasticity", "Clinical"],
  "course-clinical-identity": ["Branding", "Career"],
  "course-business": ["Business", "Finance"],
  "course-clinical-confidence": ["Clinical", "Communication"],
  "course-associate-playbook": ["Associate", "Career"],
};

const ACTION_ITEMS: Record<string, string[]> = {
  "course-ns-foundations": [
    "Observe 3 patient interactions this week through the lens of nervous system function.",
    "Explain the vagus nerve to a friend or classmate in plain English.",
    "Find one example of autonomic dysfunction in a case study and trace it back to the spine.",
    "Review your anatomy atlas and identify every nerve root from C1 to S5.",
    "Ask your preceptor how they explain subluxation to new patients.",
  ],
  "course-neuroplasticity": [
    "Ask your preceptor to show you a progress scan comparison.",
    "Read one published paper on neuroplasticity and chiropractic this week.",
    "Identify a habit you want to change and apply the neuroplasticity framework to it.",
    "Explain Hebbian learning to a classmate using a chiropractic example.",
    "Design a 4-week care plan that leverages neuroplastic principles.",
  ],
  "course-clinical-identity": [
    "Write your 30-second elevator pitch and practice it 5 times today.",
    "Draft a one-paragraph bio for a clinic website.",
    "Identify 3 chiropractors whose brand you admire and note what they do well.",
    "Create a list of your top 5 clinical values.",
    "Record yourself explaining chiropractic to a new patient and watch it back.",
  ],
  "course-business": [
    "Ask to see the practice's P&L or fee schedule this week.",
    "Calculate the revenue impact of adding 5 new patients per week.",
    "List every overhead line item in a chiropractic practice you can think of.",
    "Interview a practice owner about their biggest financial lesson.",
    "Build a simple spreadsheet projecting your first year of collections.",
  ],
  "course-clinical-confidence": [
    "Role-play a Report of Findings with a classmate.",
    "Practice your adjustment technique on 3 different body types.",
    "Shadow a confident clinician and note how they handle patient objections.",
    "Write out your answer to 'Why should I choose you as my chiropractor?'",
    "Record a mock patient consultation and review it for confidence cues.",
  ],
  "course-associate-playbook": [
    "Calculate what 3x your expected salary would require in collections.",
    "Draft your ideal associate contract with 5 non-negotiable terms.",
    "Interview an associate doctor about what they wish they knew on day one.",
    "Create a 90-day action plan for your first associate position.",
    "List 10 questions you would ask in a practice owner interview.",
  ],
};

const COURSE_PRICES: Record<string, number> = {
  "course-clinical-identity": 29,
  "course-business": 39,
  "course-clinical-confidence": 39,
  "course-associate-playbook": 49,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cn(...inputs: (string | false | null | undefined)[]) {
  return inputs.filter(Boolean).join(" ");
}

function loadProgress(): AllProgress {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProgress(p: AllProgress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* noop */
  }
}

function parseReadTime(s: string): number {
  const m = s.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 5;
}

function totalReadTime(
  modules: { readTime: string }[]
): number {
  return modules.reduce((s, m) => s + parseReadTime(m.readTime), 0);
}

// ---------------------------------------------------------------------------
// Content Renderer
// ---------------------------------------------------------------------------

function renderContent(content: string) {
  const blocks = content.split("\n\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i].trim();
    if (!block) continue;

    // Check for story/callout (patient anecdote)
    if (
      /^I had a patient|^I had a kid|^There was a patient|^One of my patients|^A patient came in/i.test(
        block
      )
    ) {
      elements.push(
        <div
          key={i}
          className="bg-orange-50 border-l-4 border-orange-300 p-4 rounded-r-lg mb-4 italic text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: inlineBold(block),
          }}
        />
      );
      continue;
    }

    // Bullet list
    const lines = block.split("\n");
    if (lines[0].trim().startsWith("- ")) {
      const items = lines.filter((l) => l.trim().startsWith("- "));
      elements.push(
        <ul key={i} className="list-disc pl-6 space-y-1 mb-4 text-gray-700 leading-relaxed">
          {items.map((item, j) => (
            <li
              key={j}
              dangerouslySetInnerHTML={{
                __html: inlineBold(item.replace(/^-\s*/, "")),
              }}
            />
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list
    if (/^\d+\.\s/.test(lines[0].trim())) {
      const items = lines.filter((l) => /^\d+\.\s/.test(l.trim()));
      elements.push(
        <ol key={i} className="list-decimal pl-6 space-y-1 mb-4 text-gray-700 leading-relaxed">
          {items.map((item, j) => (
            <li
              key={j}
              dangerouslySetInnerHTML={{
                __html: inlineBold(item.replace(/^\d+\.\s*/, "")),
              }}
            />
          ))}
        </ol>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <p
        key={i}
        className="mb-4 text-gray-700 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: inlineBold(block) }}
      />
    );
  }

  return elements;
}

function inlineBold(text: string): string {
  return text.replace(
    /\*\*(.*?)\*\*/g,
    '<strong class="text-[#1a2744] font-bold">$1</strong>'
  );
}

function extractBoldHeaders(content: string): string[] {
  const matches = content.match(/\*\*([^*]+)\*\*/g);
  if (!matches) return [];
  return matches
    .map((m) => m.replace(/\*\*/g, "").trim())
    .filter((t) => t.length > 4 && t.length < 80)
    .slice(0, 4);
}

// ---------------------------------------------------------------------------
// Progress Ring SVG
// ---------------------------------------------------------------------------

function ProgressRing({
  pct,
  size = 48,
  stroke = 4,
}: {
  pct: number;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#e97325"
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-500"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function AcademyPage() {
  const [view, setView] = useState<ViewState>({ kind: "catalog" });
  const [progress, setProgress] = useState<AllProgress>({});
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [loadingPurchase, setLoadingPurchase] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [completionFlash, setCompletionFlash] = useState(false);
  const [showCourseComplete, setShowCourseComplete] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load data on mount
  useEffect(() => {
    setProgress(loadProgress());
    getPurchasedCourses()
      .then(setPurchasedIds)
      .catch(() => {});
  }, []);

  // Debounced save
  const debouncedSave = useCallback((p: AllProgress) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveProgress(p), 500);
  }, []);

  // Course helpers
  const courses = useMemo(() => SEED_COURSES, []);

  const isOwned = useCallback(
    (c: (typeof SEED_COURSES)[number]) =>
      c.tier_required === "free" || purchasedIds.includes(c.id),
    [purchasedIds]
  );

  const courseProgress = useCallback(
    (courseId: string) => progress[courseId] || { completed: [], lastModule: "" },
    [progress]
  );

  const totalModules = useMemo(
    () => courses.reduce((s, c) => s + c.modules.length, 0),
    [courses]
  );

  const totalCompleted = useMemo(
    () =>
      courses.reduce(
        (s, c) => s + (progress[c.id]?.completed?.length || 0),
        0
      ),
    [courses, progress]
  );

  const overallPct = totalModules > 0 ? Math.round((totalCompleted / totalModules) * 100) : 0;

  // Purchase handlers
  const handlePurchase = async (courseId: string) => {
    setLoadingPurchase(courseId);
    try {
      const result = await createCourseCheckout(courseId);
      if (result.url) {
        window.location.href = result.url;
      } else {
        alert(result.error || "Something went wrong");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    }
    setLoadingPurchase(null);
  };

  const handleBundlePurchase = async () => {
    setLoadingPurchase("bundle");
    try {
      const result = await createBundleCheckout();
      if (result.url) {
        window.location.href = result.url;
      } else {
        alert(result.error || "Something went wrong");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    }
    setLoadingPurchase(null);
  };

  // Mark module complete / incomplete
  const toggleComplete = useCallback(
    (courseId: string, moduleId: string) => {
      setProgress((prev) => {
        const cp = prev[courseId] || { completed: [], lastModule: moduleId };
        const alreadyDone = cp.completed.includes(moduleId);
        const newCompleted = alreadyDone
          ? cp.completed.filter((id) => id !== moduleId)
          : [...cp.completed, moduleId];
        const next = {
          ...prev,
          [courseId]: { completed: newCompleted, lastModule: moduleId },
        };
        debouncedSave(next);

        // Check course completion (adding, not removing)
        if (!alreadyDone) {
          const course = courses.find((c) => c.id === courseId);
          if (course && newCompleted.length === course.modules.length) {
            setShowCourseComplete(true);
            return next;
          }
          // Auto-advance
          if (course) {
            const idx = course.modules.findIndex((m) => m.id === moduleId);
            if (idx < course.modules.length - 1) {
              const nextMod = course.modules[idx + 1];
              setTimeout(() => {
                setView({ kind: "course", courseId, moduleId: nextMod.id });
              }, 1000);
            }
          }
        }

        return next;
      });
      setCompletionFlash(true);
      setTimeout(() => setCompletionFlash(false), 1000);
    },
    [courses, debouncedSave]
  );

  // Navigation
  const openCourse = useCallback(
    (courseId: string) => {
      const course = courses.find((c) => c.id === courseId);
      if (!course) return;
      const cp = progress[courseId];
      const startModule = cp?.lastModule || course.modules[0]?.id || "";
      setView({ kind: "course", courseId, moduleId: startModule });
      setSidebarOpen(false);
      setShowCourseComplete(false);
    },
    [courses, progress]
  );

  const goToCatalog = useCallback(() => {
    setView({ kind: "catalog" });
    setShowCourseComplete(false);
  }, []);

  // ---------------------------------------------------------------------------
  // CATALOG VIEW
  // ---------------------------------------------------------------------------

  function renderCatalog() {
    const freeCourses = courses.filter((c) => c.tier_required === "free");
    const paidCourses = courses.filter((c) => c.tier_required === "paid");
    const allPaidPurchased = paidCourses.every((c) => isOwned(c));

    const q = searchQuery.toLowerCase().trim();
    const filtered = q
      ? courses.filter(
          (c) =>
            c.title.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q) ||
            c.modules.some((m) => m.title.toLowerCase().includes(q))
        )
      : null;

    const displayCourses = filtered || courses;
    const displayFree = filtered
      ? displayCourses.filter((c) => c.tier_required === "free")
      : freeCourses;
    const displayPaid = filtered
      ? displayCourses.filter((c) => c.tier_required === "paid")
      : paidCourses;

    return (
      <div className="space-y-10 pb-20">
        {/* Hero */}
        <header className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <GraduationCap className="w-8 h-8 text-[#e97325]" />
              <h1 className="text-2xl font-heading font-black text-[#1a2744]">
                NeuroChiro Academy
              </h1>
            </div>
            <p className="text-gray-500">
              The education chiropractic school didn&apos;t give you.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ProgressRing pct={overallPct} size={48} stroke={4} />
            <div className="text-sm">
              <p className="font-bold text-[#1a2744]">{overallPct}%</p>
              <p className="text-gray-400">
                {totalCompleted} of {totalModules} modules
              </p>
            </div>
          </div>
        </header>

        {/* Learning Path */}
        <section className="overflow-x-auto pb-2">
          <div className="flex items-start gap-0 min-w-max px-1">
            {courses.map((course, idx) => {
              const cp = courseProgress(course.id);
              const modCount = course.modules.length;
              const doneCount = cp.completed.length;
              const isDone = doneCount === modCount;
              const inProgress = doneCount > 0 && !isDone;

              return (
                <div key={course.id} className="flex items-start">
                  {idx > 0 && (
                    <div className="flex items-center mt-4">
                      <div
                        className={cn(
                          "w-8 h-0.5",
                          courses
                            .slice(0, idx)
                            .every(
                              (c) =>
                                (progress[c.id]?.completed?.length || 0) ===
                                c.modules.length
                            )
                            ? "bg-green-400"
                            : "bg-gray-200"
                        )}
                      />
                    </div>
                  )}
                  <button
                    onClick={() => openCourse(course.id)}
                    className="flex flex-col items-center w-24 group"
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors",
                        isDone
                          ? "bg-green-500 border-green-500 text-white"
                          : inProgress
                          ? "bg-orange-100 border-[#e97325] text-[#e97325]"
                          : "bg-gray-100 border-gray-300 text-gray-400"
                      )}
                    >
                      {isDone ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1 text-center leading-tight line-clamp-2 group-hover:text-[#1a2744] transition-colors">
                      {course.title}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses, modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#e97325] focus:ring-1 focus:ring-[#e97325]/30 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Free Courses */}
        {displayFree.length > 0 && (
          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">
              Free Courses
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {displayFree.map((course) => renderCourseCard(course))}
            </div>
          </section>
        )}

        {/* Bundle Banner */}
        {!allPaidPurchased && !filtered && (
          <section className="bg-[#1a2744] rounded-2xl p-6 sm:p-8 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-[#e97325]" />
              <span className="text-xs font-black uppercase tracking-widest text-[#e97325]">
                Best Value
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mb-1">
              School-to-Practice System — All 4 Courses
            </h2>
            <p className="text-gray-300 mb-4">
              The complete unfair advantage for your career.
            </p>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-3xl font-black">$99</span>
              <span className="text-gray-400 line-through text-lg">$156</span>
              <span className="bg-[#e97325]/20 text-[#e97325] text-xs font-black px-3 py-1 rounded-full">
                Save $57
              </span>
            </div>
            <button
              onClick={handleBundlePurchase}
              disabled={loadingPurchase === "bundle"}
              className="px-8 py-3 bg-[#e97325] text-white rounded-xl font-black text-sm hover:bg-[#e97325]/90 disabled:opacity-50 transition-colors"
            >
              {loadingPurchase === "bundle"
                ? "Loading..."
                : "Unlock All — $99"}
            </button>
          </section>
        )}

        {/* Paid Courses */}
        {displayPaid.length > 0 && (
          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">
              Premium Courses
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {displayPaid.map((course) => renderCourseCard(course))}
            </div>
          </section>
        )}

        {filtered && displayCourses.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 font-bold">
              No courses match &ldquo;{searchQuery}&rdquo;
            </p>
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Course Card
  // ---------------------------------------------------------------------------

  function renderCourseCard(course: (typeof SEED_COURSES)[number]) {
    const owned = isOwned(course);
    const cp = courseProgress(course.id);
    const doneCount = cp.completed.length;
    const modCount = course.modules.length;
    const pct = modCount > 0 ? Math.round((doneCount / modCount) * 100) : 0;
    const isDone = doneCount === modCount;
    const inProg = doneCount > 0 && !isDone;
    const tags = TAGS_MAP[course.id] || [];
    const time = totalReadTime(course.modules);
    const price = COURSE_PRICES[course.id];

    let actionLabel = "Start";
    let actionStyle =
      "bg-[#1a2744] text-white hover:bg-[#1a2744]/90";
    if (!owned && price) {
      actionLabel = `Unlock $${price}`;
      actionStyle = "bg-[#e97325] text-white hover:bg-[#e97325]/90";
    } else if (isDone) {
      actionLabel = "Completed";
      actionStyle = "bg-green-500 text-white";
    } else if (inProg) {
      actionLabel = "Continue";
    }

    return (
      <div
        key={course.id}
        onClick={() => {
          if (!owned && price) return;
          openCourse(course.id);
        }}
        className={cn(
          "bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:border-gray-200 transition-all",
          owned ? "cursor-pointer" : ""
        )}
      >
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
          <span className="text-[10px] font-bold text-gray-400">
            {modCount} modules
          </span>
          <span className="text-[10px] font-bold text-gray-400">
            ~{time} min total
          </span>
        </div>

        <h3 className="text-lg font-bold text-[#1a2744] mb-1">
          {course.title}
        </h3>
        <p className="text-gray-500 text-sm line-clamp-2 mb-3">
          {course.description}
        </p>

        {/* Progress bar */}
        {owned && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 mb-1">
              <span>
                {doneCount}/{modCount} complete
              </span>
              <span>{pct}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isDone ? "bg-green-500" : "bg-[#e97325]"
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {/* Status + action */}
        <div className="flex items-center justify-between">
          {course.tier_required === "free" ? (
            <span className="text-[10px] font-black uppercase tracking-widest text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              FREE
            </span>
          ) : owned ? (
            <span className="text-[10px] font-black uppercase tracking-widest text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Owned
            </span>
          ) : (
            <span className="text-[10px] font-black uppercase tracking-widest text-[#e97325]">
              ${price}
            </span>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!owned && price) {
                handlePurchase(course.id);
                return;
              }
              openCourse(course.id);
            }}
            disabled={loadingPurchase === course.id}
            className={cn(
              "px-4 py-2 rounded-lg font-bold text-xs transition-colors disabled:opacity-50",
              actionStyle
            )}
          >
            {loadingPurchase === course.id ? "Loading..." : actionLabel}
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // COURSE VIEW
  // ---------------------------------------------------------------------------

  function renderCourseView(courseId: string, activeModuleId: string) {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return null;

    const owned = isOwned(course);
    const cp = courseProgress(courseId);
    const doneCount = cp.completed.length;
    const modCount = course.modules.length;
    const pct = modCount > 0 ? Math.round((doneCount / modCount) * 100) : 0;

    const activeIdx = course.modules.findIndex((m) => m.id === activeModuleId);
    const activeMod = activeIdx >= 0 ? course.modules[activeIdx] : course.modules[0];
    const resolvedIdx = activeIdx >= 0 ? activeIdx : 0;

    const isModuleLocked = (idx: number) =>
      !owned && idx > 0;

    const isCompleted = (moduleId: string) =>
      cp.completed.includes(moduleId);

    const prevModule =
      resolvedIdx > 0 ? course.modules[resolvedIdx - 1] : null;
    const nextModule =
      resolvedIdx < modCount - 1 ? course.modules[resolvedIdx + 1] : null;

    const currentModLocked = isModuleLocked(resolvedIdx);
    const currentModCompleted = activeMod
      ? isCompleted(activeMod.id)
      : false;

    // Next recommended course
    const courseIdx = courses.findIndex((c) => c.id === courseId);
    const nextCourse =
      courseIdx < courses.length - 1 ? courses[courseIdx + 1] : null;

    // Action item for this module
    const actionItems = ACTION_ITEMS[courseId] || [];
    const actionItem =
      actionItems[resolvedIdx % actionItems.length] ||
      "Reflect on one concept from this module and discuss it with a classmate or mentor.";

    // Key takeaways
    const takeaways = activeMod
      ? extractBoldHeaders(activeMod.content)
      : [];
    if (takeaways.length < 3) {
      takeaways.push(
        "Review this module's key concepts before moving on."
      );
    }

    // Course completion overlay
    if (showCourseComplete) {
      const time = totalReadTime(course.modules);
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-8 sm:p-12 text-center max-w-md mx-auto">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Award className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-heading font-black text-[#1a2744] mb-2">
              Course Complete!
            </h2>
            <p className="text-gray-500 text-lg mb-1">{course.title}</p>
            <p className="text-gray-400 text-sm mb-8">
              {modCount} modules &middot; ~{time} minutes of learning
            </p>
            {nextCourse && (
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                  Next recommended course
                </p>
                <p className="font-bold text-[#1a2744]">
                  {nextCourse.title}
                </p>
                <button
                  onClick={() => openCourse(nextCourse.id)}
                  className="mt-3 px-6 py-3 bg-[#e97325] text-white rounded-xl font-bold text-sm hover:bg-[#e97325]/90 transition-colors"
                >
                  Start Next Course
                </button>
              </div>
            )}
            <button
              onClick={goToCatalog}
              className="text-sm font-bold text-gray-400 hover:text-[#1a2744] transition-colors"
            >
              Back to Academy
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col lg:flex-row gap-0 lg:gap-6 pb-28 lg:pb-8">
        {/* Mobile sidebar toggle */}
        <div className="lg:hidden flex items-center justify-between mb-4">
          <button
            onClick={goToCatalog}
            className="text-sm font-bold text-[#e97325] hover:underline flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Academy
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center gap-1 text-sm font-bold text-[#1a2744] bg-gray-100 px-3 py-2 rounded-lg"
          >
            <Menu className="w-4 h-4" />
            Modules
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform",
                sidebarOpen && "rotate-180"
              )}
            />
          </button>
        </div>

        {/* Mobile dropdown sidebar */}
        {sidebarOpen && (
          <div className="lg:hidden bg-white rounded-xl border border-gray-100 shadow-lg mb-4 overflow-hidden">
            {renderSidebarContent(
              course,
              owned,
              cp,
              doneCount,
              modCount,
              pct,
              resolvedIdx,
              isModuleLocked,
              isCompleted
            )}
          </div>
        )}

        {/* Desktop sidebar */}
        <div className="hidden lg:block w-72 flex-shrink-0">
          <div className="sticky top-4 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <button
                onClick={goToCatalog}
                className="text-sm font-bold text-[#e97325] hover:underline flex items-center gap-1 mb-3"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Academy
              </button>
              <h3 className="font-bold text-[#1a2744] text-sm leading-tight">
                {course.title}
              </h3>
              <div className="mt-2">
                <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 mb-1">
                  <span>
                    {doneCount} of {modCount} complete
                  </span>
                  <span>{pct}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#e97325] rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
            {renderSidebarContent(
              course,
              owned,
              cp,
              doneCount,
              modCount,
              pct,
              resolvedIdx,
              isModuleLocked,
              isCompleted
            )}
            {/* Purchase CTA in sidebar */}
            {!owned && (
              <div className="p-4 bg-[#1a2744] text-white">
                <h4 className="font-black text-sm mb-1">
                  Unlock Full Course
                </h4>
                <p className="text-gray-300 text-xs mb-3">
                  Get access to all {modCount} modules.
                </p>
                <button
                  onClick={() => handlePurchase(courseId)}
                  disabled={loadingPurchase === courseId}
                  className="w-full py-2.5 bg-[#e97325] text-white rounded-lg font-black text-sm hover:bg-[#e97325]/90 disabled:opacity-50 transition-colors"
                >
                  {loadingPurchase === courseId
                    ? "Loading..."
                    : `Unlock for $${COURSE_PRICES[courseId] || ""}`}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 min-w-0">
          {currentModLocked && activeMod ? (
            // Locked overlay
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 sm:p-12 text-center">
              <Lock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-black text-[#1a2744] mb-2">
                Module Locked
              </h2>
              <p className="text-gray-500 mb-6">
                Unlock this course to access all modules.
              </p>
              <button
                onClick={() => handlePurchase(courseId)}
                disabled={loadingPurchase === courseId}
                className="px-8 py-3 bg-[#e97325] text-white rounded-xl font-bold text-sm hover:bg-[#e97325]/90 disabled:opacity-50 transition-colors"
              >
                {loadingPurchase === courseId
                  ? "Loading..."
                  : `Unlock for $${COURSE_PRICES[courseId] || ""}`}
              </button>
            </div>
          ) : activeMod ? (
            <div className="space-y-6">
              {/* Breadcrumb */}
              <div className="hidden lg:flex items-center gap-2 text-xs text-gray-400">
                <button
                  onClick={goToCatalog}
                  className="hover:text-[#1a2744] transition-colors"
                >
                  Academy
                </button>
                <ChevronRight className="w-3 h-3" />
                <span className="text-gray-500">{course.title}</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-[#1a2744] font-bold">
                  Module {resolvedIdx + 1}
                </span>
              </div>

              {/* Module header */}
              <div>
                <h2 className="text-2xl font-heading font-black text-[#1a2744] mb-1">
                  {activeMod.title}
                </h2>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <span>
                    Module {resolvedIdx + 1} of {modCount}
                  </span>
                  <span>&middot;</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />{" "}
                    {activeMod.readTime}
                  </span>
                </div>
              </div>

              {/* Progress dots */}
              <div className="flex items-center gap-1.5">
                {course.modules.map((m, idx) => (
                  <div
                    key={m.id}
                    className={cn(
                      "w-2.5 h-2.5 rounded-full transition-colors",
                      isCompleted(m.id)
                        ? "bg-green-400"
                        : idx === resolvedIdx
                        ? "bg-[#e97325]"
                        : "bg-gray-200"
                    )}
                  />
                ))}
              </div>

              {/* Content */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
                <div className="max-w-none">
                  {renderContent(activeMod.content)}
                </div>
              </div>

              {/* Key Takeaways */}
              <div className="bg-[#1a2744] text-white rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-[#e97325]" />
                  <h3 className="font-black text-sm uppercase tracking-widest">
                    Key Takeaways
                  </h3>
                </div>
                <ul className="space-y-2">
                  {takeaways.slice(0, 4).map((t, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-gray-300"
                    >
                      <CheckCircle className="w-4 h-4 text-[#e97325] mt-0.5 flex-shrink-0" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Put It Into Practice */}
              <div className="border-2 border-[#e97325] rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-[#e97325]" />
                  <h3 className="font-black text-sm uppercase tracking-widest text-[#1a2744]">
                    Put It Into Practice
                  </h3>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {actionItem}
                </p>
              </div>

              {/* Navigation */}
              <div className="hidden lg:flex items-center justify-between pt-4">
                <button
                  onClick={() => {
                    if (prevModule) {
                      setView({
                        kind: "course",
                        courseId,
                        moduleId: prevModule.id,
                      });
                    }
                  }}
                  disabled={!prevModule}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-400 hover:text-[#1a2744] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                <button
                  onClick={() =>
                    activeMod &&
                    toggleComplete(courseId, activeMod.id)
                  }
                  className={cn(
                    "px-8 py-3 rounded-xl font-black text-sm transition-all",
                    completionFlash
                      ? "bg-green-500 text-white scale-105"
                      : currentModCompleted
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-[#e97325] text-white hover:bg-[#e97325]/90"
                  )}
                >
                  {completionFlash
                    ? "Done!"
                    : currentModCompleted
                    ? "Completed \u2713"
                    : "Mark Complete \u2713"}
                </button>

                <button
                  onClick={() => {
                    if (nextModule && !isModuleLocked(resolvedIdx + 1)) {
                      setView({
                        kind: "course",
                        courseId,
                        moduleId: nextModule.id,
                      });
                    }
                  }}
                  disabled={
                    !nextModule || isModuleLocked(resolvedIdx + 1)
                  }
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-400 hover:text-[#1a2744] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-12 text-center">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400 font-bold">
                Select a module to start learning
              </p>
            </div>
          )}
        </div>

        {/* Mobile bottom nav */}
        {activeMod && !currentModLocked && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between z-50">
            <button
              onClick={() => {
                if (prevModule) {
                  setView({
                    kind: "course",
                    courseId,
                    moduleId: prevModule.id,
                  });
                }
              }}
              disabled={!prevModule}
              className="p-2 text-gray-400 disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() =>
                activeMod && toggleComplete(courseId, activeMod.id)
              }
              className={cn(
                "px-6 py-2.5 rounded-xl font-black text-sm transition-all",
                completionFlash
                  ? "bg-green-500 text-white scale-105"
                  : currentModCompleted
                  ? "bg-green-500 text-white"
                  : "bg-[#e97325] text-white"
              )}
            >
              {completionFlash
                ? "Done!"
                : currentModCompleted
                ? "Completed \u2713"
                : "Mark Complete \u2713"}
            </button>

            <button
              onClick={() => {
                if (nextModule && !isModuleLocked(resolvedIdx + 1)) {
                  setView({
                    kind: "course",
                    courseId,
                    moduleId: nextModule.id,
                  });
                }
              }}
              disabled={!nextModule || isModuleLocked(resolvedIdx + 1)}
              className="p-2 text-gray-400 disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Sidebar Module List (shared between mobile dropdown and desktop)
  // ---------------------------------------------------------------------------

  function renderSidebarContent(
    course: (typeof SEED_COURSES)[number],
    owned: boolean,
    cp: CourseProgress,
    _doneCount: number,
    _modCount: number,
    _pct: number,
    activeIdx: number,
    isLocked: (idx: number) => boolean,
    isDone: (moduleId: string) => boolean
  ) {
    return (
      <div className="py-1">
        {course.modules.map((mod, i) => {
          const locked = isLocked(i);
          const completed = isDone(mod.id);
          const active = i === activeIdx;

          return (
            <button
              key={mod.id}
              onClick={() => {
                if (locked) return;
                setView({
                  kind: "course",
                  courseId: course.id,
                  moduleId: mod.id,
                });
                setSidebarOpen(false);
                // Update lastModule
                setProgress((prev) => {
                  const cp2 = prev[course.id] || {
                    completed: [],
                    lastModule: mod.id,
                  };
                  const next = {
                    ...prev,
                    [course.id]: { ...cp2, lastModule: mod.id },
                  };
                  debouncedSave(next);
                  return next;
                });
              }}
              disabled={locked}
              className={cn(
                "w-full text-left px-4 py-3 flex items-center gap-3 transition-colors border-l-2",
                locked
                  ? "opacity-50 cursor-not-allowed border-transparent"
                  : active
                  ? "bg-orange-50 border-[#e97325]"
                  : "border-transparent hover:bg-gray-50"
              )}
            >
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                  completed
                    ? "bg-green-100 text-green-600"
                    : active
                    ? "bg-[#e97325] text-white"
                    : locked
                    ? "bg-gray-100 text-gray-400"
                    : "bg-gray-100 text-gray-500"
                )}
              >
                {completed ? (
                  <CheckCircle className="w-3.5 h-3.5" />
                ) : locked ? (
                  <Lock className="w-3 h-3" />
                ) : (
                  i + 1
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-xs font-bold truncate",
                    active
                      ? "text-[#1a2744]"
                      : locked
                      ? "text-gray-400"
                      : "text-gray-600"
                  )}
                >
                  {mod.title}
                </p>
                <p className="text-[10px] text-gray-400">{mod.readTime}</p>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (view.kind === "course") {
    return renderCourseView(view.courseId, view.moduleId);
  }

  return renderCatalog();
}
