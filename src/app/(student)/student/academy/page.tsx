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
  ArrowRight,
  Target,
  Award,
  X,
  Menu,
} from "lucide-react";
import Link from "next/link";
import { SEED_COURSES } from "./courses-data";
import { createClient } from "@/lib/supabase";

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


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cn(...inputs: (string | false | null | undefined)[]) {
  return inputs.filter(Boolean).join(" ");
}

async function loadProgressFromSupabase(): Promise<AllProgress> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return {};
    const { data } = await supabase
      .from("course_progress")
      .select("course_id, completed_modules")
      .eq("user_id", user.id);
    if (!data) return {};
    const result: AllProgress = {};
    for (const row of data) {
      const mods = Array.isArray(row.completed_modules) ? row.completed_modules as string[] : [];
      result[row.course_id] = {
        completed: mods,
        lastModule: mods.slice(-1)[0] || "",
      };
    }
    return result;
  } catch {
    return {};
  }
}

async function saveProgressToSupabase(courseId: string, completed: string[]) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("course_progress")
      .upsert({
        user_id: user.id,
        course_id: courseId,
        completed_modules: completed,
        started_at: new Date().toISOString(),
        ...(completed.length > 0 ? {} : {}),
      }, { onConflict: "user_id,course_id" });
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
          className="bg-[#162231] border-l-2 border-[#D66829]/40 p-4 rounded-r-lg mb-4 italic text-white/50 leading-relaxed"
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
        <ul key={i} className="list-disc pl-6 space-y-1 mb-4 text-white/50 leading-relaxed">
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
        <ol key={i} className="list-decimal pl-6 space-y-1 mb-4 text-white/50 leading-relaxed">
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
        className="mb-4 text-white/50 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: inlineBold(block) }}
      />
    );
  }

  return elements;
}

