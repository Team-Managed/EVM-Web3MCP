"use client";

import React from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { HeroRibbonWave } from "./HeroRibbonWave";

/**
 * Centric Handhold-Inspired Hero Section:
 * - Fits 100% of the viewport (min-h-[calc(100dvh-4rem)]) below the navbar
 * - Vertically and horizontally centered content
 * - Solid deep ink (#111316) Libre Baskerville typography with tight tracking & leading
 * - Animated 3D ASCII & Bayer dithering ribbon wave field across the canvas
 */
export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center pt-28 pb-16 sm:pt-32 sm:pb-20 bg-[#FAF9F6] border-b border-[#E2DFD7] overflow-hidden select-none bg-grain">
      {/* 1. Dynamic 3D Wave Ribbon rendered with ASCII Art & Bayer Dithering */}
      <HeroRibbonWave />

      {/* 2. Centric Hero Content (Solid #111316 Deep Ink, z-20, 100% Solid Opacity) */}
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center z-20 my-auto">
        {/* Soft atmospheric radial gradient behind central typography to maintain poster legibility */}
        <div
          className="absolute -inset-x-12 -inset-y-8 pointer-events-none -z-10"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(250, 249, 246, 0.90) 0%, rgba(250, 249, 246, 0.6) 55%, rgba(250, 249, 246, 0) 80%)",
          }}
        />

        {/* Minimal Centered Eyebrow */}
        <div className="inline-flex items-center gap-2 mb-5 sm:mb-6 font-sans text-xs uppercase tracking-widest text-[#111316] font-semibold select-text">
          <span className="h-2.5 w-2.5 rotate-45 bg-[#E57E25]" aria-hidden="true" />
          <span>Web3MCP Protocol • Open Standard for EVM</span>
        </div>

        {/* Centric Hero Headline matching Handhold Billboard Typography */}
        <h1
          className="font-editorial text-4xl sm:text-6xl lg:text-[76px] xl:text-[84px] font-normal tracking-[-0.02em] leading-[1.08] mb-5 sm:mb-6 select-text"
          style={{ color: "#111316", opacity: 1 }}
        >
          Bring Your Protocol <br />
          Into The Agent Era.
        </h1>

        {/* Centric Editorial Subtitle - Font Sans matching Subtitle */}
        <p
          className="max-w-2xl mx-auto text-sm sm:text-base lg:text-lg leading-relaxed font-sans font-normal tracking-tight mb-6 sm:mb-8 select-text"
          style={{ color: "#16181B", opacity: 1 }}
        >
          An open standard for EVM protocols to publish verifiable tool manifests under their ENS name. Agents read contracts and simulate state diffs; users sign in their own wallet. Zero custom servers. Zero key custody.
        </p>

        {/* Centered Actions - Sharp Rectangular Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6 sm:mb-8">
          <a
            href="#how-it-works"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#16181B] text-[#FAF9F6] text-xs font-sans font-bold uppercase tracking-wider hover:bg-[#333333] transition-colors shadow-sharp-solid"
          >
            <span>See How It Works</span>
            <ArrowRight className="w-4 h-4" />
          </a>

          <a
            href="https://github.com/Team-Managed/EVM-Web3MCP/blob/main/spec/SPEC.md"
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-3.5 bg-[#FFFFFF] text-xs font-sans font-bold uppercase tracking-wider text-[#111316] border border-[#16181B] hover:bg-[#F4EEDF] transition-colors shadow-sharp-sand"
          >
            <span>Read Our Documentation</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Centered Spec Details */}
        <div className="inline-flex items-center gap-2 font-sans text-xs select-text" style={{ color: "#16181B" }}>
          <span className="font-sans text-[#111316] font-semibold">Open Source Standard</span>
          <span className="text-[#5A5D64] font-medium">• Node 22+ & TypeScript • Zero Key Custody</span>
        </div>
      </div>
    </section>
  );
}
