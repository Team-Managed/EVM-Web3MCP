import type { NavItem, GuaranteeCard, FaqItem } from "./types";

export const NAV_ITEMS: NavItem[] = [
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Integrate", href: "/#choose-path" },
  { label: "Security", href: "/#guarantees" },
  { label: "FAQ", href: "/#faq" },
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
    description: "Writes bridge to a local approval page. Works with browser wallets such as MetaMask and Rabby, with EIP-5792 batching.",
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
      "No. Publishers put the manifest and digest in ENS text records; the generic host discovers, verifies, reads, simulates, and hands writes to the user wallet. A development-only manifest directory is also available for fixture testing.",
  },
  {
    question: "Can an AI agent sign transactions or move funds?",
    category: "Security",
    answer:
      "No. The model never receives or uses a private key. Writes are validated, simulated with eth_simulateV1, shown with decoded calls and asset changes, and handed to the user’s local signing page for wallet approval.",
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
      "The SDK discovers and verifies ENS manifests, checks contract code and trust, executes reads, prepares and simulates writes, and returns a local wallet signing handoff. The MCP server also reports write status. The current tested integration targets Ethereum Sepolia; configure a compatible chain client and RPC for other EVM deployments.",
  },
];
