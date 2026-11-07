import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  Code2,
  FileCheck2,
  LockKeyhole,
  Network,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { MermaidDiagram } from "@/components/MermaidDiagram";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeroRibbonWave } from "@/components/HeroRibbonWave";
import { BrandStickerRail } from "@/components/BrandSticker";
import { GUARANTEES } from "@/lib/data";

export const metadata: Metadata = {
  title: "Documentation — Web3MCP",
  description: "The Web3MCP protocol, manifest format, trust model, and integration flow.",
};

const manifest = `{
  "web3mcp": "0.1-evm",
  "chainId": 11155111,
  "name": "vault.web3mcp-demo.eth",
  "contracts": {
    "vault": "0x1111111111111111111111111111111111111111",
    "usdc": "0x2222222222222222222222222222222222222222"
  },
  "tools": [
    {
      "name": "total_assets",
      "description": "Read the vault asset balance",
      "kind": "read",
      "inputs": {},
      "call": {
        "contract": "vault",
        "function": "function totalAssets() view returns (uint256)",
        "args": []
      }
    }
  ]
}`;

const writeExample = `{
  "name": "deposit",
  "description": "Deposit tokens into the vault",
  "kind": "write",
  "inputs": {
    "amount": { "type": "amount", "token": "usdc" }
  },
  "steps": [
    { "approve": {
      "token": "usdc",
      "spender": "vault",
      "amount": "$input.amount"
    } },
    { "call": {
      "contract": "vault",
      "function": "function deposit(uint256 amount)",
      "args": ["$input.amount"]
    } }
  ]
}`;

const architectureDiagram = `flowchart LR
  Agent[AI agent] --> Host[Generic MCP host]
  Host --> ENS[ENS manifest + digest]
  Host --> RPC[EVM RPC]
  Host --> Wallet[User wallet]
  ENS --> Validate[Validate schema + trust]
  RPC --> Validate
  Validate --> Read[Read tools]
  Validate --> Sim[Simulate writes]
  Sim --> Wallet
  style Agent fill:#111316,color:#fff
  style Wallet fill:#D97706,color:#fff
  style ENS fill:#DBEAFE,color:#111316
  style Validate fill:#D1FAE5,color:#111316
  style Sim fill:#FEF3C7,color:#111316`;

const publicationDiagram = `sequenceDiagram
  participant P as Protocol
  participant E as ENS
  participant H as Host
  P->>P: Serialize manifest exactly
  P->>E: Write org.web3mcp.manifest
  P->>E: Write keccak256 digest
  H->>E: Read both records
  H->>H: Compare exact bytes and digest
  H-->>P: Expose only verified tools`;

const validationDiagram = `flowchart TD
  A[Resolve ENS name] --> B[Read manifest + digest]
  B --> C{Digest matches?}
  C -- No --> X[Fail closed]
  C -- Yes --> D[Strict schema validation]
  D --> E{References and ABI safe?}
  E -- No --> X
  E -- Yes --> F[Check code + selectors]
  F --> G[Record code fingerprint]
  G --> H[Register MCP tools]
  style C fill:#FEF3C7,color:#111316
  style X fill:#FEE2E2,color:#991B1B
  style D fill:#DBEAFE,color:#111316
  style H fill:#D1FAE5,color:#111316`;

const trustDiagram = `flowchart LR
  Contract[Contract address] --> Primary{Primary ENS name points to publisher?}
  Primary -- Yes --> Owner[Owner-verified]
  Primary -- No --> Name[Name-only]
  Owner --> Normal[Normal confirmation]
  Name --> Extra[Extra user confirmation]
  style Owner fill:#D9F7E5,color:#111316
  style Name fill:#F9E2B8,color:#111316
  style Extra fill:#DBEAFE,color:#111316
  style Normal fill:#D1FAE5,color:#111316`;

const writeDiagram = `sequenceDiagram
  participant A as Agent
  participant H as Host
  participant S as Simulation
  participant U as User wallet
  A->>H: call(tx_namespace_tool, args)
  H->>H: Build calls + approvals
  H->>S: eth_simulateV1
  S-->>H: Reverts, gas, balance deltas
  H-->>U: Show decoded transaction
  U->>U: Review and approve
  U-->>H: Wallet signature
  Note over A,U: The agent never holds a private key
  rect rgb(255, 251, 235)
    H->>S: Show exact balance deltas
  end`;

const mcpDiagram = `flowchart LR
  Search["search(terms)"] --> Arkiv["Arkiv capability index"]
  Arkiv --> Discover["discover(name)"]
  Discover --> Manifest["Validated manifest"]
  Manifest --> List["Tool list changed"]
  List --> Read["namespace_tool"]
  List --> Write["tx_namespace_tool"]
  Read --> Call["call(tool, args)"]
  Write --> Call
  Call --> Boundary["Read result or wallet boundary"]
  style Discover fill:#DBEAFE,color:#111316
  style Search fill:#FCE7F3,color:#111316
  style Arkiv fill:#EDE9FE,color:#111316
  style Read fill:#D1FAE5,color:#111316
  style Write fill:#FEF3C7,color:#111316
  style Boundary fill:#FCE7F3,color:#111316`;

