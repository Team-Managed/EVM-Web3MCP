"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ShieldCheck, ExternalLink, ArrowRight } from "lucide-react";

interface FeatureProtocol {
  id: string;
  ens: string;
  badge: string;
  agentPrompt: string;
  userPrompt: string;
  simulation: {
    stateDiff: string;
    gasEstimate: string;
    status: string;
  };
  signingSummary: string;
}

const DEMO_PROTOCOLS: FeatureProtocol[] = [
  {
    id: "uniswap",
    ens: "uniswap.eth",
    badge: "DEX Swap",
    agentPrompt: "Discovered manifest at uniswap.eth. Tools: exactInputSingle, quoteExactInputSingle.",
    userPrompt: "Swap 1.50 WETH for USDC with max 0.5% slippage on Mainnet",
    simulation: {
      stateDiff: "+4,821.50 USDC  |  -1.5000 WETH",
      gasEstimate: "142,300 gas (0 reverts)",
      status: "SUCCESSFUL SIMULATION",
    },
    signingSummary: "Ready on local approve-ui (http://localhost:3100)",
  },
  {
    id: "vault",
    ens: "vault.web3mcp-demo.eth",
    badge: "ERC-4626 Vault",
    agentPrompt: "Discovered manifest at vault.web3mcp-demo.eth. Tools: deposit, withdraw, totalAssets.",
    userPrompt: "Deposit 10.0 ETH into Yield Vault and preview mint shares",
    simulation: {
      stateDiff: "+9.8420 vETH shares  |  -10.0000 ETH",
      gasEstimate: "118,700 gas (0 reverts)",
      status: "SUCCESSFUL SIMULATION",
    },
    signingSummary: "Air-gapped transaction queued for user wallet signature",
  },
  {
    id: "chainlink",
    ens: "chainlink.eth",
    badge: "Oracle View",
    agentPrompt: "Discovered manifest at chainlink.eth. Tools: latestRoundData, decimals, description.",
    userPrompt: "Query ETH / USD latest answer and round timestamp",
    simulation: {
      stateDiff: "Read Call: ETH/USD = $3,214.33 (Round #1105942)",
      gasEstimate: "0 gas (Pure contract read)",
      status: "VERIFIED DATA FEED",
    },
    signingSummary: "No private key required (read-only execution)",
  },
];

