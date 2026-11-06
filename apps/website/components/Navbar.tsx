"use client";

import React, { useState } from "react";
import Link from "next/link";
import { NAV_ITEMS } from "@/lib/data";
import { Menu, X, ArrowUpRight, Github } from "lucide-react";

/**
 * Floating Black Pill Navbar
 * - Obsidian black acrylic (bg-[#111316]/95 backdrop-blur-xl)
 * - Curved pill borders (rounded-full)
 * - Floating centered dock that doesn't span the entire square width
 * - High-contrast white typography and crisp micro-accents
 */
export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="sticky top-4 z-50 px-4 sm:px-6 w-full flex flex-col items-center pointer-events-none">
      <header className="pointer-events-auto w-full max-w-5xl bg-[#111316]/95 backdrop-blur-xl border border-white/10 rounded-full px-5 sm:px-6 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.35)] transition-all duration-200">
        <div className="flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center group">
            <span className="font-sans font-bold tracking-tight text-base sm:text-lg text-[#FAF9F6]">
              Web3MCP
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-xs uppercase tracking-wider font-sans font-medium text-[#A0A4AE] hover:text-[#FFFFFF] transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="https://github.com/Team-Managed/EVM-Web3MCP"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-full border border-white/15 bg-white/5 text-white/80 hover:text-white hover:bg-white/15 transition-colors"
              title="GitHub Repository"
            >
              <Github className="w-4 h-4" />
            </a>
            <a
              href="/docs"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FFFFFF] text-[#111316] text-xs font-sans font-bold uppercase tracking-wider hover:bg-[#FAF9F6] transition-all shadow-sm"
            >
              <span>Documentation</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full border border-white/15 text-white bg-white/10"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Floating Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="pointer-events-auto mt-2 w-full max-w-5xl rounded-3xl bg-[#111316]/95 backdrop-blur-2xl border border-white/10 p-5 space-y-3 shadow-2xl md:hidden">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs uppercase tracking-wider font-sans font-medium py-2 text-[#FAF9F6] border-b border-white/10 hover:text-white"
            >
              {item.label}
            </a>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            <a
              href="/docs"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center px-4 py-2.5 rounded-full bg-[#FFFFFF] text-[#111316] text-xs font-sans font-bold uppercase tracking-wider"
            >
              Protocol Spec
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
