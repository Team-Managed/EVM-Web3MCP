import type { NavItem, GuaranteeCard, FaqItem } from "./types";

/** Where the site is served, for absolute links in metadata. */
export const SITE_URL = "https://evm.web3mcp.org";

/** The image link previews show (Open Graph and X/Twitter), from public/og.png. */
export const SHARE_IMAGE = { url: "/og.png", width: 1200, height: 630, alt: "Web3MCP: smart contracts, as agent tools." };

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
    description: "Contracts publish static text records to ENS. Protocols never host, run, or maintain a server.",
    specReference: "SPEC §1 (Publication)",
  },
  {
    tag: "Verified",
    colorAccent: "bg-meadow",
    title: "Owner-Verified Trust",
    description: "A contract whose ENS primary name points back to the publishing name is marked owner-verified; any other is labelled name-only.",
    specReference: "SPEC §3 (Discovery)",
  },
  {
    tag: "Deterministic",
    colorAccent: "bg-solar",
    title: "Simulated Before Signing",
    description: "Multi-step writes are simulated together via eth_simulateV1, showing the exact balance changes before you sign.",
    specReference: "SPEC §4 (Writes)",
  },
  {
    tag: "Your Wallet",
    colorAccent: "bg-ink",
    title: "Local Wallet Boundary",
    description: "Writes bridge to a local approval page. Works with browser wallets such as MetaMask and Rabby, with EIP-5792 batching.",
    specReference: "approve-ui",
  },
  {
    tag: "Agnostic",
    colorAccent: "bg-ochre",
    title: "One Plugin",
    description: "One plugin for Claude Code and Codex, with the server compiled in, exposes every protocol's discovered tools.",
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
      "Web3MCP is a draft open EVM standard for publishing smart-contract tool manifests under an ENS name. Its protocol design covers discovery, contract reads, write simulation, and user-approved signing through one plugin for Claude Code and Codex.",
  },
  {
    question: "Do protocols have to run a server?",
    category: "Architecture",
    answer:
      "No. Publishers put the manifest and digest in ENS text records; the Web3MCP plugin discovers, verifies, reads, simulates, and hands writes to the user wallet. A development-only manifest directory is also available for fixture testing.",
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
      "The protocol uses the publisher’s ENS name as the authoritative registry. org.web3mcp.manifest stores the exact JSON and org.web3mcp.digest stores its keccak256 digest. An index such as Arkiv may help agents find names, but the plugin re-reads and verifies ENS before using a manifest.",
  },
  {
    question: "What does 'Owner-Verified' mean?",
    category: "Security",
    answer:
      "A contract is Owner-Verified when its ENS primary name points back to the publishing name. If that reverse relationship is absent, the contract is labeled Name-Only: the publishing ENS name remains the authority, but the plugin asks for extra confirmation.",
  },
  {
    question: "What is implemented today?",
    category: "Integration",
    answer:
      "The SDK discovers and verifies ENS manifests, checks contract code and trust, executes reads, prepares and simulates writes, and returns a local wallet signing handoff. The plugin also reports write status. The current tested integration targets Ethereum Sepolia; configure a compatible chain client and RPC for other EVM deployments.",
  },
];