const searchDiagram = `flowchart LR
  Goal["User goal\n'swap ETH for USDC'"] --> Terms["Normalize up to 10 terms"]
  Terms --> Query["Arkiv query\nchainId + indexed terms"]
  Query --> Rank["Rank by matched terms"]
  Rank --> Digest["Compare listing digest\nwith ENS now"]
  Digest --> Discover["Discover and verify\nthe selected ENS name"]
  Discover --> Tools["Expose validated tools"]
  style Goal fill:#FCE7F3,color:#111316
  style Query fill:#EDE9FE,color:#111316
  style Digest fill:#FEF3C7,color:#111316
  style Discover fill:#DBEAFE,color:#111316
  style Tools fill:#D1FAE5,color:#111316`;

const sections = [
  ["overview", "Overview"],
  ["quickstart", "Quick start"],
  ["plugins", "Install plugins"],
  ["sdk", "SDK & builder"],
  ["search", "Find protocols"],
  ["publication", "Publish a manifest"],
  ["tools", "Manifest reference"],
  ["trust", "Trust & discovery"],
  ["writes", "Writes & signing"],
  ["mcp", "MCP exposure"],
  ["guarantees", "Security invariants"],
] as const;

const navigationGroups = [
  { title: "Getting started", items: sections.slice(0, 4) },
  { title: "Protocol", items: sections.slice(4, 8) },
  { title: "Execution", items: sections.slice(8) },
] as const;

