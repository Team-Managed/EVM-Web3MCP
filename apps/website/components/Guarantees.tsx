"use client";

import React from "react";
import {
  Lock,
  Cpu,
  Globe,
  ShieldCheck,
  ArrowUpRight,
  Check,
} from "lucide-react";

interface InvariantItem {
  id: string;
  name: string;
  rule: string;
  description: string;
  badge: string;
  badgeColor: string;
}

const CLEAN_INVARIANTS: InvariantItem[] = [
  {
    id: "custody",
    name: "Zero Key Custody",
    rule: "Local Wallet Boundary",
    description:
      "Private keys never touch agent memory. All state-changing transactions bridge to your local browser for wallet approval.",
    badge: "Your Wallet",
    badgeColor: "bg-[#FDF2E7] text-[#C96716] border-[#FCEBD9]",
  },
  {
    id: "simulation",
    name: "Simulated Before Signing",
    rule: "Pre-Flight Simulation",
    description:
      "Every write is simulated via eth_simulateV1 before you are asked to sign, showing the exact token inflows, outflows, and gas.",
    badge: "eth_simulateV1",
    badgeColor: "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]",
  },
  {
    id: "ens",
    name: "ENS Source of Truth",
    rule: "Decentralized Registry",
    description:
      "Manifests live on-chain in the protocol's ENS text records, checked against a keccak256 digest stored beside them.",
    badge: "Owner-Verified",
    badgeColor: "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]",
  },
  {
    id: "fail-closed",
    name: "Fail-Closed Boundary",
    rule: "Zero-Trust Schema Validation",
    description:
      "Malformed manifests, function signatures that don't match the contract, or contract code that changed since discovery halt execution before you are asked to sign.",
    badge: "Fail-Closed",
    badgeColor: "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]",
  },
];

/**
 * Clean, High-End Security Invariants Table
 * - Placed after Integrations (ChoosePath)
 * - Minimal, non-cluttered 3-column layout (Invariant, Rule & Description, Verification)
 * - Harmonized with Hero fonts (font-editorial heading, font-sans body, font-mono tags)
 * - Palette: Gallery warm off-white (#FAF9F6), Deep Ink (#111316), Warm Sand border (#E2DFD7)
 */
export function Guarantees() {
  return (
    <section
      id="guarantees"
      className="py-20 sm:py-28 bg-[#FAF9F6] border-b border-[#E2DFD7]"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 font-sans text-xs uppercase tracking-widest text-[#E57E25] font-semibold mb-3">
            <span className="w-2.5 h-2.5 bg-[#E57E25]" />
            <span>Security Invariants</span>
          </div>

          <h2 className="font-editorial text-3xl sm:text-5xl text-[#111316] font-normal tracking-tight mb-3 leading-tight">
            Security Invariants By Design.
          </h2>

          <p className="max-w-xl mx-auto text-sm sm:text-base text-[#5A5D64] leading-relaxed font-sans">
            Core protocol guarantees enforced mechanically at every execution step.
          </p>
        </div>

        {/* Clean Modern Table Container */}
        <div className="bg-[#FFFFFF] border border-[#E2DFD7] rounded-2xl shadow-sm overflow-hidden">
          
          {/* Header Row */}
          <div className="hidden sm:grid grid-cols-12 gap-4 px-6 sm:px-8 py-3.5 bg-[#FAF9F6] border-b border-[#E2DFD7] text-[11px] font-sans font-bold uppercase tracking-wider text-[#5A5D64]">
            <div className="col-span-4">Invariant</div>
            <div className="col-span-6">Mechanical Guarantee</div>
            <div className="col-span-2 text-right">Verification</div>
          </div>

          {/* Table Rows with Alternating Row Colors */}
          <div className="divide-y divide-[#E2DFD7]">
            {CLEAN_INVARIANTS.map((item, index) => (
              <div
                key={item.id}
                className={`grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 px-6 sm:px-8 py-5 items-center transition-colors ${
                  index % 2 === 1 ? "bg-[#FAF8F4]" : "bg-[#FFFFFF]"
                } hover:bg-[#F4EEDF]/50`}
              >
                {/* Column 1: Invariant Title */}
                <div className="sm:col-span-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-sans font-bold text-base text-[#111316] tracking-tight">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-[11px] font-sans text-[#5A5D64] block">
                    {item.rule}
                  </span>
                </div>

                {/* Column 2: Concise Description */}
                <div className="sm:col-span-6">
                  <p className="font-sans text-xs sm:text-sm text-[#5A5D64] leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Column 3: Verification Badge (Clean Text) */}
                <div className="sm:col-span-2 flex sm:justify-end items-center pt-2 sm:pt-0">
                  <span className="font-sans text-xs font-semibold text-[#059669] flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#059669]" />
                    <span>{item.badge}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Clean Footer Strip */}
          <div className="px-6 sm:px-8 py-4 bg-[#FAF9F6] border-t border-[#E2DFD7] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-sans text-[#5A5D64]">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#059669]" />
              <span>Zero-custody standard verified across all client adapters</span>
            </span>

            <a
              href="https://github.com/Team-Managed/EVM-Web3MCP/blob/main/spec/SPEC.md"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-[#111316] hover:text-[#E57E25] transition-colors"
            >
              <span>Read Full Specification</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>

      </div>
    </section>
  );
}
