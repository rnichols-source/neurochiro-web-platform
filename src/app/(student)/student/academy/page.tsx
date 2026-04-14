"use client";

import { useState } from "react";
import { GraduationCap, BookOpen, CheckCircle2, Lock, ChevronRight, Clock } from "lucide-react";
import { SEED_COURSES } from "./courses-data";

function cn(...inputs: any[]) { return inputs.filter(Boolean).join(" "); }

export default function AcademyPage() {
  const courses = SEED_COURSES.map(c => ({
    id: c.id,
    title: c.title,
    description: c.description,
    tierRequired: c.tier_required,
    isLocked: false,
    moduleCount: c.modules.length,
    completedCount: 0,
    modules: c.modules,
  }));
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [completing, setCompleting] = useState(false);

  const openCourse = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    setSelectedCourse(course || null);
    if (course) {
      setSelectedModule(course.modules[0] || null);
    } else {
      setSelectedModule(null);
    }
  };

  const handleCompleteModule = () => {
    if (!selectedCourse || !selectedModule) return;
    setCompleting(true);
    // For now, just show completion locally (progress tracking requires DB tables)
    setTimeout(() => setCompleting(false), 500);
  };

  // Course Detail View
  if (selectedCourse) {
    const completedIds = selectedCourse.progress?.completed_modules || [];

    return (
      <div className="space-y-8 pb-20">
        <button onClick={() => { setSelectedCourse(null); setSelectedModule(null); }} className="text-sm font-bold text-neuro-orange hover:underline">
          &larr; Back to Courses
        </button>

        <header>
          <h1 className="text-3xl font-heading font-black text-neuro-navy uppercase tracking-tight">{selectedCourse.title}</h1>
          <p className="text-gray-500 mt-2">{selectedCourse.description}</p>
          <div className="flex items-center gap-4 mt-3">
            <span className="text-xs font-bold text-gray-400">{selectedCourse.moduleCount} modules</span>
            <span className="text-xs font-bold text-green-500">{selectedCourse.completedCount} completed</span>
          </div>
        </header>

        {selectedCourse.completedCount >= selectedCourse.moduleCount && selectedCourse.moduleCount > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <div className="text-3xl mb-2">🎓</div>
            <h3 className="text-lg font-black text-green-700 mb-1">Course Complete!</h3>
            <p className="text-green-600 text-sm">You&apos;ve completed all {selectedCourse.moduleCount} modules in {selectedCourse.title}. Great work!</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Module List */}
          <div className="space-y-2">
            {selectedCourse.modules.map((mod: any, i: number) => {
              const isCompleted = Array.isArray(completedIds) && completedIds.includes(mod.id);
              return (
                <button
                  key={mod.id}
                  onClick={() => setSelectedModule(mod)}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl border transition-all",
                    selectedModule?.id === mod.id ? "bg-neuro-orange/10 border-neuro-orange/30" : "bg-white border-gray-100 hover:border-gray-200",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black",
                      isCompleted ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"
                    )}>
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("font-bold text-sm", isCompleted ? "text-green-600" : "text-neuro-navy")}>{mod.title}</p>
                      <p className="text-gray-400 text-xs truncate">{mod.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Module Content */}
          <div className="lg:col-span-2">
            {selectedModule ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-bold text-gray-400">{selectedModule.readTime}</span>
                </div>
                <h2 className="text-2xl font-black text-neuro-navy mb-4">{selectedModule.title}</h2>
                <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed mb-8">
                  <p>{selectedModule.content}</p>
                </div>
                {Array.isArray(completedIds) && completedIds.includes(selectedModule.id) ? (
                  <div className="flex items-center gap-2 text-green-500 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5" /> Module Completed
                  </div>
                ) : (
                  <button
                    onClick={handleCompleteModule}
                    disabled={completing}
                    className="px-8 py-4 bg-neuro-navy text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-neuro-navy/90 transition-all disabled:opacity-50"
                  >
                    {completing ? 'Saving...' : 'Mark as Complete'}
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-2xl border border-gray-100 p-12 text-center">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-400 font-bold">Select a module to start learning</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Course Listing
  return (
    <div className="space-y-8 pb-20">
      <header>
        <h1 className="text-3xl font-heading font-black text-neuro-navy uppercase tracking-tight flex items-center gap-3">
          <GraduationCap className="w-8 h-8 text-neuro-orange" /> Academy
        </h1>
        <p className="text-gray-500 mt-2">Build your clinical foundation with structured courses in nervous system chiropractic.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => {
          const progress = course.moduleCount > 0 ? Math.round((course.completedCount / course.moduleCount) * 100) : 0;

          return (
            <div
              key={course.id}
              className={cn(
                "bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm relative overflow-hidden transition-all",
                course.isLocked ? "opacity-70" : "hover:shadow-md hover:border-gray-200 cursor-pointer"
              )}
              onClick={() => !course.isLocked && openCourse(course.id)}
            >
              {course.isLocked && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                  <div className="text-center p-4">
                    <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="font-bold text-gray-500 text-sm">Coming Soon</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-neuro-orange" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  {course.moduleCount} modules
                </span>
                {course.tierRequired === 'free' && (
                  <span className="text-[10px] font-black uppercase tracking-widest text-green-500 bg-green-50 px-2 py-0.5 rounded-full">Free</span>
                )}
              </div>

              <h3 className="text-lg font-black text-neuro-navy mb-2">{course.title}</h3>
              <p className="text-gray-500 text-sm mb-6 line-clamp-2">{course.description}</p>

              {/* Progress bar */}
              <div className="mt-auto">
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-gray-400">{progress}% complete</span>
                  <span className="text-gray-400">{course.completedCount}/{course.moduleCount}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-neuro-orange rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
