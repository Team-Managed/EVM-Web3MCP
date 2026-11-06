"use client";

import React, { useState } from "react";
import { FAQ_ITEMS } from "@/lib/data";
import { Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-24 bg-[#FAF9F6] border-b border-[#E2DFD7]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <div className="inline-flex items-center gap-2 font-mono text-xs text-[#E57E25] uppercase tracking-widest mb-3">
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

        {/* Sharp Accordion in Refined 2-Color Palette */}
        <div className="space-y-4">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div
                key={item.question}
                className="bg-[#FFFFFF] border border-[#E2DFD7] shadow-sharp-sand"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full text-left p-6 flex items-center justify-between gap-4 font-mono text-sm sm:text-base text-[#111316] font-semibold"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#E57E25] font-mono">0{idx + 1}</span>
                    <span>{item.question}</span>
                  </div>
                  <div className="p-1 border border-[#E2DFD7] text-[#111316]">
                    {isOpen ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-[#E2DFD7] bg-[#FAF9F6]/50"
                    >
                      <div className="p-6 text-xs sm:text-sm text-[#5A5D64] leading-relaxed font-sans">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
