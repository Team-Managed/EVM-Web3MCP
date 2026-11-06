# EVM-Web3MCP

Web3MCP for EVM chains. A protocol publishes the tools it wants AI agents to use under its own ENS name. One generic MCP server, installed as a Claude Code plugin or added to Codex, discovers those tools, reads contracts, simulates every write, and hands signing to the user's own wallet. There's no MCP server per protocol, and the agent never holds a key.

Sibling of [Solana-Web3MCP](https://github.com/Team-Managed/Solana-Web3MCP). Built at ETHGlobal Mumbai 2026.

## How it works

1. **Publish.** The protocol stores a manifest in text records on its own ENS name, such as `uniswap.eth`. With ENSv2 per-record roles, a release key can update the tools but nothing else on the name.
2. **Find.** Agents search an index on Arkiv by capability ("who offers a swap?") to get matching ENS names.
3. **Discover.** The host reads and validates the manifest from ENS. A contract whose own primary name points back to the publishing name is owner-verified; otherwise it's labelled name-only.
4. **Use.** Reads are plain contract calls. Writes are simulated, shown on a local signing page with the exact balance changes, and signed in the user's wallet.

Details: [spec/SPEC.md](spec/SPEC.md).

## Layout

| Path | What |
|---|---|
| `packages/sdk` | `@web3mcp/evm`: manifest validation now; ENS discovery, reads and writes next |
| `packages/mcp` | `@web3mcp/mcp`: the generic MCP server |
| `packages/approve-ui` | Local signing page (planned) |
| `plugins/claude-code` | Claude Code plugin: MCP server, skill, and a hook that confirms every write |
| `plugins/codex` | Codex setup |
| `apps/publisher` | `web3mcp-publish` CLI: `validate` now, publish to ENS next |
| `apps/explorer` | Hosted read-only explorer (planned) |
| `contracts` | Foundry: `DemoVault` |
| `spec` | Specification and shared test fixtures |

## Install

Claude Code:

```bash
claude plugin marketplace add Team-Managed/EVM-Web3MCP
```

```bash
claude plugin install web3mcp@evm-web3mcp
```

Codex: see [plugins/codex](plugins/codex/README.md).

Both run `@web3mcp/mcp` from npm, which isn't published yet. Until then, use the development setup below.

## Develop

Needs Node 24 (`nvm use` reads `.nvmrc`).

```bash
npm ci
```

```bash
npm test
```

Claude Code opened in this repo picks up `.mcp.json`, which runs the local build against the manifests in `spec/fixtures/valid`. Try: "discover vault.web3mcp-demo.eth".

Contracts need [Foundry](https://getfoundry.sh):

```bash
cd contracts && forge test
```

## Status

Scaffold. Working: manifest validation, and an MCP server whose `discover` registers a protocol's tools and notifies the client. Next: ENS discovery and the trust check, reads and writes, the signing page, Uniswap tools, and Arkiv search.

## License

Apache-2.0
