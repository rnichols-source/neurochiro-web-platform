"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, BookOpen, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const MOCK_CONTENT: Record<string, { title: string; category: string; type: string; time: string; author: string; image: string; content: string }> = {
  "brain-spine-connection": {
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
      <blockquote class="my-10 border-l-4 border-neuro-orange bg-neuro-cream p-8 rounded-r-3xl italic text-neuro-navy font-bold text-xl">"The spine is the lifeline of the body. If it is restricted, your life expression is restricted."</blockquote>
      <h2>What is Subluxation?</h2>
      <p>A subluxation is more than just a bone out of place; it's a neurological interference. When a spinal segment loses its proper motion or alignment, it creates "noise" in the system, preventing the brain from accurately perceiving what is happening in the body.</p>
      <ul class="space-y-4 my-8">
        <li><strong class="text-neuro-navy">Structural Stress:</strong> Physical trauma or repetitive bad posture.</li>
        <li><strong class="text-neuro-navy">Chemical Stress:</strong> Toxins and poor nutrition affecting nerve function.</li>
        <li><strong class="text-neuro-navy">Emotional Stress:</strong> The "Fight or Flight" response getting stuck.</li>
      </ul>
      <h2>The NeuroChiro Approach</h2>
      <p>Our goal isn't just to "fix backs." It's to restore the integrity of the Brain-Spine Connection so that your body can adapt to its environment, heal itself, and thrive at its highest potential.</p>
    `,
  },
  "morning-neural-priming": {
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
    `,
  },
};

export default function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params);
  const router = useRouter();

  const article = MOCK_CONTENT[slug as string] || MOCK_CONTENT["brain-spine-connection"];

  return (
    <div className="w-full pb-20 animate-in fade-in duration-700">
      {/* Navigation */}
      <div className="flex items-center mb-8">
        <button
          onClick={() => router.back()}
          className="group flex items-center gap-3 text-xs font-black text-gray-400 uppercase tracking-[0.2em] hover:text-neuro-orange transition-all"
        >
          <div className="p-2 bg-white rounded-lg border border-gray-100 group-hover:border-neuro-orange transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Back to Hub
        </button>
      </div>

      {/* Hero */}
      <section className="relative rounded-2xl overflow-hidden mb-12 shadow-2xl border border-gray-100 w-full h-[400px] md:h-[500px]">
        <img loading="lazy" decoding="async" src={article.image} alt={article.title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-neuro-black via-neuro-black/20 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
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
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 items-start w-full">
        {/* Main Article */}
        <div className="bg-white p-8 md:p-16 rounded-2xl border border-gray-100 shadow-xl shadow-neuro-navy/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-neuro-orange to-orange-300" />

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-12 pb-10 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-neuro-navy flex items-center justify-center text-white text-xs font-bold shadow-lg">
                {article.author.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-gray-300 text-xs">Author</span>
                <span className="text-neuro-navy">{article.author}</span>
              </div>
            </div>
            <div className="h-8 w-px bg-gray-100 hidden md:block" />
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-neuro-orange" />
              <span>{article.time} Read</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-neuro-orange" />
              <span>Clinical {article.type}</span>
            </div>
          </div>

          {/* Prose */}
          <div
            className="prose prose-xl prose-slate max-w-3xl mx-auto prose-headings:font-heading prose-headings:font-black prose-headings:text-neuro-navy prose-headings:tracking-tight prose-p:text-gray-600 prose-p:leading-[1.8] prose-p:text-lg md:prose-p:text-xl prose-strong:text-neuro-navy prose-strong:font-black prose-li:text-gray-600 prose-li:text-lg"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-8 lg:sticky lg:top-8">
          <section className="bg-white p-10 rounded-2xl border border-gray-100 shadow-xl shadow-neuro-navy/5">
            <h3 className="font-heading font-black text-neuro-navy mb-8 text-xs uppercase tracking-widest border-b border-gray-50 pb-4">
              Learning Goals
            </h3>
            <div className="space-y-6">
              {["Mastering the Brain-Spine loop", "Identifying Neurological Noise", "Applying Adjustive Mastery"].map((goal, i) => (
                <div key={i} className="flex items-start gap-4 group">
                  <div className="mt-1 p-1 bg-green-50 rounded-full">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  </div>
                  <span className="text-sm font-bold text-gray-500 group-hover:text-neuro-navy transition-colors leading-tight">
                    {goal}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Author */}
          <div className="bg-neuro-cream p-8 rounded-2xl border border-neuro-navy/5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-neuro-navy flex items-center justify-center text-white text-xl font-black shadow-lg mx-auto mb-4">
              {article.author.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <h3 className="text-lg font-heading font-black text-neuro-navy mb-2">{article.author}</h3>
            <p className="text-sm text-gray-500 italic leading-relaxed">
              Neurological chiropractic care and lifestyle integration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
