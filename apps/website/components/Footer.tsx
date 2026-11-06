"use client";

import React from "react";
import { ArrowRight, ArrowUpRight, Github, FileText, ShieldCheck, Cpu } from "lucide-react";
import { HeroRibbonWave } from "./HeroRibbonWave";

/**
 * Client-facing Narrow Footer sharing the exact Hero section design:
 * - Narrow, elegant vertical footprint (compact height, balanced proportions)
 * - Gallery paper canvas (#FAF9F6) with subtle grain and sharp top border
 * - Sweeping 3D ASCII & Bayer Dithering Wave ribbon across the canvas
 * - Libre Baskerville editorial closing header & Helvetica Neue navigation
 * - Sharp rectangular CTA buttons and fail-closed protocol guarantees
 */
export function Footer() {
  return (
    <footer className="relative pt-12 pb-10 bg-[#FAF9F6] border-t border-[#E2DFD7] overflow-hidden select-none bg-grain">
      {/* 1. Dynamic 3D Wave Ribbon rendered with ASCII Art & Bayer Dithering */}
      <HeroRibbonWave />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        {/* 2. Narrow Sleek Closing Header Strip */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-[#E2DFD7] relative">
          {/* Subtle atmospheric radial diffusion behind text */}
          <div
            className="absolute -inset-x-8 -inset-y-4 pointer-events-none -z-10"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(250, 249, 246, 0.90) 0%, rgba(250, 249, 246, 0.6) 60%, rgba(250, 249, 246, 0) 85%)",
            }}
          />

          <div>
            <div className="inline-flex items-center gap-2 mb-2 font-sans text-[11px] uppercase tracking-widest text-[#111316] font-semibold select-text">
              <span>Web3MCP Standard • Open EVM Protocol</span>
            </div>
            <h3 className="font-editorial text-2xl sm:text-3xl text-[#111316] font-normal tracking-tight select-text">
              Turn Smart Contracts Into Agent Tools.
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="#offerings"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#16181B] text-[#FAF9F6] text-xs font-sans font-bold uppercase tracking-wider hover:bg-[#333333] transition-colors shadow-sharp-solid"
            >
              <span>Use Our Plugins</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>

            <a
              href="https://github.com/Team-Managed/EVM-Web3MCP/blob/main/spec/SPEC.md"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#FFFFFF] text-xs font-sans font-bold uppercase tracking-wider text-[#111316] border border-[#16181B] hover:bg-[#F4EEDF] transition-colors shadow-sharp-sand"
            >
              <span>Read Our Documentation</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* 3. Compact Editorial Footer Directory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-8 border-b border-[#E2DFD7]">
          {/* Brand & Mission */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center">
              <span className="font-sans text-lg font-bold tracking-tight text-[#111316]">Web3MCP</span>
            </div>
            <p className="max-w-md text-xs text-[#5A5D64] leading-relaxed font-sans">
              The open protocol connecting EVM smart contracts with AI assistants. Built for ETHGlobal Mumbai 2026.
            </p>
            <div className="font-sans text-xs text-[#5A5D64] space-x-2 font-medium">
              <span>MIT Licensed</span>
              <span>•</span>
              <span>Zero Key Custody</span>
              <span>•</span>
              <span>ENS Native</span>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-sans text-xs uppercase tracking-wider text-[#111316] mb-3 font-bold">
              Resources
            </h4>
            <ul className="space-y-2 text-xs font-sans text-[#5A5D64]">
              <li>
                <a
                  href="https://github.com/Team-Managed/EVM-Web3MCP/blob/main/spec/SPEC.md"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#111316] transition-colors flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-[#111316]" />
                  <span>Protocol Spec</span>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/Team-Managed/EVM-Web3MCP"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#111316] transition-colors flex items-center gap-1.5"
                >
                  <Github className="w-3.5 h-3.5 text-[#111316]" />
                  <span>GitHub Repository</span>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/Team-Managed/Solana-Web3MCP"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#111316] transition-colors flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-[#111316]" />
                  <span>Solana Sibling</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Architecture Boundaries & Security */}
          <div>
            <h4 className="font-sans text-xs uppercase tracking-wider text-[#111316] mb-3 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Security Boundaries</span>
            </h4>
            <p className="text-xs text-[#5A5D64] leading-relaxed font-sans mb-2">
              The LLM never signs and never sees a private key. Manifests are verified on-chain against ENS digests.
            </p>
            <div className="font-sans text-[11px] font-bold text-[#D97706] uppercase tracking-wide">
              Fail-Closed Security Model
            </div>
          </div>
        </div>

        {/* 4. Bottom Attribution Strip */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans text-[#7A7E87]">
          <div>
            © 2026 Web3MCP Standard. Team Managed.
          </div>
          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-[#111316]" />
            <span>Built with Foundry, Viem, Next.js & Anthropic MCP</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
