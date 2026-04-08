"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Clock, 
  BookOpen, 
  Share2, 
  Bookmark, 
  PlayCircle,
  CheckCircle2,
  ChevronRight,
  User,
  MessageCircle,
  Heart
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";

const MOCK_CONTENT: Record<string, any> = {
  'brain-spine-connection': {
    title: "The Brain-Spine Connection",
    category: "Foundations",
    type: "article",
    time: "5 min",
    author: "Dr. Raymond Nichols",
    image: "https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=1200&q=80",
    content: `
      <p>The relationship between your brain and your spine is the most critical communication highway in your body. Every movement you make, every breath you take, and every thought you process relies on this connection being clear and unobstructed.</p>
      
      <h2>The Master Controller</h2>
      <p>Your nervous system, housed within the skull and the spinal column, is the master controller of your entire existence. When we talk about the "Brain-Spine Connection," we are really talking about how efficiently your brain can send and receive signals through the spinal cord to every organ, tissue, and cell.</p>
      
      <blockquote class="my-10 border-l-4 border-neuro-orange bg-neuro-cream p-8 rounded-r-3xl italic text-neuro-navy font-bold text-xl">
        "The spine is the lifeline of the body. If it is restricted, your life expression is restricted."
      </blockquote>

      <h2>What is Subluxation?</h2>
      <p>A subluxation is more than just a bone out of place; it's a neurological interference. When a spinal segment loses its proper motion or alignment, it creates "noise" in the system, preventing the brain from accurately perceiving what is happening in the body.</p>
      
      <ul class="space-y-4 my-8">
        <li><strong class="text-neuro-navy">Structural Stress:</strong> Physical trauma or repetitive bad posture.</li>
        <li><strong class="text-neuro-navy">Chemical Stress:</strong> Toxins and poor nutrition affecting nerve function.</li>
        <li><strong class="text-neuro-navy">Emotional Stress:</strong> The "Fight or Flight" response getting stuck.</li>
      </ul>

      <h2>The NeuroChiro Approach</h2>
      <p>Our goal isn't just to "fix backs." It's to restore the integrity of the Brain-Spine Connection so that your body can adapt to its environment, heal itself, and thrive at its highest potential.</p>
    `
  },
  'morning-neural-priming': {
     title: "Morning Neural Priming",
     category: "Practice",
     type: "article",
     time: "3 min",
     author: "Dr. Natalie West",
     image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80",
     content: `
       <p>How you wake up your nervous system determines the trajectory of your entire day. Neural priming is a set of specific movements designed to stimulate the cerebellum and prefrontal cortex, moving you from 'Survival Mode' to 'Thriving Mode' in minutes.</p>
       
       <h2>Step 1: The Cross-Crawl (60 seconds)</h2>
       <p>While standing, lift your right knee and touch it with your left hand. Repeat with the left knee and right hand. This simple rhythmic movement forces both hemispheres of the brain to communicate across the corpus callosum.</p>
       
       <h2>Step 2: Spinal Extension (30 seconds)</h2>
       <p>Interlace your fingers behind your head and gently pull your shoulder blades together while looking slightly upward. Breathe deeply into your upper chest to stimulate the vagus nerve.</p>
       
       <h2>Step 3: Mindful Affirmation (60 seconds)</h2>
       <p>Visualize your day with a clear, focused nervous system. Set the intention: "My body is adaptable, my mind is clear, and my system is thriving."</p>
     `
  }
};