export function FeaturesExplainer() {
  const [activeProtocol, setActiveProtocol] = useState<FeatureProtocol>(DEMO_PROTOCOLS[0]);
  const [activeStep, setActiveStep] = useState<number>(0);

  const featurePoints = [
    {
      title: "ENS Tool Discovery",
      summary: "Protocols store tool manifests in ENS text records. Agents discover tools directly from on-chain digests.",
      tag: "ENS Native",
    },
    {
      title: "Pre-Flight Simulation",
      summary: "Every transaction executes through eth_simulateV1 first. Balance deltas, approvals, and gas limits are proven upfront.",
      tag: "eth_simulateV1",
    },
    {
      title: "Air-Gapped Signing",
      summary: "The LLM never touches private keys. Writes bridge to a local signing page for approval in the user's wallet.",
      tag: "Zero Key Custody",
    },
  ];

  return (
    <section id="features-explained" className="py-24 bg-[#FAF9F6] border-b border-[#E2DFD7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mb-14">
          <div className="flex items-center gap-2 font-sans text-xs text-[#E57E25] uppercase tracking-widest mb-3 font-semibold">
            <span className="w-2.5 h-2.5 bg-[#E57E25]" />
            <span>Architecture</span>
          </div>
          <h2 className="font-editorial text-4xl sm:text-6xl text-[#111316] font-normal tracking-[-0.02em] mb-4 leading-[1.08]">
            Smart Contracts as Agent Tools.
          </h2>
          <p className="max-w-2xl text-base sm:text-lg text-[#5A5D64] leading-relaxed font-sans">
            How autonomous agents discover tools, verify ABI schemas, simulate state diffs, and prompt for non-custodial signatures.
          </p>
        </div>

        {/* 2-Column Handhold-style Layout: Left Features, Right Image-Backed Interactive Demo */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-8">
          
          {/* Left Column: Feature Specifications & Points */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {featurePoints.map((point, index) => (
                <div
                  key={point.title}
                  onClick={() => setActiveStep(index)}
                  className={`p-6 border transition-all cursor-pointer ${
                    activeStep === index
                      ? "bg-[#FFFFFF] border-[#16181B] shadow-sharp-solid"
                      : "bg-[#FFFFFF]/60 border-[#E2DFD7] hover:border-[#16181B]/50 hover:bg-[#FFFFFF]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-sans text-[11px] font-bold tracking-wider uppercase text-[#E57E25]">
                      0{index + 1} // {point.tag}
                    </span>
                    {activeStep === index && (
                      <span className="w-2 h-2 bg-[#16181B]" />
                    )}
                  </div>
                  <h3 className="font-editorial text-2xl text-[#111316] font-normal mb-2">
                    {point.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#5A5D64] leading-relaxed font-sans">
                    {point.summary}
                  </p>
                </div>
              ))}
            </div>

            {/* Protocol Selector Tabs */}
            <div className="pt-2">
              <span className="font-sans text-xs uppercase tracking-wider text-[#5A5D64] font-semibold block mb-2">
                Select Active Protocol:
              </span>
              <div className="flex flex-wrap gap-2">
                {DEMO_PROTOCOLS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setActiveProtocol(p)}
                    className={`px-3.5 py-2 text-xs font-sans uppercase tracking-wider transition-all border ${
                      activeProtocol.id === p.id
                        ? "bg-[#16181B] text-[#FAF9F6] border-[#16181B] shadow-sharp-solid font-bold"
                        : "bg-[#FFFFFF] text-[#111316] border-[#E2DFD7] hover:border-[#16181B] font-semibold"
                    }`}
                  >
                    {p.ens}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Card with User's Uploaded Background Picture */}
          <div className="lg:col-span-7 relative min-h-[500px] border border-[#16181B] shadow-sharp-solid overflow-hidden flex flex-col justify-between">
            
            {/* Background Texture Picture provided by User */}
            <div className="absolute inset-0 z-0">
              <Image
                src="/images/features-bg.jpg"
                alt="Feature background texture"
                fill
                priority
                className="object-cover object-center filter saturate-110"
              />
              {/* Soft overlay to ensure high-contrast readability */}
              <div className="absolute inset-0 bg-[#FAF7F0]/35 backdrop-blur-[1px]" />
            </div>

            {/* Top Bar of the Interactive Window */}
            <div className="relative z-10 px-5 py-3.5 bg-[#FFFFFF]/90 border-b border-[#E2DFD7] flex items-center justify-between backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 bg-[#E57E25]" />
                <span className="font-sans text-xs font-bold text-[#111316]">
                  {activeProtocol.ens}
                </span>
                <span className="font-sans text-[11px] font-semibold uppercase px-1.5 py-0.5 bg-[#FAF9F6] border border-[#E2DFD7] text-[#5A5D64]">
                  {activeProtocol.badge}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-sans font-medium text-[#5A5D64]">
                <span className="inline-block w-1.5 h-1.5 bg-[#16181B]" />
                <span>EVM Mainnet</span>
              </div>
            </div>

            {/* Interactive Chat & Pre-Flight Flow sitting on top of the Background */}
            <div className="relative z-10 p-6 sm:p-8 flex-1 flex flex-col justify-center space-y-4 font-sans">
              
              {/* 1. Agent Discovery Message */}
              <div className="bg-[#FFFFFF]/95 border border-[#E2DFD7] p-4 shadow-sm max-w-[85%] backdrop-blur-md">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-1.5 h-1.5 bg-[#E57E25]" />
                  <span className="font-sans text-[11px] uppercase font-bold text-[#E57E25]">
                    Agent • ENS Tool Discovery
                  </span>
                </div>
                <p className="text-xs text-[#111316] font-sans leading-relaxed">
                  {activeProtocol.agentPrompt}
                </p>
              </div>

              {/* 2. User Prompt Message */}
              <div className="bg-[#16181B] text-[#FAF9F6] p-4 max-w-[85%] self-end shadow-sm">
                <div className="flex items-center gap-2 mb-1 justify-end">
                  <span className="font-sans text-[11px] uppercase text-[#E2DFD7] font-medium">
                    User Prompt
                  </span>
                  <span className="w-1.5 h-1.5 bg-[#E57E25]" />
                </div>
                <p className="text-xs font-sans font-medium leading-relaxed">
                  &ldquo;{activeProtocol.userPrompt}&rdquo;
                </p>
              </div>

              {/* 3. Pre-Flight Simulation Result */}
              <div className="bg-[#FFFFFF]/95 border border-[#16181B] p-4 max-w-[92%] backdrop-blur-md shadow-sharp-sand">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#E2DFD7]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#16181B]" />
                    <span className="font-sans text-xs font-bold text-[#111316]">
                      {activeProtocol.simulation.status}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-[#5A5D64]">
                    eth_simulateV1
                  </span>
                </div>

                <div className="space-y-1.5 text-xs font-sans">
                  <div className="flex justify-between items-center text-[#111316]">
                    <span className="text-[#5A5D64]">Net Balance Delta:</span>
                    <span className="font-bold text-[#E57E25] font-mono">
                      {activeProtocol.simulation.stateDiff}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[#5A5D64]">
                    <span>Execution Cost:</span>
                    <span className="font-mono">{activeProtocol.simulation.gasEstimate}</span>
                  </div>
                </div>
              </div>

              {/* 4. Air-Gapped Wallet Hand-off */}
              <div className="bg-[#FFFFFF]/95 border border-[#16181B] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 bg-[#E57E25]" />
                  <span className="font-sans text-xs text-[#111316] font-medium">
                    {activeProtocol.signingSummary}
                  </span>
                </div>
                <a
                  href="#offerings"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#16181B] text-white text-xs font-sans font-bold uppercase tracking-wider hover:bg-[#E57E25] transition-colors"
                >
                  <span>Sign in Wallet</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

            </div>

            {/* Bottom Bar */}
            <div className="relative z-10 px-5 py-3 bg-[#FFFFFF]/90 border-t border-[#E2DFD7] flex items-center justify-between backdrop-blur-md font-sans">
              <span className="text-xs text-[#5A5D64] uppercase tracking-wider font-semibold">
                Verifiable EVM Execution Flow
              </span>
              <span className="text-xs text-[#111316] font-bold">
                Zero Key Custody
              </span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
