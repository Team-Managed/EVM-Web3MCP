"use client";

import React from "react";
import { ArrowUpRight } from "lucide-react";

export function WhatWeOffer() {
  const offerings = [
    {
      title: "@web3mcp/evm",
      subtitle: "Core TypeScript SDK",
      tag: "Core Library",
      features: [
        "ENS manifest and digest discovery",
        "Contract code, selector, and trust checks",
        "Formatted reads and ENS address inputs",
        "Write preparation, simulation, and asset changes",
      ],
      meta: "Available now · Node 22+ · viem",
      href: "https://github.com/Team-Managed/EVM-Web3MCP/tree/main/packages/sdk",
    },
    {
      title: "Claude Code Plugin",
      subtitle: "Native Anthropic Integration",
      tag: "Developer Plugin",
      features: [
        "Install from the repository marketplace",
        "Bundled MCP server and signing page",
        "ENS discovery and read/write tools",
        "User wallet approval boundary",
      ],
      meta: "Claude Code marketplace plugin",
      href: "https://github.com/Team-Managed/EVM-Web3MCP/tree/main/plugins/claude-code",
    },
    {
      title: "Codex & MCP Host",
      subtitle: "Generic MCP Standard Host",
      tag: "Universal Host",
      features: [
        "Codex marketplace plugin",
        "Bundled server, skill, and signing page",
        "Fixture and live Sepolia modes",
        "Dynamic tools plus status tracking",
      ],
      meta: "Codex plugin · Sepolia default",
      href: "https://github.com/Team-Managed/EVM-Web3MCP/tree/main/packages/mcp",
    },
  ];

  return (
    <section id="offerings" className="py-24 bg-[#FAF9F6] border-b border-[#E2DFD7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-14">
          <div className="flex items-center gap-2 font-mono text-xs text-[#E57E25] uppercase tracking-widest mb-3">
            <span className="w-2.5 h-2.5 bg-[#E57E25]" />
            <span>Open Toolset</span>
          </div>
          <h2 className="font-editorial text-4xl sm:text-6xl text-[#111316] font-normal tracking-tight mb-4 leading-[1.08]">
            Build Once. Accessible to Every Agent.
          </h2>
          <p className="max-w-2xl text-sm sm:text-base text-[#5A5D64] leading-relaxed">
            Publish under your ENS name. Discoverable across Claude, Cursor, and any MCP-compatible agent.
          </p>
        </div>

        {/* 3 Sharp Cards in Refined 2-Color Palette */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {offerings.map((card) => (
            <div
              key={card.title}
              className="bg-[#FFFFFF] border border-[#E2DFD7] p-7 flex flex-col justify-between shadow-sharp-sand hover:border-[#16181B] transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E2DFD7]">
                  <span className="font-mono text-xs uppercase tracking-wider text-[#5A5D64]">
                    {card.tag}
                  </span>
                  <div className="w-2 h-2 bg-[#16181B]" />
                </div>

                <h3 className="font-editorial text-2xl font-normal text-[#111316] mb-1">
                  {card.title}
                </h3>
                <p className="text-xs text-[#5A5D64] mb-6 font-sans">
                  {card.subtitle}
                </p>

                {/* Features List */}
                <ul className="space-y-3 mb-8 text-xs text-[#5A5D64] font-sans">
                  {card.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2.5">
                      <span className="font-mono text-[#E57E25] font-bold select-none">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action / Meta Box (No CLI) */}
              <a
                href={card.href}
                target="_blank"
                rel="noreferrer"
                className="bg-[#FAF9F6] border border-[#E2DFD7] p-3 text-xs font-sans text-[#111316] flex items-center justify-between hover:bg-[#F4EEDF] transition-colors"
              >
                <span className="font-semibold">{card.meta}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#111316]" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
