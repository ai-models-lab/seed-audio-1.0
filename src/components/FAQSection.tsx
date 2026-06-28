import React, { useState } from "react";
import { SEO_FAQS } from "../utils/presets";
import { HelpCircle, ChevronDown, ChevronUp, FileText } from "lucide-react";

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleIndex = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div id="faq-section-card" className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <HelpCircle className="w-5 h-5 text-indigo-600" />
        <h3 className="font-semibold text-zinc-900 text-lg">Frequently Asked Questions</h3>
      </div>
      <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
        Everything you need to know about Seed Audio, Seedance Audio, See Audio, and how to create multi-track vocal dialogs.
      </p>

      <div className="space-y-3">
        {SEO_FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="border border-zinc-100 rounded-2xl overflow-hidden transition-all duration-300"
            >
              <button
                id={`faq-btn-${idx}`}
                onClick={() => toggleIndex(idx)}
                className="w-full flex justify-between items-center p-4 text-left font-semibold text-zinc-800 hover:bg-zinc-50 transition-colors text-sm cursor-pointer"
              >
                <span>{faq.question}</span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-zinc-500 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
                )}
              </button>
              
              {isOpen && (
                <div className="p-4 bg-zinc-50/50 border-t border-zinc-100 text-xs text-zinc-600 leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
