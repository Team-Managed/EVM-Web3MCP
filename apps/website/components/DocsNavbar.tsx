"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Github } from "lucide-react";
import { Logo } from "./Logo";

export function DocsNavbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E2DFD7] bg-[#FAF9F6]/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5 sm:px-8">
        {/* Brand & Context */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center text-[#111316] transition-opacity hover:opacity-80"
          >
            <Logo size={20} showText />
          </Link>
          <span className="text-[#A0A4AE]">/</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#5A5D64]">Docs</span>
          <span className="inline-flex items-center rounded border border-[#FDE68A] bg-[#FEF3C7] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#92400E]">
            v0.1-evm
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#5A5D64] transition-colors hover:text-[#111316]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Back to website</span>
            <span className="sm:hidden">Home</span>
          </Link>

          <div className="h-4 w-px bg-[#E2DFD7]" />

          <a
            href="https://github.com/Team-Managed/EVM-Web3MCP"
            target="_blank"
            rel="noreferrer"
            className="text-[#5A5D64] transition-colors hover:text-[#111316]"
            title="GitHub Repository"
          >
            <Github className="h-4 w-4" />
          </a>
        </div>
      </div>
    </header>
  );
}
