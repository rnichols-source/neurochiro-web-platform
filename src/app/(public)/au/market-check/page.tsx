"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Search, ArrowRight, CheckCircle2, AlertTriangle, Loader2, Shield } from "lucide-react";
import Link from "next/link";
import { getMarketData, getLocationSuggestions } from "@/app/(public)/market-check/actions";

const AU_STATES = [
  "New South Wales", "Victoria", "Queensland", "South Australia",
  "Western Australia", "Tasmania", "Australian Capital Territory", "Northern Territory",
];

export default function AUMarketCheckPage() {
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [suggestions, setSuggestions] = useState<{ city: string; state: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    cityCount: number; stateCount: number; totalCount: number;
    cityName: string; stateName: string;
  } | null>(null);
  const [animatedCity, setAnimatedCity] = useState(0);
  const [animatedState, setAnimatedState] = useState(0);
  const debounceRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    if (city.length < 2) { setSuggestions([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const data = await getLocationSuggestions(city);
      setSuggestions(data);
      setShowSuggestions(data.length > 0);
    }, 300);
  }, [city]);

  const handleSearch = async () => {
    if (!city || !state) return;
    setLoading(true);
    setResult(null);
    const data = await getMarketData(city, state);
    setResult(data);
    setLoading(false);

    let c1 = 0, c2 = 0;
    const t1 = setInterval(() => { c1++; setAnimatedCity(c1); if (c1 >= data.cityCount) clearInterval(t1); }, 50);
    const t2 = setInterval(() => { c2++; setAnimatedState(c2); if (c2 >= data.stateCount) clearInterval(t2); }, 30);
    if (data.cityCount === 0) { clearInterval(t1); setAnimatedCity(0); }
    if (data.stateCount === 0) { clearInterval(t2); setAnimatedState(0); }
  };

  const selectSuggestion = (s: { city: string; state: string }) => {
    setCity(s.city);
    setState(s.state);
    setShowSuggestions(false);
  };

  return (
    <div className="min-h-dvh bg-[#0F1A24] flex flex-col">
      <div className="px-6 pt-12 pb-8 text-center">
        <div className="flex items-center gap-2 justify-center mb-4">
          <MapPin className="w-5 h-5 text-[#D66829]" />
          <span className="text-xs font-black uppercase tracking-[0.3em] text-[#D66829]">Market Check Australia</span>
        </div>
        <h1 className="text-3xl font-black text-white mb-3">Is Your City Covered?</h1>
        <p className="text-gray-400 text-sm max-w-xs mx-auto">
          See how many nervous system chiropractors are listed in your area — and whether there&apos;s room for you.
        </p>
      </div>

      <div className="px-6 pb-6">
        <div className="max-w-sm mx-auto space-y-3">
          <div className="relative">
            <input type="text" value={city} onChange={e => setCity(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Your city (e.g. Melbourne)"
              className="w-full px-4 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#D66829] text-sm" />
            <AnimatePresence>
              {showSuggestions && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-[#1a2e40] border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl">
                  {suggestions.map((s, i) => (
                    <button key={i} onClick={() => selectSuggestion(s)}
                      className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2 border-b border-white/5 last:border-0">
                      <MapPin className="w-3 h-3 text-[#D66829] shrink-0" /> {s.city}, {s.state}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <select value={state} onChange={e => setState(e.target.value)}
            className="w-full px-4 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white focus:outline-none focus:border-[#D66829] text-sm appearance-none">
            <option value="" className="bg-[#0F1A24]">Select state / territory</option>
            {AU_STATES.map(s => <option key={s} value={s} className="bg-[#0F1A24]">{s}</option>)}
          </select>

          <button onClick={handleSearch} disabled={!city || !state || loading}
            className="w-full py-4 bg-[#D66829] text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-[#D66829]/90 transition-colors disabled:opacity-30">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            {loading ? "Checking..." : "Check My Market"}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-6 pb-8 flex-1">
            <div className="max-w-sm mx-auto space-y-4">
              <div className={`rounded-2xl p-6 text-center border-2 ${
                result.cityCount === 0 ? 'bg-green-500/10 border-green-500/30' :
                result.cityCount <= 3 ? 'bg-[#D66829]/10 border-[#D66829]/30' : 'bg-white/5 border-white/10'
              }`}>
                {result.cityCount === 0 ? (
                  <>
                    <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
                    <p className="text-2xl font-black text-green-400 mb-1">You&apos;d Be the FIRST</p>
                    <p className="text-sm text-green-300/70">No nervous system chiropractors are listed in {result.cityName} yet.</p>
                  </>
                ) : (
                  <>
                    <p className="text-5xl font-black text-white mb-1">{animatedCity}</p>
                    <p className="text-sm text-gray-400">NS chiropractors in <span className="text-white font-bold">{result.cityName}</span></p>
                    {result.cityCount <= 3 && (
                      <div className="flex items-center gap-1.5 justify-center mt-3">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#D66829]" />
                        <p className="text-xs text-[#D66829] font-bold">Limited coverage — claim your spot</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
                <p className="text-3xl font-black text-white mb-1">{animatedState}</p>
                <p className="text-sm text-gray-400">in <span className="text-white font-bold">{result.stateName}</span></p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
                <p className="text-3xl font-black text-[#D66829] mb-1">{result.totalCount}+</p>
                <p className="text-sm text-gray-400">verified doctors globally</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-[#D66829] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-white mb-1">
                      {result.cityCount === 0 ? `${result.cityName} is wide open.` :
                       result.cityCount <= 3 ? `Only ${result.cityCount} in ${result.cityName}.` :
                       `${result.cityCount} doctors in ${result.cityName}.`}
                    </p>
                    <p className="text-xs text-gray-400">
                      {result.cityCount === 0 ? "Be the first nervous system chiropractor patients find when they search your city." :
                       result.cityCount <= 3 ? "There's room for you. Get listed before someone else does." :
                       "Stand out with a verified profile, patient reviews, and a complete bio."}
                    </p>
                  </div>
                </div>
              </div>

              <Link href={`/register?role=doctor&region=AU&city=${encodeURIComponent(result.cityName)}&state=${encodeURIComponent(result.stateName)}`}
                className="w-full py-4 bg-[#D66829] text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-[#D66829]/90 transition-colors shadow-lg shadow-[#D66829]/20">
                Claim Your Spot — Free <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="text-[10px] text-gray-600 text-center">Free to join. No credit card required.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!result && (
        <div className="mt-auto px-6 pb-8 text-center">
          <p className="text-gray-600 text-xs">Powered by</p>
          <p className="text-white font-bold text-sm">NEURO<span className="text-[#D66829]">CHIRO</span></p>
        </div>
      )}
    </div>
  );
}