function SectionLabel({ children, tone = "text-[#E57E25]" }: { children: React.ReactNode; tone?: string }) {
  return <p className={`mb-3 font-sans text-[11px] font-bold uppercase tracking-[0.2em] ${tone}`}>{children}</p>;
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="no-scrollbar overflow-x-auto whitespace-pre-wrap break-words border border-[#2C3036] bg-[#111316] p-5 font-mono text-xs leading-6 text-[#E8E5DD] shadow-[5px_5px_0_#D6C8B1]">
      <code>{children}</code>
    </pre>
  );
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans text-[#111316]">
      <Navbar />

      {/* Docs Hero Section with Static 3D Ribbon Wave Background */}
      <section id="overview" className="relative border-b border-[#E2DFD7] overflow-hidden bg-[#FAF9F6] pt-24 pb-14 sm:pt-28 sm:pb-16 select-none bg-grain scroll-mt-20">
        <HeroRibbonWave isStatic timeOffset={1.0} />

        {/* Soft atmospheric radial gradient behind central typography for 100% crisp legibility */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background:
              "radial-gradient(ellipse at 35% 50%, rgba(250, 249, 246, 0.94) 0%, rgba(250, 249, 246, 0.72) 60%, rgba(250, 249, 246, 0.4) 100%)",
          }}
        />

        <div className="relative z-20 mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-3xl">
            {/* Minimal Eyebrow */}
            <div className="inline-flex items-center gap-2 mb-4 font-sans text-xs uppercase tracking-widest text-[#111316] font-semibold select-text">
              <span className="h-2.5 w-2.5 rotate-45 bg-[#E57E25]" aria-hidden="true" />
              <span>Web3MCP Documentation • Protocol Guide</span>
            </div>

            {/* Docs Editorial Headline matching Hero typography */}
            <h1 className="font-editorial text-4xl sm:text-6xl text-[#111316] font-normal tracking-[-0.02em] leading-[1.08] mb-4 select-text">
              Smart Contracts <br className="hidden sm:inline" />
              As Agent Tools.
            </h1>

            {/* Editorial Subtitle */}
            <p className="max-w-2xl text-base sm:text-lg text-[#5A5D64] leading-relaxed font-sans select-text">
              Web3MCP is an open EVM standard for publishing contract tools under an ENS name. The SDK discovers and verifies protocols, executes reads, simulates writes, and hands final approval to the user&apos;s wallet.
            </p>
            <div className="mt-7"><p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[#7A7E87]">Ecosystem</p><BrandStickerRail brands={["ethereum", "ens", "arkiv", "claude", "openai", "metamask"]} /></div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-5 pt-10 pb-16 sm:px-8 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-20 lg:pt-12 lg:pb-24">
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <p className="mb-4 font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-[#7A7E87]">
            On this page
          </p>
          <nav className="space-y-7">
            {navigationGroups.map((group) => (
              <div key={group.title}>
                <p className="mb-2 font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A7E87]">{group.title}</p>
                <div className="space-y-1 border-l border-[#D8D4CA] pl-4">
                  {group.items.map(([id, label]) => (
                    <a key={id} href={`#${id}`} className="block py-1 text-sm text-[#5A5D64] transition-colors hover:text-[#E57E25]">{label}</a>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <main className="max-w-4xl">
          <div className="space-y-8">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                [Network, "ENS-native", "The protocol owns its registry."],
                [FileCheck2, "Fail-closed", "Invalid manifests stop at discovery."],
                [Wallet, "User-signed", "The model never sees a private key."],
              ].map(([Icon, title, text]) => {
                const FeatureIcon = Icon as typeof Network;
                const colors = ["text-[#2563EB]", "text-[#059669]", "text-[#D97706]"];
                const cardIndex = ["ENS-native", "Fail-closed", "User-signed"].indexOf(title as string);
                return (
                  <div key={title as string} className={`border border-[#E2DFD7] border-t-4 ${cardIndex === 0 ? "border-t-[#2563EB]" : cardIndex === 1 ? "border-t-[#059669]" : "border-t-[#D97706]"} bg-white p-4`}>
                    <FeatureIcon className={`mb-5 h-5 w-5 ${colors[cardIndex]}`} />
                    <p className="text-sm font-bold">{title as string}</p>
                    <p className="mt-1 text-xs leading-5 text-[#7A7E87]">{text as string}</p>
                  </div>
                );
              })}
            </div>
            <MermaidDiagram chart={architectureDiagram} />
          </div>

          <section id="quickstart" className="mt-24 scroll-mt-20 border-t border-[#E2DFD7] pt-12">
            <SectionLabel tone="text-[#059669]">Start here</SectionLabel>
            <h2 className="font-editorial text-3xl font-normal sm:text-4xl">A protocol integration in five steps.</h2>
            <ol className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                ["01", "Choose an ENS name", "Use a normalized name your protocol controls."],
                ["02", "Describe contracts", "Add lowercase aliases and deployed addresses for one EVM chain."],
                ["03", "Declare tools", "Expose read calls and write sequences with explicit inputs."],
                ["04", "Publish two records", "Write the manifest and its keccak256 digest to ENS text records."],
                ["05", "Connect a generic host", "Call discover(name); users approve writes in their own wallet."],
              ].map(([number, title, text]) => (
                <li key={number} className={`flex gap-4 border border-[#E2DFD7] bg-white p-5 ${number === "01" || number === "04" ? "border-l-4 border-l-[#2563EB]" : number === "02" || number === "05" ? "border-l-4 border-l-[#059669]" : "border-l-4 border-l-[#D97706]"}`}>
                  <span className={`font-mono text-xs font-bold ${number === "01" || number === "04" ? "text-[#2563EB]" : number === "02" || number === "05" ? "text-[#059669]" : "text-[#D97706]"}`}>{number}</span>
                  <span><strong className="block text-sm">{title}</strong><span className="mt-1 block text-sm leading-6 text-[#5A5D64]">{text}</span></span>
                </li>
              ))}
            </ol>
            <div className="mt-8 border border-[#B7D4FF] bg-[#EFF6FF] p-5 text-sm leading-6 text-[#3B4A61]">
              <strong className="text-[#111316]">Important boundary:</strong> a publisher supplies metadata and contract bindings; the host remains generic. Do not put private keys, seed phrases, API keys, or protocol-specific signing logic in a manifest.
            </div>
          </section>

          <section id="plugins" className="mt-24 scroll-mt-20 border-t border-[#E2DFD7] pt-12">
            <SectionLabel tone="text-[#8B5CF6]">Agent integrations</SectionLabel>
            <h2 className="font-editorial text-3xl font-normal sm:text-4xl">Install the tools for your agent.</h2>
            <p className="mt-4 max-w-2xl leading-7 text-[#5A5D64]">The repository provides the same Web3MCP plugin for Claude Code and Codex. Add this repository as a marketplace, install <code>web3mcp@evm-web3mcp</code>, then restart the agent so the bundled MCP server, signing page, and skill are loaded.</p>

            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              <article className="border border-[#DDD6FE] border-t-4 border-t-[#8B5CF6] bg-[#FAF5FF] p-6">
                <div className="flex items-center justify-between gap-4"><h3 className="font-editorial text-2xl font-normal">Claude Code</h3><span className="bg-[#EDE9FE] px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#6D28D9]">Available</span></div>
                <p className="mt-2 text-sm leading-6 text-[#5A5D64]">Install the <code>web3mcp</code> plugin from the <code>evm-web3mcp</code> marketplace.</p>
                <h4 className="mt-6 text-xs font-bold uppercase tracking-wider text-[#6D28D9]">CLI</h4>
                <div className="mt-3"><CodeBlock>{`/plugin marketplace add Team-Managed/EVM-Web3MCP
/plugin install web3mcp@evm-web3mcp`}</CodeBlock></div>
                <h4 className="mt-6 text-xs font-bold uppercase tracking-wider text-[#6D28D9]">Interactive UI</h4>
                <ol className="mt-3 space-y-2 text-sm leading-6 text-[#5A5D64]"><li><strong className="text-[#111316]">1.</strong> Run <code>/plugin</code> in Claude Code.</li><li><strong className="text-[#111316]">2.</strong> Open <strong>Marketplaces</strong> and choose <strong>Add marketplace</strong>.</li><li><strong className="text-[#111316]">3.</strong> Enter <code>Team-Managed/EVM-Web3MCP</code>, then select <strong>web3mcp</strong> and install it.</li></ol>
                <p className="mt-5 border-t border-[#DDD6FE] pt-4 text-xs leading-5 text-[#6D28D9]">Start a new Claude Code session after installation so the skill and MCP configuration are loaded.</p>
              </article>

              <article className="border border-[#BFDBFE] border-t-4 border-t-[#2563EB] bg-[#EFF6FF] p-6">
                <div className="flex items-center justify-between gap-4"><h3 className="font-editorial text-2xl font-normal">Codex</h3><span className="bg-[#DBEAFE] px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#1D4ED8]">MCP setup</span></div>
                <p className="mt-2 text-sm leading-6 text-[#5A5D64]">Codex installs the same marketplace plugin as Claude Code, including the bundled server, local signing page, and Codex skill.</p>
                <h4 className="mt-6 text-xs font-bold uppercase tracking-wider text-[#1D4ED8]">CLI</h4>
                <div className="mt-3"><CodeBlock>{`codex plugin marketplace add Team-Managed/EVM-Web3MCP
codex plugin add web3mcp@evm-web3mcp`}</CodeBlock></div>
                <p className="mt-3 text-xs leading-5 text-[#5A5D64]">Restart Codex. To ask before non-read tools, set this in <code>~/.codex/config.toml</code>:</p>
                <div className="mt-2"><CodeBlock>{`[plugins."web3mcp@evm-web3mcp".mcp_servers.web3mcp]
default_tools_approval_mode = "writes"`}</CodeBlock></div>
                <h4 className="mt-6 text-xs font-bold uppercase tracking-wider text-[#1D4ED8]">UI / manual setup</h4>
                <ol className="mt-3 space-y-2 text-sm leading-6 text-[#5A5D64]"><li><strong className="text-[#111316]">1.</strong> Open Codex and run <code>/plugins</code> to open the plugin browser.</li><li><strong className="text-[#111316]">2.</strong> Add <code>Team-Managed/EVM-Web3MCP</code> as a marketplace.</li><li><strong className="text-[#111316]">3.</strong> Install <code>web3mcp</code>, then restart Codex.</li></ol>
                <p className="mt-5 border-t border-[#BFDBFE] pt-4 text-xs leading-5 text-[#1D4ED8]">The plugin uses Sepolia by default. Set your public wallet address or ENS name as <code>WEB3MCP_ACCOUNT</code> when preparing writes; never provide a private key.</p>
              </article>
            </div>
          </section>

          <section id="sdk" className="mt-24 scroll-mt-20 border-t border-[#E2DFD7] pt-12">
            <SectionLabel tone="text-[#8B5CF6]">Developer tools</SectionLabel>
            <h2 className="font-editorial text-3xl font-normal sm:text-4xl">Use the SDK. Build an agent-ready protocol.</h2>
            <p className="mt-4 max-w-2xl leading-7 text-[#5A5D64]">The SDK is for hosts that want direct control over discovery and execution. The builder skill is for turning an existing contract into a checked, publishable Web3MCP manifest without handing an agent a private key.</p>
            <div className="mt-6"><BrandStickerRail brands={["node", "typescript", "viem", "ethereum"]} /></div>
            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              <article className="border border-[#DDD6FE] border-t-4 border-t-[#8B5CF6] bg-[#FAF5FF] p-6">
                <h3 className="font-editorial text-2xl font-normal">Install the SDK</h3>
                <p className="mt-2 text-sm leading-6 text-[#5A5D64]">Use a viem public client. The SDK discovers ENS manifests, executes reads, and prepares simulated writes for your own wallet boundary.</p>
                <div className="mt-5"><CodeBlock>{`npm install @web3mcp/evm viem`}</CodeBlock></div>
                <div className="mt-4"><CodeBlock>{`import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { discover, executeRead, prepareWrite } from "@web3mcp/evm";

const client = createPublicClient({ chain: sepolia, transport: http() });
const protocol = await discover(client, "agentswap.web3mcp.eth");
const quote = await executeRead(client, protocol, "quote_eth_to_usdc", { amount: "0.01" }); // such as "250.663701 USDC"
const minUsdc = (parseFloat(String(quote)) * 0.99).toFixed(6); // accept about 1% less

const wallet = "0xYourWallet";
const write = await prepareWrite(client, protocol, "eth_to_usdc", {
  amount: "0.01", min_usdc: minUsdc, recipient: wallet
}, wallet);`}</CodeBlock></div>
                <p className="mt-4 text-xs leading-5 text-[#6D28D9]">The SDK never signs. Pass the returned calls to the user&apos;s wallet.</p>
              </article>
              <article className="border border-[#A7F3D0] border-t-4 border-t-[#059669] bg-[#ECFDF5] p-6">
                <h3 className="font-editorial text-2xl font-normal">Build and publish</h3>
                <p className="mt-2 text-sm leading-6 text-[#5A5D64]">Use the <code>web3mcp-build</code> skill for an existing contract, a new contract, an adapter, or a manifest update.</p>
                <div className="mt-5"><CodeBlock>{`# Format-only validation
node <skill-folder>/scripts/web3mcp-publish.mjs validate vault.myprotocol.eth.json

# Validate against the chain and print ENS records
node <skill-folder>/scripts/web3mcp-publish.mjs check vault.myprotocol.eth.json

# Discover and verify an already-published name
node <skill-folder>/scripts/web3mcp-publish.mjs check vault.myprotocol.eth`}</CodeBlock></div>
                <ol className="mt-4 space-y-2 text-sm leading-6 text-[#35624B]"><li><strong className="text-[#111316]">1.</strong> Read the contract and list user-facing reads and writes.</li><li><strong className="text-[#111316]">2.</strong> Write the manifest and run <code>validate</code>.</li><li><strong className="text-[#111316]">3.</strong> Run <code>check</code>, review trust levels and the two ENS records, then publish with the user&apos;s wallet or Foundry keystore.</li></ol>
                <p className="mt-4 text-xs leading-5 text-[#047857]">Never put private keys, seed phrases, admin functions, or wallet files in the manifest or environment.</p>
              </article>
            </div>
          </section>

          <section id="search" className="mt-24 scroll-mt-20 border-t border-[#E2DFD7] pt-12">
            <SectionLabel tone="text-[#8B5CF6]">Arkiv discovery</SectionLabel>
            <h2 className="font-editorial text-3xl font-normal sm:text-4xl">Find protocols by capability.</h2>
            <p className="mt-4 max-w-2xl leading-7 text-[#5A5D64]">Arkiv is the optional search index for the host. It helps an agent find a protocol when the user describes a goal without naming an ENS name. ENS remains the source of truth: Arkiv only returns candidates, and the host must re-check the ENS digest and run normal discovery before exposing any tool.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <article className="border border-[#DDD6FE] border-t-4 border-t-[#8B5CF6] bg-[#FAF5FF] p-6">
                <h3 className="font-editorial text-2xl font-normal">Publishers index themselves</h3>
                <p className="mt-2 text-sm leading-6 text-[#5A5D64]">After the ENS manifest is live, the publisher writes one <code>web3mcp.listing</code> entity owned by its wallet. The listing holds only the ENS name, chain ID, manifest digest, and indexed capability terms. It carries no text of its own: hosts show the description and matched terms from the ENS manifest.</p>
                <div className="mt-5"><CodeBlock>{`# List or refresh a published name for 30 days
npx web3mcp-publish index agentswap.web3mcp.eth --account web3mcp`}</CodeBlock></div>
                <p className="mt-4 text-xs leading-5 text-[#6D28D9]">The command decrypts a Foundry keystore locally. Never put a private key in an environment variable.</p>
              </article>
              <article className="border border-[#BFDBFE] border-t-4 border-t-[#2563EB] bg-[#EFF6FF] p-6">
                <h3 className="font-editorial text-2xl font-normal">Hosts search, then verify</h3>
                <p className="mt-2 text-sm leading-6 text-[#5A5D64]">Search terms are normalized, common words are removed, and matches are ranked by the number of shared terms. A result is retained only while its stored digest matches the current ENS digest.</p>
                <div className="mt-5"><CodeBlock>{`# Search the Arkiv index directly
npx web3mcp-publish search swap usdc`}</CodeBlock></div>
                <p className="mt-4 text-xs leading-5 text-[#1D4ED8]">A host still calls <code>discover(name)</code> after search. Arkiv text is untrusted and cannot define executable tools.</p>
              </article>
            </div>
            <div className="mt-8 border border-[#EDE9FE] bg-[#F5F3FF] p-5 text-sm leading-6 text-[#4C1D95]"><strong className="text-[#111316]">Listing lifecycle:</strong> entries expire after 30 days unless the publisher refreshes them. If the manifest changes, the old listing is removed and a new one is written in the same batch. A protocol that stops refreshing disappears from search but remains discoverable directly by ENS name.</div>
            <MermaidDiagram chart={searchDiagram} />
            <h3 className="mt-10 text-lg font-semibold">What is stored in Arkiv?</h3>
            <div className="mt-5 overflow-x-auto border border-[#E2DFD7] bg-white">
              <table className="w-full min-w-[640px] text-left text-sm"><thead className="border-b border-[#E2DFD7] bg-[#F4F1EA] text-xs uppercase tracking-wider"><tr><th className="p-4">Field</th><th className="p-4">Purpose</th></tr></thead><tbody className="divide-y divide-[#E2DFD7] text-[#5A5D64]"><tr><td className="p-4 font-mono text-xs text-[#111316]">ens</td><td className="p-4">The published ENS name.</td></tr><tr><td className="p-4 font-mono text-xs text-[#111316]">chainId</td><td className="p-4">Prevents a Sepolia user from receiving a mainnet listing, or vice versa.</td></tr><tr><td className="p-4 font-mono text-xs text-[#111316]">digest</td><td className="p-4">The ENS <code>org.web3mcp.digest</code> value captured when the listing was written.</td></tr><tr><td className="p-4 font-mono text-xs text-[#111316]">t.&lt;term&gt;</td><td className="p-4">Indexed capability flags, up to 28 terms per listing.</td></tr></tbody></table>
            </div>
            <p className="mt-5 text-sm leading-6 text-[#5A5D64]">The current implementation uses Arkiv&apos;s Rabdi testnet (chain <code>7794095</code>). <code>WEB3MCP_ARKIV_KEY</code> is optional; without it, the public rate-limited endpoint is used.</p>
          </section>

          <section id="publication" className="mt-24 scroll-mt-20 border-t border-[#E2DFD7] pt-12">
            <SectionLabel tone="text-[#2563EB]">01 / Publication</SectionLabel>
            <h2 className="font-editorial text-3xl font-normal sm:text-4xl">Publish one manifest to ENS.</h2>
            <p className="mt-4 max-w-2xl leading-7 text-[#5A5D64]">
              Store two text records on the protocol&apos;s ENS name. The manifest describes every contract and tool; the digest is the keccak256 hash of the exact manifest record bytes. ENS is the source of truth, while indexes are only caches.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="border border-[#BFDBFE] border-t-4 border-t-[#2563EB] bg-[#EFF6FF] p-5"><code className="text-xs font-bold text-[#1D4ED8]">org.web3mcp.manifest</code><p className="mt-2 text-sm text-[#5A5D64]">The manifest JSON.</p></div>
              <div className="border border-[#A7F3D0] border-t-4 border-t-[#059669] bg-[#ECFDF5] p-5"><code className="text-xs font-bold text-[#047857]">org.web3mcp.digest</code><p className="mt-2 text-sm text-[#5A5D64]">0x-prefixed keccak256 digest.</p></div>
            </div>
            <div className="mt-8"><CodeBlock>{manifest}</CodeBlock></div>
            <p className="mt-5 text-sm leading-6 text-[#5A5D64]">The digest must be computed from the exact bytes stored in the manifest record. Changing whitespace or ordering changes the digest. A host rejects a mismatch before parsing or exposing tools.</p>
            <MermaidDiagram chart={publicationDiagram} />
          </section>

          <section id="tools" className="mt-24 scroll-mt-20 border-t border-[#E2DFD7] pt-12">
            <SectionLabel tone="text-[#D97706]">02 / Manifest</SectionLabel>
            <h2 className="font-editorial text-3xl font-normal sm:text-4xl">Keep tools explicit and small.</h2>
            <p className="mt-4 max-w-2xl leading-7 text-[#5A5D64]">A manifest contains 1–32 uniquely named tools. Names are lowercase identifiers. Every contract reference is an alias, and every argument is either a validated literal or a declared binding.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="border-l-4 border-[#2563EB] bg-[#EFF6FF] p-5"><h3 className="font-semibold text-[#1D4ED8]">Read tools</h3><p className="mt-2 text-sm leading-6 text-[#5A5D64]">One call to a <code>view</code> or <code>pure</code> function. Reads are gasless and expose <code>readOnlyHint</code> over MCP.</p></div>
              <div className="border-l-4 border-[#D97706] bg-[#FFFBEB] p-5"><h3 className="font-semibold text-[#B45309]">Write tools</h3><p className="mt-2 text-sm leading-6 text-[#5A5D64]">One to four state-changing calls or ERC-20 approvals, simulated together before signing.</p></div>
            </div>
            <p className="mt-6 text-sm leading-6 text-[#5A5D64]">Supported input types are <code>address</code>, <code>amount</code>, <code>ether</code>, <code>uint256</code>, <code>bool</code>, <code>bytes32</code>, and <code>string</code>. Read tools may also declare formatted outputs or a non-view <code>dryRun</code>. Bindings include <code>$input.name</code>, <code>$sender</code>, and <code>$contracts.alias</code>.</p>
            <div className="mt-8 overflow-x-auto border border-[#E2DFD7] bg-white">
              <table className="w-full min-w-[560px] text-left text-sm"><thead className="border-b border-[#E2DFD7] bg-[#F4F1EA] text-xs uppercase tracking-wider"><tr><th className="p-4">Field</th><th className="p-4">Rules</th></tr></thead><tbody className="divide-y divide-[#E2DFD7] text-[#5A5D64]
              "><tr><td className="p-4 font-mono text-xs text-[#111316]">name</td><td className="p-4">Lowercase identifier, 1–32 characters, unique in the manifest.</td></tr><tr><td className="p-4 font-mono text-xs text-[#111316]">description</td><td className="p-4">Required, human-readable, maximum 500 characters.</td></tr><tr><td className="p-4 font-mono text-xs text-[#111316]">contracts</td><td className="p-4">Lowercase aliases mapped to 20-byte hexadecimal addresses.</td></tr><tr><td className="p-4 font-mono text-xs text-[#111316]">steps</td><td className="p-4">Write tools contain 1–4 calls or ERC-20 approvals.</td></tr></tbody></table>
            </div>
            <h3 className="mt-10 text-lg font-semibold">Write tool example</h3>
            <p className="mt-2 text-sm leading-6 text-[#5A5D64]">Approvals and calls are one declared sequence. The host resolves bindings, validates the ABI argument count and mutability, then simulates the sequence atomically.</p>
            <div className="mt-5"><CodeBlock>{writeExample}</CodeBlock></div>
            <MermaidDiagram chart={validationDiagram} />
          </section>

          <section id="trust" className="mt-24 scroll-mt-20 border-t border-[#E2DFD7] pt-12">
            <SectionLabel tone="text-[#059669]">03 / Discovery</SectionLabel>
            <h2 className="font-editorial text-3xl font-normal sm:text-4xl">Verify before exposing anything.</h2>
            <p className="mt-4 max-w-2xl leading-7 text-[#5A5D64]">The host resolves ENS, checks the digest, validates the schema, confirms contract code and selectors, and records fingerprints. Unknown fields, aliases, bindings, or unsafe read calls fail discovery.</p>
            <div className="mt-8 space-y-3">
              {[
                [ShieldCheck, "Owner-verified", "The contract’s ENS primary name points back to the publishing name."],
                [LockKeyhole, "Name-only", "The publishing name is the only authority, so the host asks for extra confirmation."],
                [CheckCircle2, "Cache-safe", "Arkiv can help find a protocol, but the host always re-reads and verifies ENS."],
              ].map(([Icon, title, text]) => {
                const TrustIcon = Icon as typeof ShieldCheck;
                const trustColor = title === "Owner-verified" ? "#059669" : title === "Name-only" ? "#D97706" : "#2563EB";
                return <div key={title as string} className="flex gap-4 border border-[#E2DFD7] bg-white p-5"><TrustIcon style={{ color: trustColor }} className="mt-0.5 h-5 w-5 shrink-0" /><div><h3 className="font-semibold">{title as string}</h3><p className="mt-1 text-sm leading-6 text-[#5A5D64]">{text as string}</p></div></div>;
              })}
            </div>
            <h3 className="mt-10 text-lg font-semibold">Discovery checklist</h3>
            <ul className="mt-4 grid gap-2 text-sm leading-6 text-[#5A5D64] sm:grid-cols-2">
              {['Resolve the ENS name and read both records', 'Verify the manifest digest before parsing', 'Reject unknown fields and invalid references', 'Confirm deployed bytecode and function selectors', 'Record code fingerprints, including proxy implementations', 'Label contracts Owner-verified or Name-only'].map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#059669]" />{item}</li>)}
            </ul>
            <MermaidDiagram chart={trustDiagram} />
          </section>

          <section id="writes" className="mt-24 scroll-mt-20 border-t border-[#E2DFD7] pt-12">
            <SectionLabel tone="text-[#D97706]">04 / Execution</SectionLabel>
            <h2 className="font-editorial text-3xl font-normal sm:text-4xl">Simulate first. Sign last.</h2>
            <p className="mt-4 max-w-2xl leading-7 text-[#5A5D64]">The host builds every write, simulates the complete sequence with <code>eth_simulateV1</code>, and shows decoded calls, gas, and exact balance changes. It re-checks fingerprints immediately before asking the wallet to sign.</p>
            <div className="mt-8 border border-[#16181B] bg-[#111316] p-6 text-sm text-[#E8E5DD] shadow-[5px_5px_0_#E57E25]"><div className="flex items-center gap-2 text-[#7EE2A8]"><Code2 className="h-4 w-4" /> Execution boundary</div><p className="mt-4 leading-7">Agent intent → ENS discovery → ABI validation → state simulation → user wallet approval</p><p className="mt-4 border-t border-white/10 pt-4 text-xs leading-6 text-[#A0A4AE]">The LLM never signs and never receives a private key.</p></div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3"><div className="border border-[#E2DFD7] bg-white p-4"><strong className="text-sm">Before simulation</strong><p className="mt-2 text-xs leading-5 text-[#5A5D64]">Validate calldata, bindings, code fingerprints, and wallet context.</p></div><div className="border border-[#E2DFD7] bg-white p-4"><strong className="text-sm">After simulation</strong><p className="mt-2 text-xs leading-5 text-[#5A5D64]">Show calls, gas, approvals, and exact token/native balance deltas.</p></div><div className="border border-[#E2DFD7] bg-white p-4"><strong className="text-sm">At signing</strong><p className="mt-2 text-xs leading-5 text-[#5A5D64]">Hand off to the user&apos;s wallet; use EIP-5792 batching where supported.</p></div></div>
            <MermaidDiagram chart={writeDiagram} />
          </section>

          <section id="mcp" className="mt-24 scroll-mt-20 border-t border-[#E2DFD7] pt-12">
            <SectionLabel tone="text-[#2563EB]">05 / MCP</SectionLabel>
            <h2 className="font-editorial text-3xl font-normal sm:text-4xl">One generic host, every protocol.</h2>
            <p className="mt-4 max-w-2xl leading-7 text-[#5A5D64]">The MCP server exposes <code>search(terms)</code> for capability discovery, then <code>discover(name)</code> and <code>call(tool, args)</code>. Discovered tools use <code>&lt;namespace&gt;_&lt;tool&gt;</code> for reads and <code>tx_&lt;namespace&gt;_&lt;tool&gt;</code> for writes. Descriptions and Arkiv listing text are treated as untrusted publisher input.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3"><div className="border border-[#EDE9FE] border-t-4 border-t-[#8B5CF6] bg-[#F5F3FF] p-5"><code className="text-xs font-bold text-[#6D28D9]">search(terms)</code><p className="mt-2 text-sm leading-6 text-[#5A5D64]">Finds candidate ENS names through Arkiv, filters by chain, and drops stale digest mismatches.</p></div><div className="border border-[#BFDBFE] border-t-4 border-t-[#2563EB] bg-[#EFF6FF] p-5"><code className="text-xs font-bold text-[#1D4ED8]">discover(name)</code><p className="mt-2 text-sm leading-6 text-[#5A5D64]">Loads and validates a manifest, registers its tools, and notifies the client that the tool list changed.</p></div><div className="border border-[#A7F3D0] border-t-4 border-t-[#059669] bg-[#ECFDF5] p-5"><code className="text-xs font-bold text-[#047857]">call(tool, args)</code><p className="mt-2 text-sm leading-6 text-[#5A5D64]">Invokes a discovered read or prepares a write for simulation and wallet approval.</p></div></div>
            <MermaidDiagram chart={mcpDiagram} />
            <h3 className="mt-10 text-lg font-semibold">What is implemented today?</h3>
            <p className="mt-2 text-sm leading-6 text-[#5A5D64]">The current SDK discovers manifests from ENS, verifies their digest and contract code, labels trust, executes reads, prepares and simulates writes, and returns a wallet signing handoff. The MCP server also reports write status. The protocol remains a draft, so use the security and limitations guidance when moving beyond the tested Sepolia flow.</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/" className="inline-flex items-center gap-2 bg-[#16181B] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#E57E25]">Explore the protocol <ArrowUpRight className="h-3.5 w-3.5" /></Link>
              <a href="https://github.com/Team-Managed/EVM-Web3MCP/blob/main/spec/SPEC.md" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 border border-[#16181B] bg-white px-5 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#F4EEDF]">Read the full spec <ArrowUpRight className="h-3.5 w-3.5" /></a>
            </div>
          </section>

          <section id="guarantees" className="mt-24 scroll-mt-20 border-t border-[#E2DFD7] pt-12">
            <SectionLabel tone="text-[#E57E25]">06 / Security invariants</SectionLabel>
            <h2 className="font-editorial text-3xl font-normal sm:text-4xl">Security invariants by design.</h2>
            <p className="mt-4 max-w-2xl leading-7 text-[#5A5D64]">These are the protocol guarantees and intended trust boundaries. They describe the design target; unfinished execution features remain clearly marked in the implementation status above.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {GUARANTEES.map((card, index) => {
                const accents = ["#2563EB", "#059669", "#D97706", "#E57E25", "#8B5CF6", "#DB2777"];
                const accent = accents[index % accents.length];
                return (
                  <article key={card.title} className="border border-[#E2DFD7] border-l-4 bg-white p-5" style={{ borderLeftColor: accent }}>
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-sans text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: accent }}>{card.tag}</span>
                      <span className="h-2 w-2" style={{ backgroundColor: accent }} />
                    </div>
                    <h3 className="mt-4 font-editorial text-xl font-normal">{card.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#5A5D64]">{card.description}</p>
                    <p className="mt-4 border-t border-[#E2DFD7] pt-3 font-sans text-[10px] text-[#7A7E87]">Ref: {card.specReference}</p>
                  </article>
                );
              })}
            </div>
          </section>
        </main>

      </div>
      <Footer />
    </div>
  );
}
