"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-[#E2DFD7] bg-[#FAF9F6] font-sans">
      <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        <div className="flex flex-col gap-8 border-b border-[#E2DFD7] pb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="font-editorial text-3xl font-normal tracking-tight text-[#111316]">Web3MCP</span>
            <p className="mt-2 max-w-sm text-sm leading-6 text-[#5A5D64]">The open EVM standard connecting smart contracts to AI agent tools.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="#offerings" className="inline-flex items-center gap-2 bg-[#16181B] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#E57E25]">Use our plugins <ArrowRight className="h-3.5 w-3.5" /></a>
            <Link href="/docs" className="inline-flex items-center gap-2 border border-[#16181B] bg-white px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#111316] transition-colors hover:bg-[#F4EEDF]">Documentation <ArrowUpRight className="h-3.5 w-3.5" /></Link>
          </div>
        </div>
        <div className="flex flex-col gap-4 pt-6 text-xs text-[#7A7E87] sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Web3MCP Standard</span>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/docs#guarantees" className="transition-colors hover:text-[#111316]">Security invariants</Link>
            <a href="https://github.com/Team-Managed/EVM-Web3MCP" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 transition-colors hover:text-[#111316]">GitHub <Github className="h-3.5 w-3.5" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
