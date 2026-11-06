"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Github } from "lucide-react";
import { HeroRibbonWave } from "./HeroRibbonWave";

/**
 * Clean, High-Readability Footer with Hero 3D ASCII Ribbon Wave Background
 * - Shares the exact Hero section background:
 *   - Gallery paper background (#FAF9F6) with subtle grain (bg-grain)
 *   - Dynamic 3D Wave Ribbon rendered with ASCII Art & Bayer Dithering (HeroRibbonWave)
 *   - Soft atmospheric diffusion behind text for 100% crisp legibility
 * - Libre Baskerville editorial closing header & Helvetica Neue navigation
 * - Sharp rectangular CTA buttons linking to plugins and documentation
 */
export function Footer() {
  return (
    <footer className="relative py-20 sm:py-24 bg-[#FAF9F6] border-t border-[#E2DFD7] overflow-hidden select-none bg-grain">
      {/* 1. Dynamic 3D Wave Ribbon rendered with ASCII Art & Bayer Dithering */}
      <HeroRibbonWave />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 text-center">
        {/* Soft atmospheric radial gradient behind central typography to guarantee 100% readability */}
        <div
          className="absolute -inset-x-12 -inset-y-8 pointer-events-none -z-10"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(250, 249, 246, 0.94) 0%, rgba(250, 249, 246, 0.70) 55%, rgba(250, 249, 246, 0) 85%)",
          }}
        />

        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 mb-4 font-sans text-xs uppercase tracking-widest text-[#111316] font-semibold select-text">
          <span className="h-2.5 w-2.5 rotate-45 bg-[#E57E25]" aria-hidden="true" />
          <span>Web3MCP Protocol • Open EVM Standard</span>
        </div>

        {/* Editorial Headline */}
        <h3 className="font-editorial text-3xl sm:text-5xl lg:text-6xl text-[#111316] font-normal tracking-[-0.02em] leading-[1.1] mb-6 sm:mb-8 select-text">
          Turn Smart Contracts Into Agent Tools.
        </h3>

        <p className="max-w-xl mx-auto text-sm sm:text-base text-[#5A5D64] leading-relaxed font-sans mb-8 sm:mb-10 select-text">
          Zero custom servers. Zero key custody. Verified on-chain through ENS.
        </p>

        {/* Essential Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <a
            href="#choose-path"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#16181B] text-[#FAF9F6] text-xs font-sans font-bold uppercase tracking-wider hover:bg-[#333333] transition-colors shadow-sharp-solid"
          >
            <span>Use Our Plugins</span>
            <ArrowRight className="w-4 h-4" />
          </a>

          <Link
            href="/docs"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-3.5 bg-[#FFFFFF] text-xs font-sans font-bold uppercase tracking-wider text-[#111316] border border-[#16181B] hover:bg-[#F4EEDF] transition-colors shadow-sharp-sand"
          >
            <span>Read Our Documentation</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Attribution & Legal Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#E2DFD7] text-xs font-sans text-[#7A7E87]">
          <span>© 2026 Web3MCP Standard • Built for ETHGlobal Mumbai 2026</span>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/docs#guarantees" className="transition-colors hover:text-[#111316]">
              Security invariants
            </Link>
            <a
              href="https://github.com/Team-Managed/EVM-Web3MCP"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-[#111316]"
            >
              GitHub <Github className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
