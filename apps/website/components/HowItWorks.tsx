"use client";

import React from "react";
import { ShieldCheck, Check, ArrowDown, PenLine, FileText } from "lucide-react";

/**
 * Cohesive 3-Card Cascading "How It Works" Section
 * - Typography strictly matched to Web3MCP design system:
 *   - Headings: font-editorial (Libre Baskerville / Newsreader)
 *   - Body & labels: font-sans (Helvetica Neue)
 *   - Technical data, addresses & digests: font-mono (JetBrains Mono)
 * - Color progression matched to website gallery cream & hero wave:
 *   - Card 01: #F4EEDF (Warm Sand / Paper)
 *   - Card 02: #EAF1F8 (Soft Ice Azure)
 *   - Card 03: #DCE7F5 (Refined Slate Azure)
 *   - Micro-UI widgets: Crisp #FFFFFF with #E2DFD7 borders & sharp offset shadows
 */
export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="py-24 sm:py-32 bg-[#FAF9F6] border-b border-[#E2DFD7] overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#E57E25] font-semibold mb-3">
            <span className="w-2.5 h-2.5 bg-[#E57E25]" />
            <span>How It Works</span>
          </div>

          <h2 className="font-editorial text-4xl sm:text-6xl text-[#111316] font-normal tracking-tight mb-4 leading-[1.08]">
            Bring your protocol to AI agents in three easy steps
          </h2>

          <p className="max-w-xl mx-auto text-sm sm:text-base text-[#5A5D64] leading-relaxed font-sans">
            From ENS text-record publication to live simulation and human wallet approval.
          </p>
        </div>

        {/* 3-Card Cascading Grid with Vertical Offsets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start pb-12 md:pb-28">
          
          {/* ================================================================ */}
          {/* CARD 01: Publish via ENS (Warm Sand / Gallery Paper #F4EEDF)      */}
          {/* ================================================================ */}
          <div className="relative rounded-2xl p-7 sm:p-8 flex flex-col justify-between transition-all border border-[#E2DFD7] shadow-sharp-sand bg-[#F4EEDF] translate-y-0 min-h-[500px]">
            {/* Top Right Step Number */}
            <div className="absolute top-6 right-6 font-mono font-bold text-sm text-[#111316]">
              01
            </div>

            {/* Step Header & Description */}
            <div className="pr-10">
              <h3 className="font-editorial text-2xl sm:text-[26px] font-normal text-[#111316] mb-3 leading-snug">
                Publish via ENS.
              </h3>
              <p className="font-sans text-xs sm:text-sm text-[#5A5D64] leading-relaxed">
                Write your tool manifest into text records on your own ENS name. With ENSv2, a release key can update the tools and nothing else on the name. No servers to run.
              </p>
            </div>

            {/* Product Micro-UI: ENS Record & Manifest Inspection */}
            <div className="mt-8 bg-[#FFFFFF] rounded-xl p-4 border border-[#E2DFD7] shadow-2xs font-sans text-xs">
              {/* Domain Bar */}
              <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[#E2DFD7]">
                <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-[#111316]">
                  <FileText className="w-3.5 h-3.5 text-[#E57E25]" />
                  <span>agentswap.web3mcp.eth</span>
                </div>
                <span className="font-mono text-[11px] font-semibold text-[#059669]">
                  ● Owner-verified
                </span>
              </div>

              {/* Text Record Fields */}
              <div className="space-y-2 font-mono text-[11px]">
                <div className="bg-[#FAF9F6] p-2.5 rounded-lg border border-[#E2DFD7]">
                  <span className="text-[#7A7E87] block text-[10px] uppercase font-sans font-semibold mb-0.5">
                    org.web3mcp.manifest
                  </span>
                  <span className="text-[#111316] font-medium block truncate">
                    {'{"web3mcp":"0.1-evm","chainId":11155111,"tools":[…]}'}
                  </span>
                </div>

                <div className="bg-[#FAF9F6] p-2.5 rounded-lg border border-[#E2DFD7] flex items-center justify-between">
                  <div>
                    <span className="text-[#7A7E87] block text-[10px] uppercase font-sans font-semibold mb-0.5">
                      Digest (keccak256)
                    </span>
                    <span className="text-[#111316] font-medium">0x49bd...698f</span>
                  </div>
                  <span className="text-[10px] font-sans font-bold text-[#059669]">✓ Validated</span>
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* CARD 02: Discover & Simulate (Soft Ice Azure #EAF1F8)             */}
          {/* ================================================================ */}
          <div className="relative rounded-2xl p-7 sm:p-8 flex flex-col justify-between transition-all border border-[#D0DFEF] shadow-sharp-sand bg-[#EAF1F8] md:translate-y-8 lg:translate-y-10 min-h-[500px]">
            {/* Top Right Step Number */}
            <div className="absolute top-6 right-6 font-mono font-bold text-sm text-[#111316]">
              02
            </div>

            {/* Step Header & Description */}
            <div className="pr-10">
              <h3 className="font-editorial text-2xl sm:text-[26px] font-normal text-[#111316] mb-3 leading-snug">
                Discover & simulate.
              </h3>
              <p className="font-sans text-xs sm:text-sm text-[#5A5D64] leading-relaxed">
                The plugin resolves protocols from ENS, queries live on-chain state via gasless eth_call, and simulates every write with eth_simulateV1 to show the exact balance changes.
              </p>
            </div>

            {/* Product Micro-UI: Live Pre-Flight Simulation & Balance Deltas */}
            <div className="mt-8 bg-[#FFFFFF] rounded-xl p-4 border border-[#E2DFD7] shadow-2xs font-sans text-xs">
              {/* Simulation Status Bar */}
              <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[#E2DFD7]">
                <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-[#111316]">
                  <span className="w-1.5 h-1.5 bg-[#059669]" />
                  <span>eth_simulateV1</span>
                </div>
                <span className="font-mono text-[11px] font-semibold text-[#059669]">
                  ● Ready to sign
                </span>
              </div>

              {/* Exact Balance Deltas Preview (From approve-ui) */}
              <div className="bg-[#FAF9F6] p-2.5 rounded-lg border border-[#E2DFD7] mb-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#5A5D64] font-medium font-sans">ETH Balance</span>
                  <span className="font-mono font-bold text-[#E11D48]">-0.05 ETH</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#5A5D64] font-medium font-sans">USDC Balance</span>
                  <span className="font-mono font-bold text-[#059669]">+110.42 USDC</span>
                </div>
              </div>

              {/* Safety Checks */}
              <div className="space-y-1 text-[10px] text-[#5A5D64] font-sans">
                <div className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-[#059669] shrink-0" />
                  <span>Simulation ran with 0 errors</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-[#059669] shrink-0" />
                  <span>Oracle price within 3% tolerance</span>
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* CARD 03: Approve in Wallet (Refined Slate Azure #DCE7F5)          */}
          {/* ================================================================ */}
          <div className="relative rounded-2xl p-7 sm:p-8 flex flex-col justify-between transition-all border border-[#BACFE8] shadow-sharp-sand bg-[#DCE7F5] md:translate-y-16 lg:translate-y-20 min-h-[500px]">
            {/* Top Right Step Number */}
            <div className="absolute top-6 right-6 font-mono font-bold text-sm text-[#111316]">
              03
            </div>

            {/* Step Header & Description */}
            <div className="pr-10">
              <h3 className="font-editorial text-2xl sm:text-[26px] font-normal text-[#111316] mb-3 leading-snug">
                Approve in your wallet.
              </h3>
              <p className="font-sans text-xs sm:text-sm text-[#5A5D64] leading-relaxed">
                Transactions bridge to a local signing page. The user inspects decoded function calls and simulated token deltas, then signs in their own browser wallet, such as MetaMask or Rabby. Zero key custody.
              </p>
            </div>

            {/* Product Micro-UI: Execution Node & Signing Page Action Bar */}
            <div className="mt-8 bg-[#FFFFFF] rounded-xl p-4 border border-[#E2DFD7] shadow-2xs font-sans text-xs">
              {/* Mini Pipeline Flow */}
              <div className="bg-[#FAF9F6] p-2.5 rounded-lg border border-[#E2DFD7] mb-3 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-[#111316]">Your Wallet</span>
                  <span className="font-mono text-[10px] text-[#7A7E87]">0x9923...2ECb</span>
                </div>
                <div className="flex items-center justify-center gap-1 text-[10px] font-mono text-[#2563EB] font-bold">
                  <ArrowDown className="w-3 h-3 text-[#2563EB]" />
                  <span>Sends 0.05 ETH</span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#E2DFD7]">
                  <span className="font-semibold text-[#111316]">You receive</span>
                  <span className="font-mono text-[10px] text-[#059669] font-bold">+110.42 USDC</span>
                </div>
              </div>

              {/* Wallet Signing Bar */}
              <div className="pt-2 border-t border-[#E2DFD7] flex items-center justify-between gap-2">
                <span className="text-[10px] font-medium text-[#5A5D64] truncate font-sans">
                  MetaMask • Sepolia
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="px-2 py-1 bg-[#FAF9F6] border border-[#E2DFD7] text-[#5A5D64] text-[10px] font-medium rounded hover:bg-[#F4EEDF] select-none cursor-default">
                    Reject
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#111316] text-[#FAF9F6] text-[10px] font-sans font-bold uppercase tracking-wider rounded select-none cursor-default shadow-sharp-solid">
                    <PenLine className="w-2.5 h-2.5" />
                    <span>Sign</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
