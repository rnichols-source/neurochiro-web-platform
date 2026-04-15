"use client";

import { useState, useEffect } from "react";
import { GraduationCap, BookOpen, CheckCircle2, Lock, ChevronRight, Clock, Zap, ShieldCheck } from "lucide-react";
import { SEED_COURSES } from "./courses-data";
import { createCourseCheckout, createBundleCheckout, getPurchasedCourses } from "./purchase-actions";

function cn(...inputs: any[]) { return inputs.filter(Boolean).join(" "); }

export default function AcademyPage() {
  const [purchasedCourseIds, setPurchasedCourseIds] = useState<string[]>([]);
  const [loadingPurchase, setLoadingPurchase] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    getPurchasedCourses()
      .then(setPurchasedCourseIds)
      .catch(() => {});
  }, []);

  const courses = SEED_COURSES.map(c => ({
    id: c.id,
    title: c.title,
    description: c.description,
    tierRequired: c.tier_required,
    price: (c as any).price || 0,
    stripePlan: (c as any).stripe_plan || null,
    previewModule: (c as any).preview_module || null,
    isPurchased: c.tier_required === 'free' || purchasedCourseIds.includes(c.id),
    moduleCount: c.modules.length,
    completedCount: 0,
    modules: c.modules,
  }));

  const paidCourses = courses.filter(c => c.tierRequired === 'paid');
  const allPaidPurchased = paidCourses.every(c => c.isPurchased);

  const openCourse = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    setSelectedCourse(course);
    setSelectedModule(course.modules[0] || null);
  };

  const handlePurchase = async (courseId: string) => {
    setLoadingPurchase(courseId);
    try {
      const result = await createCourseCheckout(courseId);
      if (result.url) {
        window.location.href = result.url;
      } else {
        alert(result.error || 'Something went wrong');
      }
    } catch {
      alert('Something went wrong. Please try again.');
    }
    setLoadingPurchase(null);
  };

  const handleBundlePurchase = async () => {
    setLoadingPurchase('bundle');
    try {
      const result = await createBundleCheckout();
      if (result.url) {
        window.location.href = result.url;
      } else {
        alert(result.error || 'Something went wrong');
      }
    } catch {
      alert('Something went wrong. Please try again.');
    }
    setLoadingPurchase(null);
  };

  const handleCompleteModule = () => {
    if (!selectedCourse || !selectedModule) return;
    setCompleting(true);
    setTimeout(() => setCompleting(false), 500);
  };

  // Course Detail View
  if (selectedCourse) {
    const isPreviewOnly = !selectedCourse.isPurchased;

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
            {isPreviewOnly && (
              <span className="text-xs font-bold text-neuro-orange bg-neuro-orange/10 px-2 py-0.5 rounded-full">Preview Mode</span>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Module List */}
          <div className="space-y-2">
            {selectedCourse.modules.map((mod: any, i: number) => {
              const isLocked = isPreviewOnly && mod.id !== selectedCourse.previewModule && i > 0;
              return (
                <button
                  key={mod.id}
                  onClick={() => !isLocked && setSelectedModule(mod)}
                  disabled={isLocked}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl border transition-all",
                    isLocked ? "opacity-50 cursor-not-allowed bg-gray-50 border-gray-100" :
                    selectedModule?.id === mod.id ? "bg-neuro-orange/10 border-neuro-orange/30" : "bg-white border-gray-100 hover:border-gray-200",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black",
                      isLocked ? "bg-gray-100 text-gray-400" : "bg-gray-100 text-gray-500"
                    )}>
                      {isLocked ? <Lock className="w-3.5 h-3.5" /> : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("font-bold text-sm", isLocked ? "text-gray-400" : "text-neuro-navy")}>{mod.title}</p>
                      <p className="text-gray-400 text-xs truncate">{mod.description}</p>
                    </div>
                    {!isLocked && <ChevronRight className="w-4 h-4 text-gray-300" />}
                  </div>
                </button>
              );
            })}

            {/* Purchase CTA in sidebar */}
            {isPreviewOnly && (
              <div className="mt-4 bg-neuro-navy rounded-2xl p-5 text-white">
                <h4 className="font-black text-sm mb-1">Unlock Full Course</h4>
                <p className="text-gray-300 text-xs mb-4">Get access to all {selectedCourse.moduleCount} modules.</p>
                <button
                  onClick={() => handlePurchase(selectedCourse.id)}
                  disabled={loadingPurchase === selectedCourse.id}
                  className="w-full py-3 bg-neuro-orange text-white rounded-xl font-black text-sm hover:bg-neuro-orange/90 disabled:opacity-50 transition-colors"
                >
                  {loadingPurchase === selectedCourse.id ? 'Loading...' : `Unlock for $${selectedCourse.price}`}
                </button>
              </div>
            )}
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
                <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed mb-8 space-y-4">
                  {selectedModule.content.split('\n\n').map((paragraph: string, i: number) => {
                    const formatted = paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    if (paragraph.trim().startsWith('- ')) {
                      const items = paragraph.split('\n').filter((l: string) => l.trim().startsWith('- '));
                      return (
                        <ul key={i} className="list-disc pl-6 space-y-1">
                          {items.map((item: string, j: number) => (
                            <li key={j} dangerouslySetInnerHTML={{ __html: item.replace(/^- /, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                          ))}
                        </ul>
                      );
                    }
                    if (/^\d+\.\s/.test(paragraph.trim())) {
                      const items = paragraph.split('\n').filter((l: string) => /^\d+\.\s/.test(l.trim()));
                      return (
                        <ol key={i} className="list-decimal pl-6 space-y-1">
                          {items.map((item: string, j: number) => (
                            <li key={j} dangerouslySetInnerHTML={{ __html: item.replace(/^\d+\.\s/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                          ))}
                        </ol>
                      );
                    }
                    return <p key={i} dangerouslySetInnerHTML={{ __html: formatted }} />;
                  })}
                </div>
                {!isPreviewOnly && (
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
  const freeCourses = courses.filter(c => c.tierRequired === 'free');
  const premiumCourses = courses.filter(c => c.tierRequired === 'paid');

  return (
    <div className="space-y-10 pb-20">
      <header>
        <h1 className="text-3xl font-heading font-black text-neuro-navy uppercase tracking-tight flex items-center gap-3">
          <GraduationCap className="w-8 h-8 text-neuro-orange" /> Academy
        </h1>
        <p className="text-gray-500 mt-2">Build your clinical foundation with structured courses in nervous system chiropractic.</p>
      </header>

      {/* Free Courses */}
      <section>
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Free Courses</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {freeCourses.map((course) => (
            <div
              key={course.id}
              onClick={() => openCourse(course.id)}
              className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:border-gray-200 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-neuro-orange" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{course.moduleCount} modules</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-green-500 bg-green-50 px-2 py-0.5 rounded-full">Free</span>
              </div>
              <h3 className="text-lg font-black text-neuro-navy mb-1">{course.title}</h3>
              <p className="text-gray-500 text-sm line-clamp-2">{course.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bundle Offer */}
      {!allPaidPurchased && (
        <section className="bg-neuro-navy rounded-2xl p-8 text-white">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-neuro-orange" />
              <span className="text-xs font-black uppercase tracking-widest text-neuro-orange">Best Value</span>
            </div>
            <h2 className="text-2xl font-black mb-2">The School-to-Practice System</h2>
            <p className="text-gray-300 mb-4">All 4 premium courses. The complete unfair advantage for your career. Own it forever.</p>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-3xl font-black">$797</span>
              <span className="text-gray-400 line-through text-lg">$1,188</span>
              <span className="bg-neuro-orange/20 text-neuro-orange text-xs font-black px-3 py-1 rounded-full">Save $391</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-6 text-sm">
              {premiumCourses.map(c => (
                <div key={c.id} className="flex items-center gap-2 text-gray-300">
                  <CheckCircle2 className="w-4 h-4 text-neuro-orange flex-shrink-0" />
                  <span>{c.title}</span>
                </div>
              ))}
            </div>
            <button
              onClick={handleBundlePurchase}
              disabled={loadingPurchase === 'bundle'}
              className="px-8 py-4 bg-neuro-orange text-white rounded-xl font-black uppercase tracking-widest text-sm hover:bg-neuro-orange/90 disabled:opacity-50 transition-colors"
            >
              {loadingPurchase === 'bundle' ? 'Loading...' : 'Get the Full System — $797'}
            </button>
          </div>
        </section>
      )}

      {/* Premium Courses */}
      <section>
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Premium Courses</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {premiumCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-neuro-orange" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{course.moduleCount} modules</span>
                {course.isPurchased ? (
                  <span className="text-[10px] font-black uppercase tracking-widest text-green-500 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Owned
                  </span>
                ) : (
                  <span className="text-[10px] font-black uppercase tracking-widest text-neuro-orange bg-neuro-orange/10 px-2 py-0.5 rounded-full">${course.price}</span>
                )}
              </div>
              <h3 className="text-lg font-black text-neuro-navy mb-1">{course.title}</h3>
              <p className="text-gray-500 text-sm mb-4 line-clamp-2">{course.description}</p>
              {course.isPurchased ? (
                <button
                  onClick={() => openCourse(course.id)}
                  className="w-full py-3 bg-neuro-navy text-white rounded-xl font-bold text-sm hover:bg-neuro-navy/90 transition-colors"
                >
                  Continue Learning
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => openCourse(course.id)}
                    className="flex-1 py-3 border border-gray-200 text-neuro-navy rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => handlePurchase(course.id)}
                    disabled={loadingPurchase === course.id}
                    className="flex-1 py-3 bg-neuro-orange text-white rounded-xl font-bold text-sm hover:bg-neuro-orange/90 disabled:opacity-50 transition-colors"
                  >
                    {loadingPurchase === course.id ? 'Loading...' : `Unlock $${course.price}`}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
