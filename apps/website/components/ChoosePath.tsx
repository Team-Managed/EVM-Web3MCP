"use client";

import React from "react";
import {
  ArrowRight,
  Bot,
  Code2,
  Terminal,
  ShieldCheck,
  Wallet,
  CheckCircle2,
  PenLine,
  Search,
} from "lucide-react";
import { BrandLogo, BrandSticker } from "./BrandSticker";

/**
 * Bento Grid Integrations Segment:
 * - Harmonized with Hero background colors & typography:
 *   - Main section title: font-editorial (Libre Baskerville)
 *   - Card titles: font-sans font-bold (Helvetica Neue, modern geometric)
 *   - Palette: Deep Cobalt-Azure gradient (#1E3A8A to #2563EB) matching hero ribbon wave,
 *              Warm Sand (#FAF9F6), Golden Amber (#E57E25), Soft Ice Azure (#EAF1F8)
 * - 12-Column Asymmetric Bento Grid (7+5 top row, 5+7 bottom row)
 * - Retains anchor id="choose-path" for navbar navigation
 */
export function ChoosePath() {
  return (
    <section
      id="choose-path"
      className="py-24 sm:py-32 bg-[#FAF9F6] border-b border-[#E2DFD7] overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#E57E25] font-semibold mb-3">
            <span className="w-2.5 h-2.5 bg-[#E57E25]" />
            <span>Integrations & Ecosystem</span>
          </div>

          <h2 className="font-editorial text-4xl sm:text-6xl text-[#111316] font-normal tracking-tight mb-4 leading-[1.08]">
            Seamless bridges for protocols, agents, and human signers.
          </h2>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-[#5A5D64] leading-relaxed font-sans">
            Zero-overhead ENS discovery, instant MCP plugins for Claude Code & Codex, and air-gapped wallet execution.
          </p>
        </div>

        {/* 12-Column Asymmetric Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          
          {/* ================================================================= */}
          {/* TILE 1: Claude Code Plugin (Cobalt-Azure Gradient Accent Card)    */}
          {/* ================================================================= */}
          <div className="lg:col-span-7 bg-gradient-to-br from-[#1E3A8A] via-[#1D4ED8] to-[#2563EB] text-white rounded-3xl p-7 sm:p-8 flex flex-col justify-between shadow-md relative overflow-hidden min-h-[420px] border border-blue-400/20">
            <div className="pointer-events-none absolute -right-16 top-1/2 hidden -translate-y-1/2 opacity-90 sm:block"><BrandLogo brand="claude" size="hero" /></div>
            <div>
              {/* Top Label Strip (Clean Text, No Pills) */}
              <div className="flex items-center justify-between gap-3 mb-6 font-mono text-xs uppercase tracking-wider font-semibold">
                <div className="flex items-center gap-2 text-white">
                  <Bot className="w-4 h-4 text-white" />
                  <span>Claude Code</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-300">
                  <BrandSticker brand="claude" compact />
                  <span className="w-1.5 h-1.5 bg-emerald-400" />
                  <span>Marketplace Live</span>
                </div>
              </div>

              {/* Title & Copy */}
              <h3 className="font-sans font-bold text-2xl sm:text-3xl mb-3 text-white tracking-tight leading-snug">
                Equip Claude with Real EVM Execution.
              </h3>
              <p className="font-sans text-xs sm:text-sm text-blue-100 leading-relaxed max-w-xl">
                Install the official Web3MCP plugin in seconds. Claude resolves ENS manifests, executes gasless view calls, and triggers write simulations directly from your chat prompt.
              </p>

              {/* Product Micro-UI: Interactive Claude Terminal */}
              <div className="mt-6 bg-[#0B0F19] rounded-2xl p-4 border border-white/10 text-xs font-mono shadow-inner space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-white/10 text-neutral-400 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-[#EF4444]" />
                    <span className="w-2.5 h-2.5 bg-[#F59E0B]" />
                    <span className="w-2.5 h-2.5 bg-[#10B981]" />
                    <span className="ml-1 text-white/60">terminal — claude</span>
                  </div>
                  <span className="text-emerald-400 font-semibold">● plugin active</span>
                </div>

                <div className="text-[#93C5FD] font-mono text-[11px] sm:text-xs">
                  <span className="text-white/40">$ </span>/plugin install web3mcp@evm-web3mcp
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-[11px] space-y-1.5">
                  <div className="flex items-center justify-between text-emerald-400">
                    <span className="font-semibold">✓ Discovered Tool:</span>
                    <span className="text-neutral-300 font-mono">agentswap.web3mcp.eth</span>
                  </div>
                  <div className="text-neutral-300 font-mono text-[10.5px]">
                    <code>exactInputSingle(tokenIn, tokenOut, amountIn)</code>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1 border-t border-white/5">
                    <span>Validation: Schema v0.1-evm OK</span>
                    <span className="text-white font-mono">Simulation Ready</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action CTA */}
            <div className="mt-6 pt-2">
              <a
                href="/docs/latest#plugins"
                className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-white bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-xl border border-white/20 transition-colors shadow-xs"
              >
                <span>Open Installation Guide</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* ================================================================= */}
          {/* TILE 2: Protocol Publishing via ENS                              */}
          {/* ================================================================= */}
          <div className="lg:col-span-5 bg-[#FFFFFF] border border-[#E2DFD7] rounded-3xl p-7 sm:p-8 flex flex-col justify-between shadow-sharp-sand min-h-[420px] relative overflow-hidden">
            <div className="pointer-events-none absolute -right-16 bottom-[-3rem] hidden opacity-75 sm:block"><BrandLogo brand="ens" size="hero" /></div>
            <div>
              {/* Top Label Strip (Clean Text, No Pills) */}
              <div className="flex items-center justify-between gap-3 mb-6 font-mono text-xs uppercase tracking-wider font-semibold">
                <div className="flex items-center gap-2 text-[#059669]">
                  <Code2 className="w-4 h-4" />
                  <span>Protocol Publisher</span>
                </div>
                <div className="flex items-center gap-1 text-[#059669]">
                  <BrandSticker brand="ens" compact />
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>ENSv2 Verified</span>
                </div>
              </div>

              {/* Title & Copy */}
              <h3 className="font-sans font-bold text-2xl sm:text-3xl mb-3 text-[#111316] tracking-tight leading-snug">
                Serverless Smart Contract Tools.
              </h3>
              <p className="font-sans text-xs sm:text-sm text-[#5A5D64] leading-relaxed">
                Publish tool manifests directly under your ENS domain text records. Zero cloud servers to maintain and zero custody risk.
              </p>

              {/* Product Micro-UI: ENS Record Inspection */}
              <div className="mt-6 bg-[#FAF9F6] border border-[#E2DFD7] rounded-2xl p-4 text-xs font-mono space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-[#E2DFD7] text-[11px]">
                  <span className="text-[#5A5D64]">Domain:</span>
                  <span className="font-bold text-[#111316]">agentswap.web3mcp.eth</span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#5A5D64]">Record:</span>
                    <span className="text-[#111316] bg-white px-2 py-0.5 rounded border border-[#E2DFD7] font-semibold">
                      org.web3mcp.manifest
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#5A5D64]">Digest:</span>
                    <span className="text-[#059669] font-semibold">0x7a1c...94dE (keccak256)</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-[#E2DFD7] flex items-center justify-between text-[10px] text-[#5A5D64]">
                  <span>Deployer Key: Non-root</span>
                  <span className="text-emerald-700 font-semibold">
                    ● Owner-Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Action CTA */}
            <div className="mt-6 pt-2">
              <a
                href="https://github.com/Team-Managed/EVM-Web3MCP/blob/main/spec/SPEC.md"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#111316] font-semibold hover:text-[#E57E25] transition-colors"
              >
                <span>Read Manifest Spec</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* ================================================================= */}
          {/* TILE 3: Arkiv Capability Discovery (Full-Width Bridge)           */}
          {/* ================================================================= */}
          <div className="lg:col-span-12 bg-[#F5F3FF] border border-[#DDD6FE] rounded-3xl p-7 sm:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 shadow-sharp-sand relative overflow-hidden">
            <div className="pointer-events-none absolute -right-10 top-1/2 hidden -translate-y-1/2 opacity-35 lg:block"><BrandLogo brand="arkiv" size="hero" /></div>
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-5 font-mono text-xs uppercase tracking-wider font-semibold text-[#6D28D9]">
                <BrandSticker brand="arkiv" compact />
                <Search className="w-4 h-4" />
                <span>Arkiv Capability Discovery</span>
                <span className="ml-2 text-[#8B5CF6]">Optional index</span>
              </div>
              <h3 className="font-sans font-bold text-2xl sm:text-3xl mb-3 text-[#111316] tracking-tight leading-snug">
                Find protocols by what they can do.
              </h3>
              <p className="font-sans text-xs sm:text-sm text-[#5A5D64] leading-relaxed">
                Agents can search Arkiv when a user describes a goal without naming a protocol. The host ranks capability terms, checks the listing&apos;s ENS digest, and runs full discovery before exposing any tool. Publishers refresh their listing every 30 days to stay discoverable.
              </p>
            </div>

            <div className="w-full lg:max-w-md bg-white border border-[#DDD6FE] rounded-2xl p-4 text-xs font-mono space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#EDE9FE] text-[11px]">
                <span className="text-[#6D28D9]">Agent search</span>
                <span className="text-[#059669] font-semibold">ENS verified</span>
              </div>
              <div className="text-[#111316]">&quot;swap ETH for USDC&quot;</div>
              <div className="flex items-center gap-2 text-[10px] text-[#5A5D64]">
                <span className="bg-[#EDE9FE] px-2 py-1 text-[#6D28D9]">swap</span>
                <span className="bg-[#EDE9FE] px-2 py-1 text-[#6D28D9]">eth</span>
                <span className="bg-[#EDE9FE] px-2 py-1 text-[#6D28D9]">usdc</span>
              </div>
              <div className="pt-2 border-t border-[#EDE9FE] flex items-center justify-between text-[10px] text-[#5A5D64]">
                <span>Arkiv → discover → call</span>
                <span className="text-[#059669] font-semibold">digest matches</span>
              </div>
            </div>

            <a
              href="/docs/latest#search"
              className="inline-flex shrink-0 items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#111316] font-semibold hover:text-[#8B5CF6] transition-colors"
            >
              <span>Explore Arkiv Search</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* ================================================================= */}
          {/* TILE 4: OpenAI Codex & Generic MCP Host                           */}
          {/* ================================================================= */}
          <div className="lg:col-span-5 bg-[#FFFFFF] border border-[#E2DFD7] rounded-3xl p-7 sm:p-8 flex flex-col justify-between shadow-sharp-sand min-h-[420px] relative overflow-hidden">
            <div className="pointer-events-none absolute -right-16 bottom-[-3rem] hidden opacity-70 sm:block"><BrandLogo brand="openai" size="hero" /></div>
            <div>
              {/* Top Label Strip (Clean Text, No Pills) */}
              <div className="flex items-center justify-between gap-3 mb-6 font-mono text-xs uppercase tracking-wider font-semibold">
                <div className="flex items-center gap-2 text-[#1D4ED8]">
                  <Terminal className="w-4 h-4" />
                  <span>Open Protocol</span>
                </div>
                <div className="flex items-center gap-2 text-[#5A5D64]"><BrandSticker brand="openai" compact /><span>Universal MCP</span></div>
              </div>

              {/* Title & Copy */}
              <h3 className="font-sans font-bold text-2xl sm:text-3xl mb-3 text-[#111316] tracking-tight leading-snug">
                Standard MCP for Any Agent.
              </h3>
              <p className="font-sans text-xs sm:text-sm text-[#5A5D64] leading-relaxed">
                Connect @web3mcp/mcp to OpenAI Codex, Cursor, Zed, or custom LLM frameworks. Fully compliant with Anthropic Model Context Protocol specifications.
              </p>

              {/* Product Micro-UI: MCP Host Connection Panel */}
              <div className="mt-6 bg-[#FAF9F6] border border-[#E2DFD7] rounded-2xl p-4 text-xs font-mono space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-[#E2DFD7] text-[11px]">
                  <span className="text-[#5A5D64]">Transport:</span>
                  <span className="font-bold text-[#111316]">stdio (JSON-RPC 2.0)</span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#5A5D64]">Server:</span>
                    <span className="text-[#111316] font-semibold">@web3mcp/mcp@0.0.1</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#5A5D64]">Discovery:</span>
                    <span className="text-[#2563EB] font-semibold">tools/list (dynamic)</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-[#E2DFD7] flex items-center justify-between text-[10px] text-[#5A5D64]">
                  <span>Status: Active Bridge</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500" />
                    Listening on stdin
                  </span>
                </div>
              </div>
            </div>

            {/* Action CTA */}
            <div className="mt-6 pt-2">
              <a
                href="/docs/latest#plugins"
                className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#111316] font-semibold hover:text-[#E57E25] transition-colors"
              >
                <span>Configure Codex Server</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* ================================================================= */}
          {/* TILE 5: Air-Gapped Local Wallet Approval (approve-ui)             */}
          {/* ================================================================= */}
          <div className="lg:col-span-7 bg-[#EAF1F8] border border-[#CBD5E1] rounded-3xl p-7 sm:p-8 flex flex-col justify-between shadow-sharp-sand relative overflow-hidden min-h-[420px]">
            <div className="pointer-events-none absolute -right-16 top-1/2 hidden -translate-y-1/2 opacity-65 sm:block"><BrandLogo brand="metamask" size="hero" /></div>
            <div>
              {/* Top Label Strip (Clean Text, No Pills) */}
              <div className="flex items-center justify-between gap-3 mb-6 font-mono text-xs uppercase tracking-wider font-semibold">
                <div className="flex items-center gap-2 text-[#111316]">
                  <Wallet className="w-4 h-4 text-[#E57E25]" />
                  <span>Zero Key Custody</span>
                </div>
                <div className="flex items-center gap-2 text-[#5A5D64]"><BrandSticker brand="metamask" compact /><span>Local Signing Host</span></div>
              </div>

              {/* Title & Copy */}
              <h3 className="font-sans font-bold text-2xl sm:text-3xl mb-3 text-[#111316] tracking-tight leading-snug">
                Human-in-the-Loop Wallet Approval.
              </h3>
              <p className="font-sans text-xs sm:text-sm text-[#5A5D64] leading-relaxed max-w-xl">
                Every state-changing write halts for human inspection on a local signing page. View decoded parameters, simulated token inflows/outflows, and approve in MetaMask.
              </p>

              {/* Product Micro-UI: Floating Simulation & Signing Bar */}
              <div className="mt-6 bg-[#FFFFFF] rounded-2xl p-4 border border-[#CBD5E1] shadow-2xs text-xs font-sans space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#E2DFD7] text-[11px] font-mono">
                  <div className="flex items-center gap-1.5 text-[#059669] font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>eth_simulateV1: 0 Reverts</span>
                  </div>
                  <span className="text-[#5A5D64]">Oracle Check: Within ±0.2%</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2.5 bg-[#FAF9F6] rounded-xl border border-[#E2DFD7]">
                    <span className="text-[#5A5D64] block text-[10px] uppercase">Outflow:</span>
                    <span className="font-bold text-[#DC2626]">0.4210 → 0.3710 (-0.05 ETH)</span>
                  </div>
                  <div className="p-2.5 bg-[#F0FDF4] rounded-xl border border-[#BBF7D0]">
                    <span className="text-[#15803D] block text-[10px] uppercase">Simulated Inflow:</span>
                    <span className="font-bold text-[#15803D]">27.13 → 137.55 (+110.42 USDC)</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E2DFD7] flex items-center justify-between gap-3">
                  <span className="text-[11px] text-[#5A5D64] font-mono hidden sm:inline">
                    localhost:3456/approve
                  </span>
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      className="px-2.5 py-1.5 bg-white border border-[#CBD5E1] text-[#5A5D64] rounded-lg text-[11px] font-semibold hover:bg-neutral-50 transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-[11px] font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      <PenLine className="w-3 h-3" />
                      Sign with MetaMask
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Action CTA */}
            <div className="mt-6 pt-2">
              <a
                href="/docs/latest#guarantees"
                className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#111316] font-semibold hover:text-[#E57E25] transition-colors"
              >
                <span>Inspect approve-ui Architecture</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
