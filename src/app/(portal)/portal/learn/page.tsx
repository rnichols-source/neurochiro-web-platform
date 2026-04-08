"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, PlayCircle, BookOpen, Clock, ArrowRight, X } from "lucide-react";

const categories = ["All", "Foundations", "Vagus Nerve", "Stress Relief", "Sleep Science", "Nutrition", "Scientific", "Practice"];

const articles = [
  { id: 1, slug: "brain-spine-connection", title: "The Brain-Spine Connection", category: "Foundations", type: "article", time: "5 min", image: "https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=800&q=80", description: "Exploring the fundamental relationship between spinal alignment and cognitive function." },
  { id: 2, slug: "calming-nervous-system", title: "Calming Your Nervous System", category: "Stress Relief", type: "video", time: "12 min", image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80", description: "Practical breathwork and mindfulness techniques for instant stress reduction." },
  { id: 3, slug: "morning-neural-priming", title: "Morning Neural Priming", category: "Practice", type: "article", time: "3 min", image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80", description: "A quick 3-minute routine to wake up your nervous system every morning." },
  { id: 4, slug: "why-adjustments-matter", title: "Why Adjustments Matter", category: "Scientific", type: "article", time: "8 min", image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80", description: "The peer-reviewed science behind chiropractic care and neurological health." },
  { id: 5, slug: "vagus-nerve-secret", title: "The Vagus Nerve Secret", category: "Vagus Nerve", type: "video", time: "15 min", image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=800&q=80", description: "How to stimulate your body's most important nerve for better digestion and heart health." },
  { id: 6, slug: "sleep-and-spine", title: "Sleep & The Spine", category: "Sleep Science", type: "article", time: "6 min", image: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80", description: "The best sleeping positions to maintain neurological health and spinal curve." },
];

export default function LearnHub() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredArticles = articles.filter((article) => {
    const matchesCategory = activeCategory === "All" || article.category === activeCategory;
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-12 pb-12 text-neuro-navy">
      {/* Header & Search */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div className="max-w-xl w-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-neuro-orange/10 rounded-xl">
              <BookOpen className="w-5 h-5 text-neuro-orange" />
            </div>
            <h1 className="text-4xl font-heading font-black">Education Hub</h1>
          </div>
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-neuro-orange transition-colors" />
            <input
              type="text"
              placeholder="Search topics, conditions, or techniques..."
              className="w-full pl-14 pr-12 py-5 bg-white border border-gray-100 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-neuro-orange/5 focus:border-neuro-orange/30 transition-all shadow-xl shadow-neuro-navy/5 text-sm font-bold"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-5 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-4 w-full lg:w-auto scrollbar-hide no-scrollbar">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`whitespace-nowrap px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all transform hover:scale-105 ${
                activeCategory === c
                  ? "bg-neuro-navy text-white shadow-xl shadow-neuro-navy/20"
                  : "bg-white border border-gray-100 text-gray-400 hover:border-neuro-orange hover:text-neuro-orange"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Content */}
      {!searchQuery && activeCategory === "All" && (
        <section className="bg-neuro-navy rounded-2xl overflow-hidden flex flex-col lg:flex-row text-white shadow-2xl border border-white/5">
          <div className="flex-1 p-10 lg:p-16 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-6">
              <span className="px-4 py-1 bg-neuro-orange text-white font-black uppercase tracking-widest text-[10px] rounded-full">
                Featured
              </span>
              <span className="text-gray-400 text-xs font-bold flex items-center gap-1">
                <Clock className="w-3 h-3" /> 20 min
              </span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-heading font-black mb-6 leading-tight">
              Deep Dive: <span className="text-neuro-orange">The Polyvagal Theory</span>
            </h2>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed max-w-xl">
              Understand how your body&apos;s safety system dictates your mood, energy, and overall health.
            </p>
            <button
              onClick={() => router.push("/portal/learn/polyvagal-theory-masterclass")}
              className="px-10 py-5 bg-neuro-orange text-white font-black uppercase tracking-widest text-sm rounded-2xl hover:bg-neuro-orange-dark transition-all shadow-xl shadow-neuro-orange/20 flex items-center gap-2 w-fit"
            >
              Start Learning <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 bg-gradient-to-tr from-neuro-navy-dark to-blue-900 min-h-[300px] relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <PlayCircle className="w-24 h-24 text-white/30" />
            </div>
          </div>
        </section>
      )}

      {/* Article Grid */}
      <section className="space-y-8">
        <h3 className="text-2xl font-heading font-black flex items-center gap-3">
          Latest Content
          <span className="px-3 py-1 bg-gray-100 text-[10px] font-black uppercase rounded-lg text-gray-500">
            {filteredArticles.length}
          </span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredArticles.map((item) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={item.id}
                whileHover={{ y: -8 }}
                onClick={() => router.push(`/portal/learn/${item.slug}`)}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer group shadow-sm hover:shadow-2xl hover:border-neuro-orange/30 transition-all flex flex-col h-full"
              >
                <div className="h-48 relative overflow-hidden shrink-0">
                  <img loading="lazy" decoding="async" src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute bottom-4 left-4">
                    <span className="px-4 py-1.5 bg-white/90 backdrop-blur-md text-neuro-navy text-xs font-black uppercase tracking-widest rounded-lg shadow-lg">
                      {item.category}
                    </span>
                  </div>
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex items-center gap-3 mb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                      {item.type === "article" ? <BookOpen className="w-3 h-3 text-neuro-orange" /> : <PlayCircle className="w-3 h-3 text-neuro-orange" />}
                      {item.time}
                    </div>
                    <span className="w-1 h-1 bg-gray-200 rounded-full" />
                    <span>{item.type}</span>
                  </div>
                  <h4 className="font-heading font-black text-neuro-navy text-xl mb-4 group-hover:text-neuro-orange transition-colors line-clamp-2 leading-tight">
                    {item.title}
                  </h4>
                  <p className="text-sm text-gray-500 leading-relaxed mb-8 line-clamp-3">{item.description}</p>
                  <div className="pt-6 border-t border-gray-50 mt-auto">
                    <span className="text-[10px] font-black text-neuro-navy uppercase tracking-widest flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                      Read Full Article <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredArticles.length === 0 && (
          <div className="py-32 text-center bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-gray-200" />
            </div>
            <h3 className="text-2xl font-bold text-neuro-navy">No topics found</h3>
            <p className="text-gray-400 mt-2 max-w-xs mx-auto">Try searching for something else like &quot;Vagus Nerve&quot; or &quot;Adjustments&quot;.</p>
            <button
              onClick={() => { setSearchQuery(""); setActiveCategory("All"); }}
              className="mt-8 px-8 py-3 bg-neuro-navy text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-neuro-orange transition-all"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
