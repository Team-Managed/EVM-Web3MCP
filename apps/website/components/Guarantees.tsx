import React from "react";
import { GUARANTEES } from "@/lib/data";

export function Guarantees() {
  return (
    <section id="guarantees" className="py-24 bg-[#FAF9F6] border-b border-[#E2DFD7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-14">
          <div className="flex items-center gap-2 font-mono text-xs text-[#E57E25] uppercase tracking-widest mb-3">
            <span className="w-2.5 h-2.5 bg-[#E57E25]" />
            <span>Guarantees</span>
          </div>
          <h2 className="font-editorial text-4xl sm:text-6xl text-[#111316] font-normal tracking-tight mb-4 leading-[1.08]">
            Security Invariants By Design.
          </h2>
          <p className="max-w-2xl text-sm sm:text-base text-[#5A5D64] leading-relaxed">
            Engineered for Ethereum mainnet standards. Zero shortcuts, zero centralized trust.
          </p>
        </div>

        {/* 6-Card Sharp Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {GUARANTEES.map((card) => (
            <div
              key={card.title}
              className="bg-[#FFFFFF] border border-[#E2DFD7] p-7 flex flex-col justify-between shadow-sharp-sand hover:border-[#16181B] transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E2DFD7]">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#5A5D64]">
                    {card.tag}
                  </span>
                  <div className="w-2 h-2 bg-[#16181B]" />
                </div>
                <h3 className="font-editorial text-2xl text-[#111316] mb-2 font-normal">
                  {card.title}
                </h3>
                <p className="text-xs text-[#5A5D64] leading-relaxed font-sans mb-6">
                  {card.description}
                </p>
              </div>
              <div className="font-mono text-[10px] text-[#5A5D64] pt-3 border-t border-[#E2DFD7]">
                Ref: {card.specReference}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
