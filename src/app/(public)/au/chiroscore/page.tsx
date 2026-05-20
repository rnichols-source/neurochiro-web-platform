"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ArrowRight, Zap, GraduationCap, Briefcase, Stethoscope, Target } from "lucide-react";
import Link from "next/link";
import { computeChiroScoreLite, type ChiroScoreLiteInput, type ChiroScoreLiteResult } from "@/lib/chiroscore-lite";

const SCHOOLS = [
  "RMIT University", "Macquarie University", "Murdoch University",
  "Central Queensland University", "NZCC (New Zealand)",
  "Palmer College", "Life University", "Life West",
  "Other Australian", "Other International",
];

const TECHNIQUES = [
  "Diversified", "Gonstead", "Thompson Drop", "Network Spinal",
  "Torque Release", "NUCCA", "Atlas Orthogonal", "Activator Methods",
  "Cox Flexion-Distraction", "Toggle Recoil / HIO", "Chiropractic Biophysics",
  "Active Release", "Graston / IASTM", "Bio-Geometric Integration",
  "Blair Upper Cervical", "SOT", "ArthroStim", "Impulse Adjusting",
];

const GRAD_YEARS = ["Graduated", "2026", "2027", "2028", "2029+"];
const EXTERNSHIPS = ["0", "1", "2", "3+"];
const GOALS = [
  { id: "associate", label: "Associate Doctor", icon: Stethoscope },
  { id: "own_practice", label: "Own My Practice", icon: Briefcase },
  { id: "research", label: "Research / Academic", icon: GraduationCap },
  { id: "undecided", label: "Still Deciding", icon: Target },
];