function inlineBold(text: string): string {
  return text.replace(
    /\*\*(.*?)\*\*/g,
    '<strong class="text-white font-bold">$1</strong>'
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
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#D66829"
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
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [completionFlash, setCompletionFlash] = useState(false);
  const [showCourseComplete, setShowCourseComplete] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load data from Supabase on mount
  useEffect(() => {
    loadProgressFromSupabase().then(setProgress);
  }, []);

  // Debounced save to Supabase
  const debouncedSave = useCallback((p: AllProgress, courseId: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const cp = p[courseId];
      if (cp) saveProgressToSupabase(courseId, cp.completed);
    }, 500);
  }, []);

  // Course helpers — all courses are included with subscription
  const courses = useMemo(() => SEED_COURSES, []);

  const isOwned = useCallback(
    () => true,
    []
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
        debouncedSave(next, courseId);

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
    const q = searchQuery.toLowerCase().trim();
    const displayCourses = q
      ? courses.filter(
          (c) =>
            c.title.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q) ||
            c.modules.some((m) => m.title.toLowerCase().includes(q))
        )
      : courses;

    return (
      <div className="space-y-10 pb-20">
        {/* Hero */}
        <header className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <GraduationCap className="w-8 h-8 text-[#D66829]" />
              <h1 className="text-2xl font-heading font-bold text-white">
                NeuroChiro Academy
              </h1>
            </div>
            <p className="text-white/40">
              The education chiropractic school didn&apos;t give you. All 6 courses are included with your membership — tap any course to start.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ProgressRing pct={overallPct} size={48} stroke={4} />
            <div className="text-sm">
              <p className="font-bold text-white">{overallPct}%</p>
              <p className="text-white/35">
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
                            : "bg-white/[0.08]"
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
                          ? "bg-[#D66829]/20 border-[#D66829] text-[#D66829]"
                          : "bg-white/[0.06] border-white/[0.08] text-white/30"
                      )}
                    >
                      {isDone ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span className="text-[10px] text-white/35 mt-1 text-center leading-tight line-clamp-2 group-hover:text-white transition-colors">
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input
            type="text"
            placeholder="Search courses, modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/20 focus:border-[#D66829]/40 outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-white/20 hover:text-white/40" />
            </button>
          )}
        </div>

        {/* All Courses */}
        {displayCourses.length > 0 && (
          <section>
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#D66829] mb-4">
              Your Courses
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {displayCourses.map((course) => renderCourseCard(course))}
            </div>
          </section>
        )}

        {q && displayCourses.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-white/30 font-bold">
              No courses match &ldquo;{searchQuery}&rdquo;
            </p>
          </div>
        )}

        {/* Pipeline CTA */}
        <div className="bg-[#162231] rounded-2xl border border-white/[0.08] p-5 flex items-center justify-between mt-8">
          <div>
            <p className="text-[13px] font-semibold text-white">Finished a course?</p>
            <p className="text-xs text-white/30">Explore techniques that match what you learned.</p>
          </div>
          <Link
            href="/student/techniques"
            className="px-5 py-2.5 bg-white/[0.06] text-white/60 rounded-lg hover:text-white hover:bg-white/[0.1] text-xs font-bold transition-colors flex items-center gap-2"
          >
            Explore Techniques <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Course Card
  // ---------------------------------------------------------------------------

  function renderCourseCard(course: (typeof SEED_COURSES)[number]) {
    const cp = courseProgress(course.id);
    const doneCount = cp.completed.length;
    const modCount = course.modules.length;
    const pct = modCount > 0 ? Math.round((doneCount / modCount) * 100) : 0;
    const isDone = doneCount === modCount;
    const inProg = doneCount > 0 && !isDone;
    const tags = TAGS_MAP[course.id] || [];
    const time = totalReadTime(course.modules);

    let actionLabel = "Start";
    let actionStyle =
      "bg-[#D66829] text-white hover:bg-[#e8834a] shadow-lg shadow-[#D66829]/20";
    if (isDone) {
      actionLabel = "Completed";
      actionStyle = "bg-green-500 text-white";
    } else if (inProg) {
      actionLabel = "Continue";
    }

    return (
      <div
        key={course.id}
        onClick={() => openCourse(course.id)}
        className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] p-6 shadow-lg shadow-black/20 hover:border-[#D66829]/20 transition-all cursor-pointer"
      >
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-medium uppercase tracking-wider text-white/50 bg-white/[0.06] px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
          <span className="text-[10px] font-bold text-white/30">
            {modCount} modules
          </span>
          <span className="text-[10px] font-bold text-white/30">
            ~{time} min total
          </span>
        </div>

        <h3 className="text-lg font-bold text-white mb-1">
          {course.title}
        </h3>
        <p className="text-white/40 text-sm line-clamp-2 mb-3">
          {course.description}
        </p>

        {/* Progress bar */}
        <div className="mb-3">
            <div className="flex items-center justify-between text-[10px] font-bold text-white/30 mb-1">
              <span>
                {doneCount}/{modCount} complete
              </span>
              <span>{pct}%</span>
            </div>
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isDone ? "bg-green-500" : "bg-gradient-to-r from-[#D66829] to-[#e8834a]"
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

        {/* Status + action */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#D66829] bg-[#D66829]/15 px-2 py-0.5 rounded-full flex items-center gap-1">
            {isDone ? <><CheckCircle className="w-3 h-3" /> Complete</> : "Included"}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              openCourse(course.id);
            }}
            className={cn(
              "px-4 py-2 rounded-lg font-bold text-xs transition-colors",
              actionStyle
            )}
          >
            {actionLabel}
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

    const cp = courseProgress(courseId);
    const doneCount = cp.completed.length;
    const modCount = course.modules.length;
    const pct = modCount > 0 ? Math.round((doneCount / modCount) * 100) : 0;

    const activeIdx = course.modules.findIndex((m) => m.id === activeModuleId);
    const activeMod = activeIdx >= 0 ? course.modules[activeIdx] : course.modules[0];
    const resolvedIdx = activeIdx >= 0 ? activeIdx : 0;

    const isModuleLocked = (_idx: number) => false;

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
          <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 p-8 sm:p-12 text-center max-w-md mx-auto">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Award className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-white mb-2">
              Course Complete!
            </h2>
            <p className="text-white/40 text-lg mb-1">{course.title}</p>
            <p className="text-white/30 text-sm mb-8">
              {modCount} modules &middot; ~{time} minutes of learning
            </p>
            {nextCourse && (
              <div className="mb-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#D66829] mb-2">
                  Next recommended course
                </p>
                <p className="font-bold text-white">
                  {nextCourse.title}
                </p>
                <button
                  onClick={() => openCourse(nextCourse.id)}
                  className="mt-3 px-6 py-3 bg-[#D66829] text-white rounded-lg font-bold text-sm hover:bg-[#e8834a] shadow-lg shadow-[#D66829]/20 transition-colors"
                >
                  Start Next Course
                </button>
              </div>
            )}
            <button
              onClick={goToCatalog}
              className="text-sm font-bold text-white/30 hover:text-white transition-colors"
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
            className="flex items-center gap-1 text-sm font-bold text-white bg-white/[0.06] px-3 py-2 rounded-lg"
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
          <div className="lg:hidden bg-[#162231] rounded-xl border border-white/[0.08] shadow-lg shadow-black/20 mb-4 overflow-hidden">
            {renderSidebarContent(
              course,
              true,
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
          <div className="sticky top-4 bg-[#162231] rounded-xl border border-white/[0.08] shadow-lg shadow-black/20 overflow-hidden">
            <div className="p-4 border-b border-white/[0.08]">
              <button
                onClick={goToCatalog}
                className="text-sm font-bold text-[#D66829] hover:underline flex items-center gap-1 mb-3"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Academy
              </button>
              <h3 className="font-bold text-white text-sm leading-tight">
                {course.title}
              </h3>
              <div className="mt-2">
                <div className="flex items-center justify-between text-[10px] font-bold text-white/30 mb-1">
                  <span>
                    {doneCount} of {modCount} complete
                  </span>
                  <span>{pct}%</span>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#D66829] to-[#e8834a] rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
            {renderSidebarContent(
              course,
              true,
              cp,
              doneCount,
              modCount,
              pct,
              resolvedIdx,
              isModuleLocked,
              isCompleted
            )}
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 min-w-0">
          {activeMod ? (
            <div className="space-y-6">
              {/* Breadcrumb */}
              <div className="hidden lg:flex items-center gap-2 text-xs text-white/30">
                <button
                  onClick={goToCatalog}
                  className="hover:text-white transition-colors"
                >
                  Academy
                </button>
                <ChevronRight className="w-3 h-3" />
                <span className="text-white/40">{course.title}</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-white font-bold">
                  Module {resolvedIdx + 1}
                </span>
              </div>

              {/* Module header */}
              <div>
                <h2 className="text-2xl font-heading font-bold text-white mb-1">
                  {activeMod.title}
                </h2>
                <div className="flex items-center gap-3 text-sm text-white/35">
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
                        ? "bg-[#D66829]"
                        : "bg-white/[0.08]"
                    )}
                  />
                ))}
              </div>

              {/* Content */}
              <div className="bg-gradient-to-b from-[#1a2e40] to-[#162231] rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 p-6 sm:p-8">
                <div className="max-w-none">
                  {renderContent(activeMod.content)}
                </div>
              </div>

              {/* Key Takeaways */}
              <div className="bg-[#162231] border border-white/[0.08] text-white rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-[#D66829]" />
                  <h3 className="font-black text-sm uppercase tracking-widest">
                    Key Takeaways
                  </h3>
                </div>
                <ul className="space-y-2">
                  {takeaways.slice(0, 4).map((t, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-white/50"
                    >
                      <CheckCircle className="w-4 h-4 text-[#D66829] mt-0.5 flex-shrink-0" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Put It Into Practice */}
              <div className="border border-[#D66829]/30 bg-[#162231] rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-[#D66829]" />
                  <h3 className="font-bold text-sm uppercase tracking-widest text-white">
                    Put It Into Practice
                  </h3>
                </div>
                <p className="text-white/50 text-sm leading-relaxed">
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
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white/30 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                <button
                  onClick={() =>
                    activeMod &&
                    toggleComplete(courseId, activeMod.id)
                  }
                  className={cn(
                    "px-8 py-3 rounded-xl font-bold text-sm transition-all",
                    completionFlash
                      ? "bg-green-500 text-white scale-105"
                      : currentModCompleted
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-[#D66829] text-white hover:bg-[#e8834a] shadow-lg shadow-[#D66829]/20"
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
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white/30 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#162231] rounded-2xl border border-white/[0.08] p-12 text-center">
              <BookOpen className="w-12 h-12 text-white/10 mx-auto mb-4" />
              <p className="text-white/30 font-bold">
                Select a module to start learning
              </p>
            </div>
          )}
        </div>

        {/* Mobile bottom nav */}
        {activeMod && !currentModLocked && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#162231] border-t border-white/[0.08] px-4 py-3 flex items-center justify-between z-50">
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
              className="p-2 text-white/30 disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() =>
                activeMod && toggleComplete(courseId, activeMod.id)
              }
              className={cn(
                "px-6 py-2.5 rounded-xl font-bold text-sm transition-all",
                completionFlash
                  ? "bg-green-500 text-white scale-105"
                  : currentModCompleted
                  ? "bg-green-500 text-white"
                  : "bg-[#D66829] text-white"
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
              className="p-2 text-white/30 disabled:opacity-30"
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
                  debouncedSave(next, course.id);
                  return next;
                });
              }}
              disabled={locked}
              className={cn(
                "w-full text-left px-4 py-3 flex items-center gap-3 transition-colors border-l-2",
                locked
                  ? "opacity-50 cursor-not-allowed border-transparent"
                  : active
                  ? "bg-[#D66829]/10 border-[#D66829]"
                  : "border-transparent hover:bg-white/[0.04]"
              )}
            >
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                  completed
                    ? "bg-green-500/10 text-green-400"
                    : active
                    ? "bg-[#D66829] text-white"
                    : locked
                    ? "bg-white/[0.04] text-white/20"
                    : "bg-white/[0.06] text-white/40"
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
                      ? "text-white"
                      : locked
                      ? "text-white/20"
                      : "text-white/50"
                  )}
                >
                  {mod.title}
                </p>
                <p className="text-[10px] text-white/30">{mod.readTime}</p>
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
