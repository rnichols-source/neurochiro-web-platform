"use client";

import { useState } from "react";
import { HelpCircle, ChevronDown } from "lucide-react";

export default function VendorPageClient({ faq }: { faq: { question: string; answer: string }[] }) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
      <div className="flex items-center gap-2 mb-6">
        <HelpCircle className="w-5 h-5 text-neuro-orange" />
        <h2 className="text-lg font-black text-neuro-navy">Frequently Asked Questions</h2>
      </div>
      <div className="space-y-2">
        {faq.map((item, i) => (
          <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <span className="font-bold text-neuro-navy text-sm">{item.question}</span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
            </button>
            {openFaq === i && (
              <div className="px-4 pb-4">
                <p className="text-sm text-gray-600 leading-relaxed">{item.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
