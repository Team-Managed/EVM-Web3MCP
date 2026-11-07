import React from "react";
import { FAQ_ITEMS } from "@/lib/data";
import { Plus, Minus } from "lucide-react";

export function FAQ() {
  return (
    <section id="faq" className="py-24 bg-[#FAF9F6] border-b border-[#E2DFD7]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <div className="inline-flex items-center gap-2 font-sans text-xs text-[#E57E25] uppercase tracking-widest mb-3 font-semibold">
            <span className="w-2.5 h-2.5 bg-[#E57E25]" />
            <span>Questions & Answers</span>
          </div>
          <h2 className="font-editorial text-4xl sm:text-6xl text-[#111316] font-normal tracking-tight mb-4 leading-[1.08]">
            Frequently Asked Questions.
          </h2>
          <p className="max-w-2xl mx-auto text-sm text-[#5A5D64]">
            Technical details on security, key custody, ENS integration, and architecture.
          </p>
        </div>

        {/* Native details/summary: open state, keyboard and screen readers come from the browser. One open at a time via the shared name. */}
        <div className="space-y-4">
          {FAQ_ITEMS.map((item, idx) => (
            <details
              key={item.question}
              name="faq"
              open={idx === 0}
              className="group bg-[#FFFFFF] border border-[#E2DFD7] shadow-sharp-sand"
            >
              <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer p-6 flex items-center justify-between gap-4 font-sans text-sm sm:text-base text-[#111316] font-semibold tracking-tight">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#E57E25] font-sans font-bold">0{idx + 1}</span>
                  <span>{item.question}</span>
                </div>
                <div className="p-1 border border-[#E2DFD7] text-[#111316]">
                  <Plus className="w-3.5 h-3.5 group-open:hidden" />
                  <Minus className="w-3.5 h-3.5 hidden group-open:block" />
                </div>
              </summary>

              <div className="border-t border-[#E2DFD7] bg-[#FAF9F6]/50 p-6 text-xs sm:text-sm text-[#5A5D64] leading-relaxed font-sans">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
