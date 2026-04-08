"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, Brain, Activity, Heart, Zap } from "lucide-react";
import Link from "next/link";

const systems = [
  {
    icon: Brain,
    title: "The Brain",
    subtitle: "The CEO of your body",
    color: "bg-blue-50 text-blue-600 border-blue-100",
    description: "Your brain controls every decision, emotion, and sensation. It processes millions of signals per second to keep you alive and functioning.",
    controls: ["Decision Making", "Emotional Balance", "Sensory Processing"],
    whenCompromised: "Brain fog, chronic anxiety, difficulty focusing, and poor concentration.",
    howChiroHelps: "Chiropractic care supports the brain by improving the quality of sensory input it receives from the body through proper spinal alignment."
  },
  {
    icon: Activity,
    title: "Spinal Cord",
    subtitle: "The communication highway",
    color: "bg-orange-50 text-orange-600 border-orange-100",
    description: "The spinal cord carries every message between your brain and body. When the highway is clear, your body functions at its best.",
    controls: ["Brain-Body Communication", "Reflexes", "Motor Signals"],
    whenCompromised: "Physical tension, persistent discomfort, and feeling 'disconnected' from your body.",
    howChiroHelps: "Spinal adjustments help ensure the neural highway remains clear of mechanical interference, restoring communication."
  },
  {
    icon: Heart,
    title: "Vagus Nerve",
    subtitle: "Your body's brake pedal",
    color: "bg-purple-50 text-purple-600 border-purple-100",
    description: "The longest cranial nerve in your body, the Vagus nerve controls your ability to rest, digest, and recover from stress.",
    controls: ["Heart Rate", "Digestion", "Inflammation Control"],
    whenCompromised: "Digestive issues, inability to relax, poor sleep quality, and chronic inflammation.",
    howChiroHelps: "Gentle adjustments can support Vagus nerve tone, helping your body shift into rest-and-digest mode naturally."
  },
  {
    icon: Zap,
    title: "Autonomic System",
    subtitle: "The balance between action and rest",
    color: "bg-green-50 text-green-600 border-green-100",
    description: "Your autonomic system balances your 'fight or flight' and 'rest and digest' responses. When balanced, you can handle stress without burning out.",
    controls: ["Sympathetic (Action)", "Parasympathetic (Rest)", "Stress Response"],
    whenCompromised: "Feeling tired but wired, burnout, hormonal imbalances, and poor stress tolerance.",
    howChiroHelps: "Chiropractic care aims to balance the gas and brake pedals, allowing your body to adapt to stress more effectively."
  },
];

export default function NervousSystemPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  return (
    <div className="min-h-dvh bg-neuro-cream pb-20">
      {/* Header */}
      <section className="bg-neuro-navy text-white pt-40 md:pt-48 pb-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight mb-4">
            Your <span className="text-neuro-orange">Nervous System</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Understanding the system that controls everything in your body.
          </p>
        </div>
      </section>

      {/* System Cards */}
      <section className="max-w-3xl mx-auto px-6 py-12 space-y-6">
        {systems.map((system) => (
          <div key={system.title} className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${system.color}`}>
                <system.icon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-heading font-black text-neuro-navy">{system.title}</h2>
                <p className="text-sm text-gray-400">{system.subtitle}</p>
              </div>
            </div>

            <p className="text-gray-600 mb-4">{system.description}</p>

            <div className="flex flex-wrap gap-2 mb-4">
              {system.controls.map((c) => (
                <span key={c} className="px-3 py-1 bg-gray-50 text-gray-600 text-xs font-bold rounded-lg border border-gray-100">{c}</span>
              ))}
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <p className="font-bold text-red-500 text-xs uppercase tracking-wide mb-1">When Compromised</p>
                <p className="text-gray-500">{system.whenCompromised}</p>
              </div>
              <div>
                <p className="font-bold text-green-600 text-xs uppercase tracking-wide mb-1">How Chiropractic Helps</p>
                <p className="text-gray-500">{system.howChiroHelps}</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Find a Doctor CTA */}
      <section className="bg-neuro-navy py-16 px-6">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-heading font-black text-white mb-4">
            Ready to find a doctor who understands your nervous system?
          </h2>
          <form onSubmit={(e) => { e.preventDefault(); router.push(`/directory?q=${encodeURIComponent(query)}`); }} className="flex flex-col sm:flex-row gap-3 mt-8">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="City, state, or specialty..."
                className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-neuro-orange"
              />
            </div>
            <button type="submit" className="px-8 py-4 bg-neuro-orange text-white font-bold rounded-xl hover:bg-neuro-orange/90 transition-colors">
              Search
            </button>
          </form>
          <p className="text-gray-500 text-sm mt-4">
            Or <Link href="/directory" className="text-neuro-orange font-bold hover:underline">browse all specialists</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
