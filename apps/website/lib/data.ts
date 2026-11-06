import type { NavItem, ProtocolStep, TrustInvariant, GuaranteeCard, FaqItem } from "./types";

export const NAV_ITEMS: NavItem[] = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Integrate", href: "#choose-path" },
  { label: "Security", href: "#guarantees" },
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
      "Web3MCP is a draft open EVM standard for publishing smart-contract tool manifests under an ENS name. Its protocol design covers discovery, contract reads, write simulation, and user-approved signing through one generic MCP host.",
  },
  {
    question: "Do protocols have to host an MCP server?",
    category: "Architecture",
    answer:
      "No. The protocol is designed to be serverless for publishers: publish the manifest and digest as ENS text records, then let a generic host discover the tools. The current @web3mcp/evm package provides strict manifest validation; the remaining discovery and execution pieces are still being implemented.",
  },
  {
    question: "Can an AI agent sign transactions or move funds?",
    category: "Security",
    answer:
      "No. The model must never receive or use a private key. In the protocol design, writes are validated, simulated with eth_simulateV1, shown with decoded calls and balance deltas, and handed to the user’s wallet for approval. The signing UI is part of the planned execution flow, not a claim that every integration is complete today.",
  },
  {
    question: "Why is ENS the source of truth?",
    category: "ENS",
    answer:
      "The protocol uses the publisher’s ENS name as the authoritative registry. org.web3mcp.manifest stores the exact JSON and org.web3mcp.digest stores its keccak256 digest. An index such as Arkiv may help agents find names, but a host must re-read and verify ENS before using a manifest.",
  },
  {
    question: "What does 'Owner-Verified' mean?",
    category: "Security",
    answer:
      "A contract is Owner-Verified when its ENS primary name points back to the publishing name. If that reverse relationship is absent, the contract is labeled Name-Only: the publishing ENS name remains the authority, but the host should request extra confirmation.",
  },
  {
    question: "What is implemented today?",
    category: "Integration",
    answer:
      "The SDK currently validates manifests against the strict v0.1-evm schema, including contract aliases, tool kinds, ABI signatures, argument counts, mutability, and bindings. ENS discovery, direct reads, write preparation, simulation, and wallet handoff are protocol-defined next steps rather than completed features. The supported chain and wallet matrix will be documented as those integrations ship.",
  },
];
