# EVM-Web3MCP

**Let AI agents use any smart contract, just by its ENS name.**

Today an AI agent can only use a smart contract if someone writes custom code for it. With Web3MCP, the contract publishes its own list of tools under its ENS name, like `uniswap.eth`. Install one plugin in Claude Code or Codex and ask *"swap 10 USDC for ETH on uniswap.eth"*. The agent finds the tools, checks the contract and prepares the transaction. You review it and sign in your own wallet; the agent never holds your keys.

Built at ETHGlobal Mumbai 2026. Sibling of [Solana-Web3MCP](https://github.com/Team-Managed/Solana-Web3MCP).

## How it works

1. **Publish.** The protocol stores a manifest in text records on its own ENS name, such as `uniswap.eth`. With ENSv2 per-record roles, a release key can update the tools but nothing else on the name.
2. **Find (optional).** If the user names a protocol, the agent goes straight to it. If they only describe a goal ("swap my ETH"), the agent searches an index on Arkiv for matching ENS names.
3. **Discover.** The host reads and validates the manifest from ENS. A contract whose own primary name points back to the publishing name, or one of its subnames, is owner-verified; otherwise it's labelled name-only.
4. **Use.** Reads are plain contract calls. Writes are simulated, shown on a local signing page with the exact balance changes, and signed in the user's wallet.

Details: [spec/SPEC.md](spec/SPEC.md).

## Layout

| Path | What |
|---|---|
| `packages/sdk` | `@web3mcp/evm`: manifest validation now; ENS discovery, reads and writes next |
| `packages/mcp` | `@web3mcp/mcp`: the generic MCP server |
| `packages/approve-ui` | Local signing page where your own wallet signs each write |
| `plugins/claude-code` | Claude Code plugin: MCP server, skill, and a hook that confirms every write |
| `plugins/codex` | Codex setup |
| `apps/publisher` | `web3mcp-publish` CLI: `validate` now, publish to ENS next |
| `apps/explorer` | Hosted read-only explorer (planned) |
| `contracts` | Foundry: `AgentSwap`, the demo contract |
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

Claude Code opened in this repo picks up `.mcp.json`, which runs the local build against the manifests in `spec/fixtures/valid`. Try: "what does agentswap.web3mcp.eth quote for 0.01 ETH?"

Contracts need [Foundry](https://getfoundry.sh). The tests fork Sepolia and swap on the real Uniswap v4 pool, pinned a few blocks back so public RPCs agree:

```bash
cd contracts && forge test --fork-url https://ethereum-sepolia-rpc.publicnode.com --fork-block-number $(( $(cast block-number --rpc-url https://ethereum-sepolia-rpc.publicnode.com) - 5 ))
```

## Demo contract

`AgentSwap` (`contracts/src/AgentSwap.sol`) is published as `agentswap.web3mcp.eth`. It swaps ETH and USDC on Uniswap v4's Sepolia pool, quotes through Uniswap's own Quoter, and refuses any swap that pays more than 3% below Chainlink's ETH/USD price. It holds no funds. Its manifest is `spec/fixtures/valid/agentswap.web3mcp.eth.json`.

Deploy it from your own wallet (a Foundry keystore account; the owner may only set the contract's ENS primary name):

```bash
cd contracts && forge create src/AgentSwap.sol:AgentSwap --rpc-url https://ethereum-sepolia-rpc.publicnode.com --account <keystore-name> --broadcast --constructor-args <your-address> 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543 0x61B3f2011A92d183C7dbaDBdA940a7555Ccf9227 0x694AA1769357215DE4FAC081bf1f309aDC325306 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
```

The arguments are the owner, Uniswap's PoolManager and Quoter, Chainlink's ETH/USD feed, and Circle's USDC, all on Sepolia. Put the deployed address under `contracts.swap` in the manifest.

## Status

Working on Sepolia: discovery from ENS with trust checks (proxies included), reads with ENS-name inputs and formatted amounts, and writes that are simulated, shown on a local signing page and signed in your own wallet. Uniswap quotes run through dry-run reads. The demo contract swaps on Uniswap v4 with a Chainlink price check and passes its tests on a Sepolia fork. Next: deploy it, publish `agentswap.web3mcp.eth` on ENS, and Arkiv search.

To try signing, set `WEB3MCP_ACCOUNT` to your Sepolia wallet before opening Claude Code in this repo, then ask it to swap 0.001 ETH for USDC on `agentswap.web3mcp.eth`. Get test ETH from a Sepolia faucet and test USDC from faucet.circle.com.

## License

Apache-2.0