function RadarChart({ categories }: { categories: { label: string; score: number }[] }) {
  const size = 200;
  const cx = size / 2, cy = size / 2, r = 80;
  const n = categories.length;
  const angleStep = (2 * Math.PI) / n;
  const getPoint = (i: number, scale: number) => ({
    x: cx + r * scale * Math.sin(i * angleStep),
    y: cy - r * scale * Math.cos(i * angleStep),
  });
  const gridLevels = [0.33, 0.66, 1];
  const dataPoints = categories.map((c, i) => getPoint(i, c.score / 100));

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-48 h-48 mx-auto">
      {gridLevels.map((level) => (
        <polygon key={level} points={Array.from({ length: n }, (_, i) => { const p = getPoint(i, level); return `${p.x},${p.y}`; }).join(' ')} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      ))}
      {categories.map((_, i) => { const p = getPoint(i, 1); return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />; })}
      <polygon points={dataPoints.map(p => `${p.x},${p.y}`).join(' ')} fill="rgba(214,104,41,0.25)" stroke="#D66829" strokeWidth="2" />
      {dataPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4" fill="#D66829" />)}
      {categories.map((c, i) => { const p = getPoint(i, 1.25); return <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.6)" fontSize="8" fontWeight="700">{c.label}</text>; })}
    </svg>
  );
}

export default function AUChiroScorePage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<ChiroScoreLiteInput>>({ techniques: [] });
  const [result, setResult] = useState<ChiroScoreLiteResult | null>(null);
  const [animatedScore, setAnimatedScore] = useState(0);

  const totalSteps = 5;
  const progress = step < totalSteps ? ((step + 1) / totalSteps) * 100 : 100;

  const canProceed = (() => {
    switch (step) {
      case 0: return !!answers.school;
      case 1: return !!answers.graduationYear;
      case 2: return (answers.techniques?.length || 0) > 0;
      case 3: return !!answers.externships;
      case 4: return !!answers.careerGoal;
      default: return false;
    }
  })();

  const handleNext = () => {
    if (step < 4) { setStep(step + 1); } else {
      const r = computeChiroScoreLite(answers as ChiroScoreLiteInput);
      setResult(r);
      setStep(5);
    }
  };

  useEffect(() => {
    if (result && step === 5) {
      let current = 0;
      const target = result.totalScore;
      const interval = setInterval(() => { current += 1; setAnimatedScore(current); if (current >= target) clearInterval(interval); }, 20);
      return () => clearInterval(interval);
    }
  }, [result, step]);

  const toggleTechnique = (t: string) => {
    const current = answers.techniques || [];
    setAnswers({ ...answers, techniques: current.includes(t) ? current.filter(x => x !== t) : [...current, t] });
  };

  return (
    <div className="min-h-dvh bg-[#0F1A24] flex flex-col">
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center gap-2 justify-center mb-4">
          <Zap className="w-5 h-5 text-[#D66829]" />
          <span className="text-xs font-black uppercase tracking-[0.3em] text-[#D66829]">ChiroScore Australia</span>
        </div>
        {step < 5 && (
          <>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-2">
              <motion.div className="h-full bg-[#D66829] rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
            </div>
            <p className="text-center text-xs text-gray-500">{step + 1} of {totalSteps}</p>
          </>
        )}
      </div>

      <div className="flex-1 px-6 pb-8 flex flex-col">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="school" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1">
              <h2 className="text-2xl font-black text-white mb-6 text-center">Where did you study?</h2>
              <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
                {SCHOOLS.map(s => (
                  <button key={s} onClick={() => setAnswers({ ...answers, school: s })}
                    className={`py-3 px-3 rounded-xl text-xs font-bold transition-all border-2 ${answers.school === s ? 'bg-[#D66829]/10 border-[#D66829] text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="year" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col items-center justify-center">
              <h2 className="text-2xl font-black text-white mb-8 text-center">When do you graduate?</h2>
              <div className="flex flex-col gap-3 w-full max-w-xs">
                {GRAD_YEARS.map(y => (
                  <button key={y} onClick={() => setAnswers({ ...answers, graduationYear: y.toLowerCase() })}
                    className={`py-4 rounded-xl text-sm font-bold transition-all border-2 ${answers.graduationYear === y.toLowerCase() ? 'bg-[#D66829]/10 border-[#D66829] text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'}`}>
                    {y}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="tech" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1">
              <h2 className="text-2xl font-black text-white mb-2 text-center">What techniques do you know?</h2>
              <p className="text-gray-500 text-xs text-center mb-6">Select all that apply</p>
              <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
                {TECHNIQUES.map(t => (
                  <button key={t} onClick={() => toggleTechnique(t)}
                    className={`py-3 px-3 rounded-xl text-xs font-bold transition-all border-2 ${answers.techniques?.includes(t) ? 'bg-[#D66829]/10 border-[#D66829] text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="ext" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col items-center justify-center">
              <h2 className="text-2xl font-black text-white mb-8 text-center">How many placements have you done?</h2>
              <div className="flex gap-3">
                {EXTERNSHIPS.map(e => (
                  <button key={e} onClick={() => setAnswers({ ...answers, externships: e })}
                    className={`w-16 h-16 rounded-2xl text-lg font-black transition-all border-2 ${answers.externships === e ? 'bg-[#D66829]/10 border-[#D66829] text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'}`}>
                    {e}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="goal" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col items-center justify-center">
              <h2 className="text-2xl font-black text-white mb-8 text-center">What&apos;s your career goal?</h2>
              <div className="flex flex-col gap-3 w-full max-w-xs">
                {GOALS.map(g => (
                  <button key={g.id} onClick={() => setAnswers({ ...answers, careerGoal: g.id })}
                    className={`flex items-center gap-3 py-4 px-5 rounded-xl text-sm font-bold transition-all border-2 ${answers.careerGoal === g.id ? 'bg-[#D66829]/10 border-[#D66829] text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'}`}>
                    <g.icon className="w-5 h-5 shrink-0" />
                    {g.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 5 && result && (
            <motion.div key="results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center">
              <h2 className="text-lg font-black text-white mb-6">Your ChiroScore</h2>
              <div className="relative w-36 h-36 mb-6">
                <svg viewBox="0 0 120 120" className="w-full h-full">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#D66829" strokeWidth="8"
                    strokeDasharray={`${(animatedScore / 100) * 327} 327`}
                    strokeLinecap="round" transform="rotate(-90 60 60)" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-white">{animatedScore}</span>
                  <span className="text-xs font-bold text-[#D66829]">{result.grade}</span>
                </div>
              </div>
              <RadarChart categories={result.categories} />
              <div className="w-full max-w-xs space-y-3 mt-6 mb-6">
                {result.categories.map((c, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400 font-bold">{c.label}</span>
                      <span className="text-white font-bold">{c.score}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div className="h-full bg-[#D66829] rounded-full" initial={{ width: 0 }} animate={{ width: `${c.score}%` }}
                        transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 w-full max-w-xs mb-6">
                <p className="text-xs text-[#D66829] font-bold mb-1">Top Recommendation</p>
                <p className="text-sm text-gray-300">{result.topRecommendation}</p>
              </div>
              <Link href={`/register?role=student&region=AU&chiroscore=${result.totalScore}`}
                className="w-full max-w-xs py-4 bg-[#D66829] text-white font-bold rounded-xl text-center flex items-center justify-center gap-2 hover:bg-[#D66829]/90 transition-colors shadow-lg shadow-[#D66829]/20">
                Join Free — Save Your Score <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-[10px] text-gray-600 mt-3 text-center">Free to join. No credit card required.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {step < 5 && (
          <div className="mt-auto pt-6">
            <button onClick={handleNext} disabled={!canProceed}
              className="w-full py-4 bg-[#D66829] text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-[#D66829]/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              {step === 4 ? 'See My Score' : 'Next'} <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
