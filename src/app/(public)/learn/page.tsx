"use client";

import { motion } from "framer-motion";
import { 
  BookOpen, 
  Zap, 
  Heart, 
  Baby, 
  Brain, 
  ArrowRight, 
  ShieldCheck, 
  Activity, 
  Search, 
  HelpCircle,
  Dumbbell,
  Stethoscope
} from "lucide-react";
import Link from "next/link";
import { ARTICLES } from "@/lib/articles";

const categories = [
  { id: "foundations", name: "Nervous System Basics", icon: Zap, color: "text-neuro-orange", bg: "bg-neuro-orange/10" },
  { id: "stress", name: "Stress & Regulation", icon: Brain, color: "text-purple-500", bg: "bg-purple-500/10" },
  { id: "pediatrics", name: "Children & Development", icon: Baby, color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: "recovery", name: "Sleep & Recovery", icon: Activity, color: "text-green-500", bg: "bg-green-500/10" },
  { id: "lifestyle", name: "Lifestyle & Health", icon: Heart, color: "text-rose-500", bg: "bg-rose-500/10" },
];

const learningPaths = [
  {
    title: "New to NeuroChiro?",
    description: "Start here to understand the foundational philosophy of nervous-system centered care.",
    link: "/learn/foundations",
    icon: Stethoscope,
    cta: "Start Foundations"
  },
  {
    title: "Why Repetition Matters",
    description: "Learn how the nervous system adapts and why consistency is the key to lasting change.",
    link: "/learn/repetition",
    icon: Dumbbell,
    cta: "Explore Neuroplasticity"
  },
  {
    title: "The Clinic Experience",
    description: "What happens during your first visit, the scans, and your personalized care plan.",
    link: "/learn/experience",
    icon: ShieldCheck,
    cta: "See Your Journey"
  }
];

export default function EducationHub() {
  return (
    <div className="min-h-screen bg-neuro-cream pb-32">
      {/* Immersive Header */}
      <header className="bg-neuro-navy text-white pt-32 pb-48 px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10 text-center space-y-6">
          <span className="text-neuro-orange-light font-black uppercase tracking-[0.4em] text-xs">Patient Education Hub</span>
          <h1 className="text-6xl md:text-8xl font-heading font-black leading-[0.9] text-white">
            Understand Your <br />
            <span className="text-neuro-orange">Nervous System.</span>
          </h1>
          <p className="text-gray-300 text-xl max-w-2xl mx-auto font-medium leading-relaxed">
            The most trusted resource for understanding how chiropractic care supports your body's master control system.
          </p>
          
          <div className="max-w-2xl mx-auto relative pt-8">
            <Search className="absolute left-6 top-[68%] -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search topics (e.g., Vagus Nerve, Sleep, Pediatrics)..."
              className="w-full pl-14 pr-6 py-5 bg-white text-neuro-navy rounded-[2rem] shadow-2xl border-none focus:outline-none focus:ring-4 focus:ring-neuro-orange/20 text-lg font-medium"
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 -mt-24 relative z-20">
        
        {/* Featured Learning Paths */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {learningPaths.map((path, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={path.title}
              className="bg-white rounded-[3rem] p-10 shadow-2xl border border-gray-100 flex flex-col items-center text-center group hover:-translate-y-2 transition-all"
            >
              <div className="w-16 h-16 rounded-2xl bg-neuro-navy flex items-center justify-center text-white mb-6 group-hover:bg-neuro-orange transition-colors">
                <path.icon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-neuro-navy mb-4">{path.title}</h3>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">{path.description}</p>
              <Link 
                href={path.link}
                className="mt-auto px-8 py-3 bg-gray-50 text-neuro-navy font-black rounded-xl text-xs uppercase tracking-widest group-hover:bg-neuro-navy group-hover:text-white transition-all"
              >
                {path.cta}
              </Link>
            </motion.div>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Categories Sidebar */}
          <aside className="space-y-8">
            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-6 px-4">Categories</h4>
              <nav className="space-y-2">
                {categories.map((cat) => (
                  <button 
                    key={cat.id}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white hover:shadow-lg transition-all group text-left"
                  >
                    <div className={`w-10 h-10 rounded-xl ${cat.bg} ${cat.color} flex items-center justify-center shrink-0`}>
                      <cat.icon className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-sm text-neuro-navy group-hover:text-neuro-orange transition-colors">{cat.name}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="bg-neuro-navy p-8 rounded-[2.5rem] text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-neuro-orange/10 blur-2xl"></div>
               <HelpCircle className="w-8 h-8 text-neuro-orange mb-4" />
               <h4 className="text-xl font-bold mb-2">Common Questions</h4>
               <p className="text-xs text-gray-400 mb-6">Find quick answers to billing, safety, and results.</p>
               <Link href="/learn/faq" className="text-neuro-orange font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                  View FAQ <ArrowRight className="w-4 h-4" />
               </Link>
            </div>
          </aside>

          {/* Article Feed */}
          <div className="lg:col-span-3 space-y-12">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-heading font-black text-neuro-navy">Latest Insights</h2>
              <div className="flex gap-2">
                {["All", "Videos", "Articles"].map(t => (
                  <button key={t} className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-white border border-gray-100 text-gray-400 hover:text-neuro-navy transition-colors">{t}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {ARTICLES.map((article, i) => (
                <Link key={i} href={`/learn/${article.slug}`} className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer">
                  <div className="aspect-video relative overflow-hidden">
                    <img loading="lazy" decoding="async" src={article.img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[9px] font-black uppercase tracking-widest text-neuro-navy">{article.category}</span>
                    </div>
                  </div>
                  <div className="p-8">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                      <BookOpen className="w-3 h-3" /> {article.readTime} read
                    </div>
                    <h3 className="text-xl font-bold text-neuro-navy group-hover:text-neuro-orange transition-colors leading-tight mb-4">
                      {article.title}
                    </h3>
                    <div className="flex items-center gap-2 text-neuro-orange text-xs font-black uppercase tracking-widest">
                      Read Article <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Global CTA */}
        <section className="mt-32 bg-neuro-orange rounded-[4rem] p-12 md:p-20 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-12 shadow-2xl">
           <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-white/10 blur-[100px] -ml-48 -mt-48 rounded-full"></div>
           <div className="relative z-10 max-w-xl">
              <h2 className="text-4xl md:text-5xl font-heading font-black mb-6">Ready to experience clinical regulation?</h2>
              <p className="text-white/80 text-xl font-medium">
                Find a verified NeuroChiro doctor who specializes in nervous system focused care.
              </p>
           </div>
           <Link href="/directory" className="relative z-10 px-12 py-6 bg-neuro-navy text-white font-black uppercase tracking-widest rounded-2xl hover:bg-neuro-navy-light transition-all shadow-2xl">
              Find a Doctor Near Me
           </Link>
        </section>
      </main>
    </div>
  );
}
