"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, PlayCircle, BookOpen, Clock, ArrowRight, Bookmark, Sparkles, X } from "lucide-react";

export default function LearnHub() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [savedArticles, setSavedArticles] = useState<number[]>([]);

  const categories = ["All", "Foundations", "Vagus Nerve", "Stress Relief", "Sleep Science", "Nutrition", "Scientific", "Practice"];
  
  const articles = [
    { 
      id: 1, 
      slug: "brain-spine-connection",
      title: "The Brain-Spine Connection", 
      category: "Foundations", 
      type: "article", 
      time: "5 min", 
      image: "https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=800&q=80", 
      description: "Exploring the fundamental relationship between spinal alignment and cognitive function." 
    },
    { 
      id: 2, 
      slug: "calming-nervous-system",
      title: "Calming Your Nervous System", 
      category: "Stress Relief", 
      type: "video", 
      time: "12 min", 
      image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80", 
      description: "Practical breathwork and mindfulness techniques for instant stress reduction." 
    },
    { 
      id: 3, 
      slug: "morning-neural-priming",
      title: "Morning Neural Priming", 
      category: "Practice", 
      type: "article", 
      time: "3 min", 
      image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80", 
      description: "A quick 3-minute routine to wake up your nervous system every morning." 
    },
    { 
      id: 4, 
      slug: "why-adjustments-matter",
      title: "Why Adjustments Matter", 
      category: "Scientific", 
      type: "article", 
      time: "8 min", 
      image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80", 
      description: "The peer-reviewed science behind chiropractic care and neurological health." 
    },
    { 
      id: 5, 
      slug: "vagus-nerve-secret",
      title: "The Vagus Nerve Secret", 
      category: "Vagus Nerve", 
      type: "video", 
      time: "15 min", 
      image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=800&q=80", 
      description: "How to stimulate your body's most important nerve for better digestion and heart health." 
    },
    { 
      id: 6, 
      slug: "sleep-and-spine",
      title: "Sleep & The Spine", 
      category: "Sleep Science", 
      type: "article", 
      time: "6 min", 
      image: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80", 
      description: "The best sleeping positions to maintain neurological health and spinal curve." 
    }
  ];

  const filteredArticles = articles.filter(article => {
    const matchesCategory = activeCategory === "All" || article.category === activeCategory;
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         article.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleSave = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const isSaved = savedArticles.includes(id);
    setSavedArticles(prev => 
      isSaved ? prev.filter(item => item !== id) : [...prev, id]
    );
    console.log(`[USER ACTION] ${isSaved ? 'Removed' : 'Saved'} article ${id}`);
  };

  const handleArticleClick = (slug: string) => {
    router.push(`/portal/learn/${slug}`);
  };

  const handleStartLearning = () => {
    router.push("/portal/learn/polyvagal-theory-masterclass");
  };

  const handleRequestTopic = () => {
    const topic = prompt("What topic would you like to see next?");
    if (topic) {
      alert(`Thank you! Our clinical team has received your request for: "${topic}"`);
    }
  };

  return (
    <div className="space-y-12 pb-12 text-neuro-navy">
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
        <div className="flex gap-2 overflow-x-auto pb-4 w-full lg:w-auto scrollbar-hide no-scrollbar">
           {categories.map((c) => (
             <button 
               key={c} 
               onClick={() => setActiveCategory(c)}
               className={`whitespace-nowrap px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all transform hover:scale-105 ${activeCategory === c ? 'bg-neuro-navy text-white shadow-xl shadow-neuro-navy/20' : 'bg-white border border-gray-100 text-gray-400 hover:border-neuro-orange hover:text-neuro-orange'}`}
             >
               {c}
             </button>
           ))}
        </div>
      </div>

      {/* Featured Content */}
      {!searchQuery && activeCategory === "All" && (
        <section className="relative">
           <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 py-2 bg-white rounded-full border border-gray-100 shadow-xl z-20">
              <Sparkles className="w-4 h-4 text-neuro-orange" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neuro-navy">Featured This Week</span>
           </div>
           
           <div className="bg-neuro-navy rounded-2xl overflow-hidden flex flex-col lg:flex-row text-white shadow-2xl relative border border-white/5 group">
              <div className="flex-1 p-10 lg:p-20 flex flex-col justify-center relative z-10">
                 <div className="flex items-center gap-2 mb-6">
                    <span className="px-4 py-1 bg-neuro-orange text-white font-black uppercase tracking-widest text-[10px] rounded-full shadow-lg shadow-neuro-orange/20">Masterclass</span>
                    <span className="text-gray-400 text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> 20 min</span>
                 </div>
                 <h2 className="text-4xl lg:text-6xl font-heading font-black mb-8 leading-tight">Deep Dive: <br/><span className="text-neuro-orange">The Polyvagal Theory</span></h2>
                 <p className="text-gray-400 text-lg mb-10 leading-relaxed max-w-xl">
                    Understand how your body's safety system dictates your mood, energy, and overall health. A 20-minute guide to self-regulation.
                 </p>
                 <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={handleStartLearning}
                      className="px-10 py-5 bg-neuro-orange text-white font-black uppercase tracking-widest text-sm rounded-2xl hover:bg-neuro-orange-dark transition-all shadow-xl shadow-neuro-orange/20 flex items-center justify-center gap-2 group/btn"
                    >
                       Start Learning <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); alert("Article saved to your profile."); }}
                      className="px-10 py-5 bg-white/10 border border-white/10 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-white/20 transition-all backdrop-blur-sm flex items-center justify-center gap-2"
                    >
                       <Bookmark className="w-4 h-4" /> Save for Later
                    </button>
                 </div>
              </div>
              <div className="flex-1 bg-gradient-to-tr from-neuro-navy-dark to-blue-900 min-h-[400px] relative group overflow-hidden">
                 <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20 bg-center" />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                       <PlayCircle className="w-32 h-32 text-white relative z-10 opacity-30 group-hover:opacity-100 transition-all group-hover:scale-110 cursor-pointer" />
                    </div>
                 </div>
                 
                 {/* Decorative elements */}
                 <div className="absolute bottom-10 left-10 p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 space-y-1">
                    <p className="text-[10px] font-black text-neuro-orange uppercase tracking-widest">Instructor</p>
                    <p className="font-bold text-sm">Dr. Raymond Nichols</p>
                 </div>
              </div>
           </div>
        </section>
      )}

      {/* Article Grid */}
      <section className="space-y-8">
         <div className="flex items-center justify-between">
            <h3 className="text-2xl font-heading font-black flex items-center gap-3">
               Latest Content
               <span className="px-3 py-1 bg-gray-100 text-[10px] font-black uppercase rounded-lg text-gray-500">{filteredArticles.length}</span>
            </h3>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
               <span>Sort by:</span>
               <select className="bg-transparent border-none focus:ring-0 cursor-pointer text-neuro-navy font-black">
                  <option>Newest First</option>
                  <option>Shortest First</option>
               </select>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            <AnimatePresence mode="popLayout">
               {filteredArticles.map((item) => (
                 <motion.div 
                   layout
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.9 }}
                   key={item.id}
                   whileHover={{ y: -12 }}
                   onClick={() => handleArticleClick(item.slug)}
                   className="bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer group shadow-sm hover:shadow-2xl hover:border-neuro-orange/30 transition-all flex flex-col h-full"
                 >
                    <div className="h-48 relative overflow-hidden shrink-0">
                       <img loading="lazy" decoding="async" src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                       <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                       <div className="absolute top-4 right-4 z-20">
                          <button 
                            onClick={(e) => toggleSave(item.id, e)}
                            className={`p-3 rounded-xl backdrop-blur-md transition-all ${savedArticles.includes(item.id) ? 'bg-neuro-orange text-white' : 'bg-white/20 text-white hover:bg-white/40'}`}
                          >
                             <Bookmark className={`w-4 h-4 ${savedArticles.includes(item.id) ? 'fill-current' : ''}`} />
                          </button>
                       </div>
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
                          <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                          <span className="text-gray-400">{item.type}</span>
                       </div>
                       <h4 className="font-heading font-black text-neuro-navy text-xl mb-4 group-hover:text-neuro-orange transition-colors line-clamp-2 leading-tight">
                          {item.title}
                       </h4>
                       <p className="text-sm text-gray-500 leading-relaxed mb-8 line-clamp-3">
                          {item.description}
                       </p>
                       <div className="pt-6 border-t border-gray-50 mt-auto flex items-center justify-between">
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
              <p className="text-gray-400 mt-2 max-w-xs mx-auto">Try searching for something else like "Vagus Nerve" or "Adjustments".</p>
              <button 
                onClick={() => { setSearchQuery(""); setActiveCategory("All"); }}
                className="mt-8 px-8 py-3 bg-neuro-navy text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-neuro-orange transition-all"
              >
                 Reset Filters
              </button>
           </div>
         )}
      </section>

      {/* Bottom CTA */}
      <section className="bg-neuro-cream rounded-2xl p-12 md:p-20 border border-neuro-navy/5 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-10 opacity-10">
            <BookOpen className="w-64 h-64 text-neuro-navy" />
         </div>
         <div className="relative z-10 max-w-2xl">
            <h2 className="text-4xl font-heading font-black text-neuro-navy mb-6">Can't find what <br/>you're looking for?</h2>
            <p className="text-gray-600 text-lg mb-10 font-medium">
               Our clinical team is constantly adding new research, videos, and guides. Suggest a topic and we'll prioritize it.
            </p>
            <button 
              onClick={handleRequestTopic}
              className="px-10 py-5 bg-neuro-navy text-white font-black uppercase tracking-widest text-sm rounded-2xl hover:bg-neuro-navy-light transition-all shadow-xl"
            >
               Request a Topic
            </button>
         </div>
      </section>
    </div>
  );
}
