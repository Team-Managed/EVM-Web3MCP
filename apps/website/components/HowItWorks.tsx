"use client";

import React from "react";
import { PROTOCOL_STEPS } from "@/lib/data";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-[#FAF9F6] border-b border-[#E2DFD7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16">
          <div className="flex items-center gap-2 font-mono text-xs text-[#E57E25] uppercase tracking-widest mb-3">
            <span className="w-2.5 h-2.5 bg-[#E57E25]" />
            <span>Architecture & Sequence</span>
          </div>
          <h2 className="font-editorial text-4xl sm:text-6xl text-[#111316] font-normal tracking-tight mb-4 leading-[1.08]">
            How The Protocol Operates.
          </h2>
          <p className="max-w-2xl text-sm sm:text-base text-[#5A5D64] leading-relaxed">
            From ENS text-record publication to pre-flight simulation and human wallet approval.
          </p>
        </div>

        {/* 6-Step Sequential Grid in Refined 2-Color Palette */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PROTOCOL_STEPS.map((step) => (
            <div
              key={step.id}
              className="bg-[#FFFFFF] border border-[#E2DFD7] p-7 flex flex-col justify-between shadow-sharp-sand hover:border-[#16181B] transition-colors"
            >
              <div>
                {/* Step Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E2DFD7]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#111316] px-2 py-0.5 bg-[#FAF9F6] border border-[#E2DFD7]">
                      0{step.step}
                    </span>
                    <span className="font-mono text-[11px] text-[#5A5D64] uppercase">
                      {step.actor}
                    </span>
                  </div>
                  <div className="w-2.5 h-2.5 bg-[#16181B]" />
                </div>

                {/* Step Title & Summary */}
                <h3 className="font-editorial text-2xl text-[#111316] mb-2 font-normal">
                  {step.title}
                </h3>
                <p className="text-xs text-[#5A5D64] leading-relaxed mb-4 font-sans">
                  {step.details}
                </p>
              </div>

              {/* Code Snippet if present */}
              {step.codeSnippet && (
                <div className="mt-4 p-3 bg-[#FAF9F6] border border-[#E2DFD7] font-mono text-[11px] text-[#111316] overflow-x-auto">
                  <code>{step.codeSnippet}</code>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
