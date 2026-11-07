import Link from "next/link";
import { ArrowUpRight, Github } from "lucide-react";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-[#E2DFD7] bg-[#111316] font-sans text-[#FAF9F6]">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="grid gap-10 border-b border-white/15 pb-10 md:grid-cols-[1.6fr_1fr_1fr_1.2fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5">
              <Logo size={28} />
              <span className="font-editorial text-2xl font-normal tracking-tight">Web3MCP</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-[#A0A4AE]">The open EVM standard connecting smart contracts to AI agent tools.</p>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#E57E25]">Explore</p>
            <div className="mt-4 space-y-3 text-sm text-[#D5D7DC]">
              <Link href="/#how-it-works" className="block transition-colors hover:text-white">How it works</Link>
              <Link href="/#choose-path" className="block transition-colors hover:text-white">Integrations</Link>
              <Link href="/#faq" className="block transition-colors hover:text-white">FAQ</Link>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7EE2A8]">Resources</p>
            <div className="mt-4 space-y-3 text-sm text-[#D5D7DC]">
              <Link href="/docs" className="block transition-colors hover:text-white">Documentation</Link>
              <Link href="/docs#search" className="block transition-colors hover:text-white">Arkiv search</Link>
              <Link href="/docs#guarantees" className="block transition-colors hover:text-white">Security invariants</Link>
            </div>
          </div>

          <div className="md:justify-self-end">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#93C5FD]">Build with us</p>
            <p className="mt-4 max-w-xs text-sm leading-6 text-[#A0A4AE]">Publish your protocol under ENS and make it discoverable to compatible agents.</p>
            <Link href="/docs#publication" className="mt-5 inline-flex items-center gap-2 border border-white/25 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-white hover:text-[#111316]">Read the guide <ArrowUpRight className="h-3.5 w-3.5" /></Link>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-6 text-xs text-[#8E939D] sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Web3MCP Standard</span>
          <a href="https://github.com/Team-Managed/EVM-Web3MCP" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 transition-colors hover:text-white">GitHub <Github className="h-3.5 w-3.5" /></a>
        </div>
      </div>
    </footer>
  );
}
