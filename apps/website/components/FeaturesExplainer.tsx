"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  Bot,
  Cpu,
  Wallet,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

/**
 * Compact Single-Section Horizontal Execution Flow:
 * - Fits completely in one section (no bloated vertical scrolling)
 * - Single generic example: Plain-language intent -> Pre-flight simulation -> Wallet signing
 * - Horizontal pipeline layout (Left to Right) with directional flow connectors
 * - Ready for GSAP scroll/timeline integration (data-gsap attributes & clean semantic structure)
 * - Highlights zero key custody, fail-closed ENS verification, and exact balance deltas
 */
export function FeaturesExplainer() {
  const [simulationState, setSimulationState] = useState<"verified" | "simulating">("verified");

  const runReSimulation = () => {
    setSimulationState("simulating");
    setTimeout(() => {
      setSimulationState("verified");
    }, 600);
  };

  return (
    <section
      id="features-explained"
      data-gsap="section"
      className="py-20 bg-[#FAF9F6] border-b border-[#E2DFD7] font-sans"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#E57E25] uppercase tracking-widest mb-3">
              <span className="w-2 h-2 bg-[#E57E25]" />
              <span>Verifiable Agent Architecture</span>
            </div>
            <h2 className="font-editorial text-3xl sm:text-5xl text-[#111316] font-normal tracking-tight leading-tight">
              From Prompt to Proven On-Chain State.
            </h2>
          </div>
          <p className="max-w-md text-xs sm:text-sm text-[#5A5D64] leading-relaxed">
            How smart contracts run as tools. Tool discovery happens via ENS, balance deltas simulate upfront, and the user signs inside their own wallet.
          </p>
        </div>

        {/* Generic Horizontal Flow Container (Fits in One Screen) */}
        <div
          data-gsap="pipeline-card"
          className="bg-[#FFFFFF] border border-[#16181B] shadow-sharp-solid overflow-hidden"
        >
          {/* Top Window Strip */}
          <div className="px-6 py-3.5 bg-[#FAF9F6] border-b border-[#E2DFD7] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-[#111316]">
                protocol.eth
              </span>
              <span className="font-mono text-[11px] font-semibold text-[#059669] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Owner-Verified ENS
              </span>
            </div>

            <div className="flex items-center gap-3 text-[#5A5D64]">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
                Live Pre-Flight Engine
              </span>
              <button
                onClick={runReSimulation}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FFFFFF] border border-[#E2DFD7] hover:border-[#16181B] text-[#111316] text-[11px] font-semibold transition-colors"
                title="Re-run eth_simulateV1"
              >
                <Sparkles className="w-3 h-3 text-[#E57E25]" />
                <span>Simulate</span>
              </button>
            </div>
          </div>

          {/* Horizontal 3-Step Flow: Left to Right */}
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 items-center">
              
              {/* Step 1: Agent Discovery & Intent (Left) */}
              <div
                data-gsap="step-1"
                className="lg:col-span-3 bg-[#FAF9F6] border border-[#E2DFD7] p-5 flex flex-col justify-between min-h-[220px] transition-all hover:border-[#16181B]"
              >
                <div>
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E2DFD7]">
                    <span className="text-[11px] font-bold text-[#E57E25] uppercase tracking-wider">
                      01 // Intent & ENS
                    </span>
                    <Bot className="w-4 h-4 text-[#111316]" />
                  </div>
                  <h3 className="font-editorial text-lg text-[#111316] font-normal mb-1">
                    Agent Discovers Tools
                  </h3>
                  <p className="text-xs text-[#5A5D64] leading-relaxed mb-3">
                    Agent queries ENS text records to resolve tool schemas and bindings without central servers.
                  </p>
                </div>

                <div className="p-2.5 bg-[#FFFFFF] border border-[#E2DFD7] text-[11px] font-mono text-[#111316] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#7A7E87]">Call:</span>
                    <span className="font-semibold">exactInputSingle()</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7A7E87]">Input:</span>
                    <span className="font-semibold text-[#DC2626]">-0.05 ETH</span>
                  </div>
                </div>
              </div>

              {/* Connector 1 (Arrow) */}
              <div className="lg:col-span-1 flex lg:flex-col items-center justify-center py-2 lg:py-0 text-[#16181B]">
                <div className="hidden lg:flex flex-col items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#16181B]" />
                  <div className="w-[1px] h-6 bg-[#CBD5E1]" />
                  <ArrowRight className="w-4 h-4 text-[#16181B]" />
                </div>
                <span className="lg:hidden text-xs font-mono font-semibold">↓</span>
              </div>

              {/* Step 2: Pre-Flight Simulation (Center) */}
              <div
                data-gsap="step-2"
                className="lg:col-span-3 bg-[#FFFFFF] border-2 border-[#16181B] p-5 shadow-sharp-sand flex flex-col justify-between min-h-[220px]"
              >
                <div>
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E2DFD7]">
                    <span className="text-[11px] font-bold text-[#2563EB] uppercase tracking-wider">
                      02 // eth_simulateV1
                    </span>
                    <Cpu className="w-4 h-4 text-[#2563EB]" />
                  </div>
                  <h3 className="font-editorial text-lg text-[#111316] font-normal mb-1">
                    Deterministic Proof
                  </h3>
                  <p className="text-xs text-[#5A5D64] leading-relaxed mb-3">
                    Calculates exact token balance deltas, gas fees, and oracle tolerances before prompt.
                  </p>
                </div>

                <div className="p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] text-[11px] font-mono space-y-1">
                  <div className="flex justify-between text-[#111316]">
                    <span className="text-[#5A5D64]">Delta:</span>
                    <span className="font-bold text-[#059669]">+110.38 USDC</span>
                  </div>
                  <div className="flex justify-between text-[#5A5D64]">
                    <span>Status:</span>
                    <span className="text-[#059669] font-bold">0 Reverts (OK)</span>
                  </div>
                </div>
              </div>

              {/* Connector 2 (Arrow) */}
              <div className="lg:col-span-1 flex lg:flex-col items-center justify-center py-2 lg:py-0 text-[#16181B]">
                <div className="hidden lg:flex flex-col items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#16181B]" />
                  <div className="w-[1px] h-6 bg-[#CBD5E1]" />
                  <ArrowRight className="w-4 h-4 text-[#16181B]" />
                </div>
                <span className="lg:hidden text-xs font-mono font-semibold">↓</span>
              </div>

              {/* Step 3: Air-Gapped Signature (Right) */}
              <div
                data-gsap="step-3"
                className="lg:col-span-3 bg-[#FAF9F6] border border-[#E2DFD7] p-5 flex flex-col justify-between min-h-[220px] transition-all hover:border-[#16181B]"
              >
                <div>
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E2DFD7]">
                    <span className="text-[11px] font-bold text-[#059669] uppercase tracking-wider">
                      03 // Local Signing
                    </span>
                    <Wallet className="w-4 h-4 text-[#059669]" />
                  </div>
                  <h3 className="font-editorial text-lg text-[#111316] font-normal mb-1">
                    User Signs in Wallet
                  </h3>
                  <p className="text-xs text-[#5A5D64] leading-relaxed mb-3">
                    Writes route to local browser. User approves in MetaMask. The AI never touches private keys.
                  </p>
                </div>

                <div className="p-2.5 bg-[#FFFFFF] border border-[#E2DFD7] flex items-center justify-between text-[11px]">
                  <span className="font-medium text-[#111316]">Zero Key Custody</span>
                  <span className="font-semibold text-[#059669] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Air-Gapped
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Invariant Banner */}
          <div className="px-6 py-4 bg-[#FAF9F6] border-t border-[#E2DFD7] grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans text-[#5A5D64]">
            <div>
              <strong className="block text-[#111316] font-semibold mb-0.5">ENS Native</strong>
              Manifests published under protocol domains.
            </div>
            <div>
              <strong className="block text-[#111316] font-semibold mb-0.5">Pre-Flight Simulation</strong>
              State diffs proven via eth_simulateV1.
            </div>
            <div>
              <strong className="block text-[#111316] font-semibold mb-0.5">Zero Key Custody</strong>
              The LLM never holds or sees private keys.
            </div>
            <div>
              <strong className="block text-[#111316] font-semibold mb-0.5">Fail-Closed Boundary</strong>
              Non-reciprocal records flag warnings upfront.
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
