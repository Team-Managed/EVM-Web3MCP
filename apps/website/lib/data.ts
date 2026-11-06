import type { NavItem, ProtocolStep, TrustInvariant, GuaranteeCard, FaqItem } from "./types";

export const NAV_ITEMS: NavItem[] = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Packages", href: "#offerings" },
  { label: "Security", href: "#guarantees" },
  { label: "Integrate", href: "#choose-path" },
  { label: "FAQ", href: "#faq" },
];

export const PROTOCOL_STEPS: ProtocolStep[] = [
  {
    step: 1,
    id: "publish",
    title: "Publish to ENS",
    actor: "Protocol Team",
    colorName: "azure",
    badgeBg: "bg-azure",
    badgeText: "text-white",
    summary: "Store tool manifest in ENS text records.",
    details:
      "The protocol stores its manifest under its ENS name. An ENSv2 deployer role updates tools without domain ownership risk.",
    codeSnippet: 'org.web3mcp.manifest = { "web3mcp": "0.1-evm", "tools": [...] }',
  },
  {
    step: 2,
    id: "find",
    title: "Find by Capability",
    actor: "Arkiv Index",
    colorName: "ochre",
    badgeBg: "bg-ochre",
    badgeText: "text-ink",
    summary: "Agents discover protocols matching intents.",
    details:
      "Agents query Arkiv to find protocols offering swaps, vaults, or data feeds. The ENS digest prevents cache tampering.",
  },
  {
    step: 3,
    id: "discover",
    title: "Discover & Validate",
    actor: "Generic Host",
    colorName: "meadow",
    badgeBg: "bg-meadow",
    badgeText: "text-white",
    summary: "Host validates digest and verifies primary name.",
    details:
      "The SDK pulls records from ENS and checks schema compliance. Contracts matching primary reverse records are marked Owner-Verified.",
  },
  {
    step: 4,
    id: "read",
    title: "Read Contract State",
    actor: "Direct RPC (viem)",
    colorName: "azure-dark",
    badgeBg: "bg-ink",
    badgeText: "text-white",
    summary: "Gasless contract queries feed live state to agents.",
    details:
      "View functions execute via eth_call. Agents query balances, rates, and reserves with zero gas and deterministic results.",
    codeSnippet: "await host.call('vault_balanceOf', { account: userAddress })",
  },
  {
    step: 5,
    id: "simulate",
    title: "Pre-Flight Simulation",
    actor: "eth_simulateV1",
    colorName: "solar",
    badgeBg: "bg-solar",
    badgeText: "text-white",
    summary: "Simulate writes to compute exact balance deltas.",
    details:
      "State-changing calls are simulated upfront. Inflows, outflows, approvals, and gas limits are proven before prompt.",
  },
  {
    step: 6,
    id: "sign",
    title: "User Signs in Wallet",
    actor: "Approval UI",
    colorName: "ink",
    badgeBg: "bg-ink",
    badgeText: "text-white",
    summary: "User connects wallet to approve transaction.",
    details:
      "The host opens a local signing page. The user reviews decoded calls and balance deltas, then signs. The LLM never sees private keys.",
  },
];

export const TRUST_INVARIANTS: TrustInvariant[] = [
  {
    iconName: "ShieldAlert",
    title: "Zero Key Custody",
    description: "The AI agent never holds, touches, or signs with a private key. Every transaction is approved by the human in their wallet.",
    colorBorder: "border-ink",
  },
  {
    iconName: "Lock",
    title: "Fail-Closed Security",
    description: "Manifests, function signatures, and parameter bindings are untrusted by default. Invalid ABIs immediately abort discovery.",
    colorBorder: "border-meadow",
  },
  {
    iconName: "Globe",
    title: "ENS Source of Truth",
    description: "Protocols own their tool registry under their Ethereum domain. Indices are pure caches; the ENS digest is final.",
    colorBorder: "border-azure",
  },
  {
    iconName: "Cpu",
    title: "Pre-Flight Simulation",
    description: "No blind signing. Writes execute against simulated state so users see exact token balance deltas before on-chain execution.",
    colorBorder: "border-solar",
  },
];

export const GUARANTEES: GuaranteeCard[] = [
  {
    tag: "Serverless",
    colorAccent: "bg-azure",
    title: "Zero Infrastructure",
    description: "Contracts publish static text records to ENS. Protocols never host, run, or maintain an MCP server.",
    specReference: "SPEC §1 (Publication)",
  },
  {
    tag: "Cryptographic",
    colorAccent: "bg-meadow",
    title: "Owner-Verified Trust",
    description: "Contracts with reverse ENS primary names pointing back to the publisher are cryptographically verified.",
    specReference: "SPEC §3 (Discovery)",
  },
  {
    tag: "Deterministic",
    colorAccent: "bg-solar",
    title: "State Diff Proofs",
    description: "Multi-step calls simulate atomically via eth_simulateV1 with exact balance delta proofs.",
    specReference: "SPEC §4 (Writes)",
  },
  {
    tag: "Air-Gapped",
    colorAccent: "bg-ink",
    title: "Local Wallet Boundary",
    description: "Writes bridge to a local approval page. Works with MetaMask, WalletConnect, and EIP-5792 batching.",
    specReference: "approve-ui",
  },
  {
    tag: "Agnostic",
    colorAccent: "bg-ochre",
    title: "Universal Host",
    description: "One generic MCP host exposes discovered tools to Claude Code, Cursor, Codex, and custom agents.",
    specReference: "SPEC §5 (Exposure)",
  },
  {
    tag: "Decentralized",
    colorAccent: "bg-ink",
    title: "Capability Discovery",
    description: "Arkiv indexes protocols by capability without relying on centralized app stores or proprietary registries.",
    specReference: "SPEC §6 (Search)",
  },
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "What is Web3MCP?",
    category: "Architecture",
    answer:
      "An open EVM standard for smart contracts to publish tool manifests under their ENS names, allowing AI hosts to safely discover, read, and simulate contract calls.",
  },
  {
    question: "Do protocols have to host an MCP server?",
    category: "Architecture",
    answer:
      "No. Web3MCP is completely serverless for protocols. You only publish text records to ENS. The agent runtime runs its own generic host using the @web3mcp/evm SDK.",
  },
  {
    question: "Can an AI agent sign transactions or move funds?",
    category: "Security",
    answer:
      "No. The agent never has access to private keys. Writes are simulated and routed to a local browser signing page for human confirmation.",
  },
  {
    question: "Why is ENS the source of truth?",
    category: "ENS",
    answer:
      "ENS provides established decentralized domain ownership. Using ENSv2 permissioned roles, a deployer key can update tool manifests without risking domain ownership.",
  },
  {
    question: "What does 'Owner-Verified' mean?",
    category: "Security",
    answer:
      "If a contract's primary name reverse-resolves to the publishing ENS domain, it is marked Owner-Verified. Otherwise, it is flagged Name-Only and requires manual confirmation.",
  },
  {
    question: "Which chains and wallets are supported?",
    category: "Integration",
    answer:
      "Any EVM chain (Mainnet, Sepolia, Arbitrum, Base, OP). Any EIP-1193 or WalletConnect wallet is supported, with EIP-5792 batching where available.",
  },
];
