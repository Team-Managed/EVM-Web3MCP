"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Github } from "lucide-react";
import { HeroRibbonWave } from "./HeroRibbonWave";
import { Logo } from "./Logo";

/**
 * Editorial Footer with Subtle Moving 3D Ribbon Wave Background
 * - Shares the Hero 3D ASCII & Bayer dithering ribbon wave with gentle, slow drift (speed=0.12)
 * - Soft atmospheric diffusion for 100% text and action clarity
 * - Same on both Home and Documentation pages
 */
export function Footer() {
  return (
    <footer className="relative border-t border-[#E2DFD7] bg-[#FAF9F6] font-sans overflow-hidden select-none bg-grain">
      {/* 1. Moving 3D Wave Ribbon (Gentle Slow Drift) */}
      <HeroRibbonWave speed={0.12} />

      {/* 2. Soft atmospheric radial diffusion to guarantee high-contrast legibility */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(250, 249, 246, 0.93) 0%, rgba(250, 249, 246, 0.78) 60%, rgba(250, 249, 246, 0.45) 100%)",
        }}
      />

      <div className="relative z-20 mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="flex flex-col gap-6 border-b border-[#E2DFD7] pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2.5 text-[#111316]">
              <Logo size={34} />
              <span className="font-editorial text-2xl sm:text-3xl font-normal tracking-tight">
                Web3MCP
              </span>
            </div>
            <p className="mt-2 max-w-sm text-xs sm:text-sm leading-relaxed text-[#5A5D64]">
              The open EVM standard connecting smart contracts to AI agent tools.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="/#choose-path"
              className="inline-flex items-center gap-2 bg-[#16181B] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#E57E25]"
            >
              Use our plugins <ArrowRight className="h-3.5 w-3.5" />
            </a>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 border border-[#16181B] bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#111316] transition-colors hover:bg-[#F4EEDF]"
            >
              Documentation <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
        <div className="flex flex-col gap-3 pt-5 text-xs text-[#7A7E87] sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Web3MCP Standard</span>
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
              GitHub <Github className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
