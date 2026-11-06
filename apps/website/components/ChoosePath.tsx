import React from "react";
import { ArrowRight, Code2, Bot } from "lucide-react";

export function ChoosePath() {
  return (
    <section id="choose-path" className="py-24 bg-[#FAF9F6] border-b border-[#E2DFD7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-14">
          <div className="flex items-center gap-2 font-mono text-xs text-[#E57E25] uppercase tracking-widest mb-3">
            <span className="w-2.5 h-2.5 bg-[#E57E25]" />
            <span>Integrate</span>
          </div>
          <h2 className="font-editorial text-4xl sm:text-6xl text-[#111316] font-normal tracking-tight mb-4 leading-[1.08]">
            Choose Your Integration.
          </h2>
          <p className="max-w-2xl text-sm sm:text-base text-[#5A5D64] leading-relaxed">
            Publish protocol tools under ENS, or equip your AI assistant with live EVM capabilities.
          </p>
        </div>

        {/* 2 Sharp Rectangular Columns in Refined 2-Color Palette */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Column 1: For Smart Contract Developers */}
          <div id="docs" className="bg-[#FFFFFF] border border-[#E2DFD7] p-8 shadow-sharp-sand flex flex-col justify-between">
            <div>
              <div className="h-1.5 w-16 bg-[#16181B] mb-6" />
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#16181B] mb-2 font-semibold">
                <Code2 className="w-4 h-4" />
                <span>Protocol Engineering</span>
              </div>
              <h3 className="font-editorial text-3xl text-[#111316] font-normal mb-4">
                Publish Smart Contracts
              </h3>
              <p className="text-xs sm:text-sm text-[#5A5D64] leading-relaxed mb-6 font-sans">
                Make your dApp, vault, or protocol discoverable to AI agents with zero server overhead. Define the manifest, write to ENS, and retain total cryptographic ownership.
              </p>

              <div className="space-y-3 mb-8 text-xs font-mono text-[#111316]">
                <div className="p-3.5 bg-[#FAF9F6] border border-[#E2DFD7]">
                  <strong className="block mb-1 text-[11px] text-[#5A5D64] uppercase">1. Define Manifest JSON</strong>
                  Declare read views, write steps, and argument bindings.
                </div>
                <div className="p-3.5 bg-[#FAF9F6] border border-[#E2DFD7]">
                  <strong className="block mb-1 text-[11px] text-[#5A5D64] uppercase">2. Configure ENS Permissions</strong>
                  Grant deployer keys permission to update text records without root ownership risk.
                </div>
                <div className="p-3.5 bg-[#FAF9F6] border border-[#E2DFD7]">
                  <strong className="block mb-1 text-[11px] text-[#5A5D64] uppercase">3. Publish & Validate</strong>
                  Publish text records to your ENS domain and verify the on-chain digest.
                </div>
              </div>
            </div>

            <a
              href="https://github.com/Team-Managed/EVM-Web3MCP/blob/main/spec/SPEC.md"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-between px-6 py-4 bg-[#16181B] text-[#FAF9F6] text-xs font-mono uppercase tracking-wider hover:bg-[#333333] transition-colors shadow-sharp-solid"
            >
              <span>Read Specification</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Column 2: For AI Developers & Users */}
          <div className="bg-[#FFFFFF] border border-[#E2DFD7] p-8 shadow-sharp-sand flex flex-col justify-between">
            <div>
              <div className="h-1.5 w-16 bg-[#E57E25] mb-6" />
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#E57E25] mb-2 font-semibold">
                <Bot className="w-4 h-4" />
                <span>Agent Developers</span>
              </div>
              <h3 className="font-editorial text-3xl text-[#111316] font-normal mb-4">
                Equip Agents With Tools
              </h3>
              <p className="text-xs sm:text-sm text-[#5A5D64] leading-relaxed mb-6 font-sans">
                Give Claude, Codex, Cursor, or custom agents the ability to discover protocols dynamically, read EVM state, and prompt for wallet approval.
              </p>

              <div className="space-y-3 mb-8 text-xs font-mono text-[#111316]">
                <div className="p-3.5 bg-[#FAF9F6] border border-[#E2DFD7]">
                  <strong className="block mb-1 text-[11px] text-[#5A5D64] uppercase">1. Install Claude Code Plugin</strong>
                  Run <code>claude plugin install web3mcp@evm-web3mcp</code> in your workspace.
                </div>
                <div className="p-3.5 bg-[#FAF9F6] border border-[#E2DFD7]">
                  <strong className="block mb-1 text-[11px] text-[#5A5D64] uppercase">2. Natural Language Discovery</strong>
                  Prompt: <em>&quot;Discover tools on vault.web3mcp-demo.eth&quot;</em>.
                </div>
                <div className="p-3.5 bg-[#FAF9F6] border border-[#E2DFD7]">
                  <strong className="block mb-1 text-[11px] text-[#5A5D64] uppercase">3. Simulation & Signing</strong>
                  Review balance deltas in the local signing UI before approving in MetaMask.
                </div>
              </div>
            </div>

            <a
              href="https://github.com/Team-Managed/EVM-Web3MCP/tree/main/plugins/claude-code"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-between px-6 py-4 bg-[#FFFFFF] border border-[#16181B] text-[#111316] text-xs font-mono uppercase tracking-wider hover:bg-[#F4EEDF] transition-colors shadow-sharp-solid"
            >
              <span>View Plugin Setup</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