export default function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params);
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(false);
  const [liked, setLiked] = useState(false);
  
  const article = MOCK_CONTENT[slug as string] || MOCK_CONTENT['brain-spine-connection'];

  return (
    <div className="w-full pb-20 animate-in fade-in duration-700">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => router.back()}
          className="group flex items-center gap-3 text-xs font-black text-gray-400 uppercase tracking-[0.2em] hover:text-neuro-orange transition-all"
        >
          <div className="p-2 bg-white rounded-lg border border-gray-100 group-hover:border-neuro-orange transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Back to Hub
        </button>
        <div className="flex items-center gap-3">
           <button 
             onClick={() => setIsSaved(!isSaved)}
             className={`p-3 rounded-2xl border transition-all ${isSaved ? 'bg-neuro-orange text-white border-neuro-orange shadow-lg shadow-neuro-orange/20' : 'bg-white text-gray-400 border-gray-100 hover:border-neuro-orange hover:text-neuro-orange'}`}
           >
              <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
           </button>
           <button className="p-3 bg-white text-gray-400 border border-gray-100 rounded-2xl hover:border-neuro-orange hover:text-neuro-orange transition-all shadow-sm">
              <Share2 className="w-5 h-5" />
           </button>
        </div>
      </div>

      {/* Hero Header */}
      <section className="relative rounded-2xl overflow-hidden mb-12 shadow-2xl border border-gray-100 group w-full h-[400px] md:h-[550px]">
         <img loading="lazy" decoding="async" src={article.image} alt={article.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[5s] ease-out" />
         <div className="absolute inset-0 bg-gradient-to-t from-neuro-black via-neuro-black/20 to-transparent" />
         
         <div className="absolute bottom-12 left-12 right-12 z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <span className="px-5 py-2 bg-neuro-orange text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full inline-block shadow-xl">
                 {article.category}
              </span>
              <h1 className="text-4xl md:text-5xl font-heading font-black text-white leading-[1.1] drop-shadow-2xl max-w-4xl tracking-tight">
                 {article.title}
              </h1>
            </motion.div>
         </div>
      </section>

      {/* Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12 items-start w-full">
         
         {/* Main Article Body */}
         <div className="space-y-12">
            <div className="bg-white p-8 md:p-16 rounded-2xl border border-gray-100 shadow-xl shadow-neuro-navy/5 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-neuro-orange to-orange-300"></div>
               
               {/* Meta Row */}
               <div className="flex flex-wrap items-center gap-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-12 pb-10 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-2xl bg-neuro-navy flex items-center justify-center text-white text-xs font-bold shadow-lg">RN</div>
                     <div className="flex flex-col gap-0.5">
                        <span className="text-gray-300 text-xs">Instructor</span>
                        <span className="text-neuro-navy">{article.author}</span>
                     </div>
                  </div>
                  <div className="h-8 w-px bg-gray-100 hidden md:block"></div>
                  <div className="flex items-center gap-2">
                     <Clock className="w-4 h-4 text-neuro-orange" />
                     <span>{article.time} Read</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <BookOpen className="w-4 h-4 text-neuro-orange" />
                     <span>Clinical {article.type}</span>
                  </div>
               </div>

               {/* Prose Content */}
               <div 
                 className="prose prose-xl prose-slate max-w-3xl mx-auto
                   prose-headings:font-heading prose-headings:font-black prose-headings:text-neuro-navy prose-headings:tracking-tight
                   prose-p:text-gray-600 prose-p:leading-[1.8] prose-p:text-lg md:prose-p:text-xl
                   prose-strong:text-neuro-navy prose-strong:font-black
                   prose-li:text-gray-600 prose-li:text-lg
                   "
                 dangerouslySetInnerHTML={{ __html: article.content }}
               />
               
               {/* Footer Actions */}
               <div className="mt-20 pt-12 border-t border-gray-100 flex flex-wrap items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                     <button 
                       onClick={() => setLiked(!liked)}
                       className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${liked ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-gray-50 text-neuro-navy border border-transparent hover:border-neuro-orange/20'}`}
                     >
                        <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} /> {liked ? 'Liked' : 'Like'}
                     </button>
                     <button className="flex items-center gap-2 px-8 py-4 bg-gray-50 text-neuro-navy border border-transparent hover:border-neuro-orange/20 font-black rounded-2xl transition-all text-[10px] uppercase tracking-widest">
                        <MessageCircle className="w-4 h-4" /> 12 Comments
                     </button>
                  </div>
                  <button className="flex items-center gap-2 px-8 py-4 bg-neuro-navy text-white font-black rounded-2xl hover:bg-neuro-orange transition-all text-[10px] uppercase tracking-widest shadow-xl shadow-neuro-navy/10">
                     <Share2 className="w-4 h-4" /> Share Article
                  </button>
               </div>
            </div>

            {/* Author Section */}
            <div className="bg-neuro-cream p-10 md:p-16 rounded-2xl border border-neuro-navy/5 flex flex-col md:flex-row gap-10 items-center">
               <div className="w-32 h-32 rounded-2xl bg-neuro-navy flex items-center justify-center text-white text-4xl font-black shadow-2xl shrink-0">RN</div>
               <div className="text-center md:text-left space-y-4">
                  <h3 className="text-2xl font-heading font-black text-neuro-navy">About Dr. Raymond Nichols</h3>
                  <p className="text-gray-600 leading-relaxed text-lg italic">
                     "Helping people reconnect with their internal power through neurological chiropractic care and lifestyle integration."
                  </p>
                  <button className="text-neuro-orange font-black uppercase tracking-[0.2em] text-[10px] hover:underline">View Full Profile →</button>
               </div>
            </div>
         </div>

         {/* Sidebar - Sticky */}
         <div className="space-y-8 lg:sticky lg:top-8">
            <section className="bg-white p-10 rounded-2xl border border-gray-100 shadow-xl shadow-neuro-navy/5">
               <h3 className="text-xl font-heading font-black text-neuro-navy mb-8 uppercase tracking-widest text-xs border-b border-gray-50 pb-4">Learning Goals</h3>
               <div className="space-y-6">
                  {[
                    "Mastering the Brain-Spine loop",
                    "Identifying Neurological Noise",
                    "Applying Adjustive Mastery"
                  ].map((goal, i) => (
                    <div key={i} className="flex items-start gap-4 group">
                       <div className="mt-1 p-1 bg-green-50 rounded-full">
                          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                       </div>
                       <span className="text-sm font-bold text-gray-500 group-hover:text-neuro-navy transition-colors leading-tight">{goal}</span>
                    </div>
                  ))}
               </div>
               <button className="w-full mt-10 py-5 bg-neuro-navy text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-neuro-orange transition-all shadow-lg shadow-neuro-navy/10">
                  Take Quiz & Earn CPD
               </button>
            </section>

            <section className="bg-neuro-navy p-10 rounded-2xl text-white relative overflow-hidden group shadow-2xl">
               <div className="relative z-10">
                  <h3 className="text-xl font-heading font-black mb-8 uppercase tracking-widest text-[10px] text-gray-400">Related Content</h3>
                  <div className="space-y-8">
                     {[
                       { title: "Vagus Nerve Hacks", time: "12 min", type: "Video" },
                       { title: "Postural Neural Bias", time: "8 min", type: "Article" }
                     ].map((item, i) => (
                       <Link key={i} href="#" className="block group/link space-y-2 border-b border-white/5 pb-6 last:border-0 last:pb-0">
                          <div className="flex items-center gap-2">
                             <span className="text-xs font-black text-neuro-orange uppercase tracking-[0.2em]">{item.time} {item.type}</span>
                          </div>
                          <h4 className="font-bold text-lg flex items-center justify-between group-hover/link:text-neuro-orange transition-colors">
                             {item.title}
                             <ChevronRight className="w-5 h-5 group-hover/link:translate-x-1 transition-transform" />
                          </h4>
                       </Link>
                     ))}
                  </div>
               </div>
            </section>

            <section className="p-10 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
               <div className="w-16 h-16 bg-neuro-orange/10 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-sm mx-auto">
                  <User className="w-8 h-8 text-neuro-orange" />
               </div>
               <h3 className="text-xl font-heading font-black text-neuro-navy mb-3">Private Session</h3>
               <p className="text-xs text-gray-500 leading-relaxed mb-8">
                  Need clinical clarification on this topic? Book a 15-min mentor session with Dr. Nichols.
               </p>
               <button className="w-full py-4 bg-neuro-cream text-neuro-navy font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-neuro-orange hover:text-white transition-all border border-transparent">
                  Check Availability
               </button>
            </section>
         </div>
      </div>
    </div>
  );
}
