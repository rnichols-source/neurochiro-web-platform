"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle, Wallet, ShieldCheck, Zap, Info } from "lucide-react";
import Link from "next/link";

const faqs = [
  {
    question: "What does chiropractic actually do?",
    answer: "Chiropractic care focuses on the relationship between your spine and your nervous system. By making specific adjustments to the spine, we remove interference in your neural pathways, allowing your brain and body to communicate effectively and support your body's natural ability to heal."
  },
  {
    question: "How long does it take to see results?",
    answer: "Every nervous system is different. Some patients feel immediate shifts in regulation, while others take several weeks of consistent care to notice changes in their physiology. Long-term, sustainable change is a process of repetition, not a single event."
  },
  {
    question: "Why do chiropractors recommend multiple visits?",
    answer: "Think of it like training at the gym or learning a language. Your nervous system has 'learned' certain stressful patterns over years. Overriding those patterns and establishing new, regulated ones requires consistent input over time to ensure the changes stick."
  },
  {
    question: "Is chiropractic safe?",
    answer: "Yes. Chiropractic is widely recognized as one of the safest drug-free, non-invasive therapies available for the treatment of neuromusculoskeletal complaints. Our doctors use precise, gentle techniques tailored to your specific clinical scans."
  },
  {
    question: "How do I know if a chiropractor is right for me?",
    answer: "If you are looking for a doctor who focuses on the 'why' behind your health challenges and uses objective data to track your nervous system function, a NeuroChiro doctor is likely a great fit."
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="min-h-dvh bg-neuro-cream pb-32">
      {/* Header */}
      <header className="bg-neuro-navy text-white pt-32 pb-24 px-8 relative overflow-hidden text-center">
        <div className="max-w-4xl mx-auto relative z-10 space-y-6">
          <HelpCircle className="w-16 h-16 text-neuro-orange mx-auto mb-4" />
          <h1 className="text-5xl md:text-7xl font-heading font-black text-white">Common Questions</h1>
          <p className="text-gray-300 text-xl font-medium">Clarity and transparency regarding your care.</p>
        </div>

      </header>

      <main className="max-w-4xl mx-auto px-8 -mt-12 relative z-20 space-y-12">
        {/* Accordion */}
        <section className="bg-white rounded-[3rem] p-10 shadow-2xl border border-gray-100">
          <div className="divide-y divide-gray-100">
            {faqs.map((faq, i) => (
              <div key={i} className="py-6 first:pt-0 last:pb-0">
                <button 
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between text-left group"
                >
                  <span className={`text-xl font-bold transition-colors ${openIndex === i ? 'text-neuro-orange' : 'text-neuro-navy group-hover:text-neuro-orange'}`}>
                    {faq.question}
                  </span>
                  {openIndex === i ? <ChevronUp className="text-neuro-orange" /> : <ChevronDown className="text-gray-300" />}
                </button>
                {openIndex === i && (
                  <div className="mt-4 text-gray-600 leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Insurance vs Cash Section */}
        <section className="bg-white rounded-[3rem] p-12 shadow-2xl border border-gray-100 overflow-hidden relative">
           <div className="absolute top-0 right-0 p-12 opacity-5">
              <Wallet className="w-48 h-48 text-neuro-navy" />
           </div>
           <div className="relative z-10 space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                 <Info className="w-3 h-3" /> Financial Transparency
              </div>
              <h2 className="text-4xl font-heading font-black text-neuro-navy leading-tight">Why Many NeuroChiro Offices Are "Cash-Based"</h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                You may notice that many high-quality, nervous-system focused clinics do not accept traditional health insurance for clinical care. This is a deliberate choice made to prioritize <strong>quality of care</strong> over <strong>billing restrictions</strong>.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                    <h4 className="font-bold text-neuro-navy flex items-center gap-2">
                       <Zap className="w-4 h-4 text-neuro-orange" /> No Limitations
                    </h4>
                    <p className="text-sm text-gray-500">Insurance companies often dictate how long a doctor can spend with you and what treatments are "covered," regardless of what your nervous system actually needs.</p>
                 </div>
                 <div className="space-y-4">
                    <h4 className="font-bold text-neuro-navy flex items-center gap-2">
                       <ShieldCheck className="w-4 h-4 text-green-500" /> Care Flexibility
                    </h4>
                    <p className="text-sm text-gray-500">By removing the insurance middleman, your doctor has the freedom to create a care plan that is 100% tailored to your clinical scans and health goals.</p>
                 </div>
              </div>

              <div className="p-8 bg-neuro-cream rounded-3xl border border-gray-100">
                 <p className="text-neuro-navy font-bold text-sm leading-relaxed">
                    While our doctors are out-of-network with insurance, many provide "Superbills" that you can submit to your insurance for potential reimbursement, and most accept HSA/FSA funds.
                 </p>
              </div>
           </div>
        </section>

        {/* Global CTA */}
        <div className="text-center pt-12">
           <Link href="/directory" className="px-12 py-6 bg-neuro-navy text-white font-black uppercase tracking-widest rounded-2xl hover:bg-neuro-navy-light shadow-2xl transition-all inline-block">
              Find a Doctor & Book Now
           </Link>
        </div>
      </main>
    </div>
  );
}
