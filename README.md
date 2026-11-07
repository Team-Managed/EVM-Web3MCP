<p align="center">
  <a href="https://evm.web3mcp.org">
    <img src="https://evm.web3mcp.org/logo.svg" alt="Web3MCP Logo" width="100" height="100" />
  </a>
</p>

# EVM-Web3MCP

<p align="center">
  <strong>Let AI agents use any smart contract, just by its ENS name.</strong>
</p>

<p align="center">
  <a href="https://github.com/Team-Managed/EVM-Web3MCP/actions/workflows/ci.yml"><img src="https://github.com/Team-Managed/EVM-Web3MCP/actions/workflows/ci.yml/badge.svg" alt="CI Status" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue.svg" alt="License: Apache-2.0" /></a>
  <a href=".nvmrc"><img src="https://img.shields.io/badge/node-%3E%3D22-brightgreen.svg" alt="Node.js 22+" /></a>
  <a href="https://sepolia.etherscan.io"><img src="https://img.shields.io/badge/network-Ethereum%20Sepolia-627EEA.svg" alt="Sepolia" /></a>
  <a href="https://www.npmjs.com/package/@web3mcp/evm"><img src="https://img.shields.io/npm/v/@web3mcp/evm.svg" alt="npm" /></a>
</p>

<p align="center">
  <a href="https://ens.domains" title="ENS"><img src="https://img.logo.dev/ens.domains?size=96&format=png&retina=true&token=pk_BZOhereATUe11DHE7ILvBg" alt="ENS" height="28" /></a>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://uniswap.org" title="Uniswap v4"><img src="https://img.logo.dev/uniswap.org?size=96&format=png&retina=true&token=pk_BZOhereATUe11DHE7ILvBg" alt="Uniswap" height="28" /></a>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://metamask.io" title="MetaMask"><img src="https://img.logo.dev/metamask.io?size=96&format=png&retina=true&token=pk_BZOhereATUe11DHE7ILvBg" alt="MetaMask" height="28" /></a>
</p>

---

Today an AI agent can only use a smart contract if someone writes custom code for it. With Web3MCP, the contract publishes its own list of tools under its ENS name, like `uniswap.eth`. Install one plugin in Claude Code or Codex and ask *"swap 10 USDC for ETH on uniswap.eth"*. The agent finds the tools, checks the contract and prepares the transaction. You review it and sign in your own wallet; the agent never holds your keys.

Built at ETHGlobal Mumbai 2026.

## An onchain web for AI agents

People got the web: sites, names that lead to them, and search engines that find them by what they do. Web3MCP builds the same pieces for AI agents, on chain:

| The web | Web3MCP's agent web |
|---|---|
| A site and what it offers | A smart contract and its manifest of tools |
| DNS: a name leads to the site | ENS: the name holds the manifest, with a digest that proves it's intact |
| A search engine: find sites by what they do | [Arkiv](#search-on-arkiv): a search engine for agents, where any protocol lists itself and any agent searches by goal |
| A browser | One generic MCP server, in Claude Code or Codex |
| Signing in and paying | Your own wallet, which signs every write |

No company runs a server in the middle. Protocols publish to ENS and Arkiv with their own wallets, and agents read both chains directly. The only software involved is the MCP server and signing page on your own machine. Nobody else can remove a protocol's listing, and a listing can't change what an agent runs: search only points to an ENS name, and the agent checks that name on chain before it uses it.

## How it works

1. **Publish.** The protocol stores a manifest in text records on its own ENS name, such as `uniswap.eth`. With ENSv2 per-record roles, a release key can update the tools but nothing else on the name.
2. **Find (optional).** If the user names a protocol, the agent goes straight to it. If they only describe a goal ("swap my ETH"), the agent searches an index on Arkiv for matching ENS names.
3. **Discover.** The host reads and validates the manifest from ENS. A contract whose own primary name points back to the publishing name, or one of its subnames, is owner-verified; otherwise it's labelled name-only.
4. **Use.** Reads are plain contract calls. Writes are simulated, shown on a local signing page with the exact balance changes, and signed in the user's wallet.

Details: [spec/SPEC.md](spec/SPEC.md).

## Layout

| Path | What |
|---|---|
| `packages/sdk` | `@web3mcp/evm`: ENS discovery, reads, simulated writes and Arkiv search |
| `packages/mcp` | `@web3mcp/mcp`: the generic MCP server |
| `packages/approve-ui` | Local signing page where your own wallet signs each write |
| `plugins/claude-code` | Claude Code and Codex plugin: MCP server, a skill to use protocols, a skill to build them, and a hook that confirms every write |
| `plugins/codex` | Codex setup |
| `apps/publisher` | `web3mcp-publish` CLI: validate a manifest, check it against the chain, print the ENS records to publish, list a published name on the Arkiv search index, and search it |
| `apps/website` | Hosted website and documentation: [evm.web3mcp.org](https://evm.web3mcp.org) |
| `apps/explorer` | Hosted read-only explorer (planned) |
| `contracts` | Foundry: `AgentSwap`, the demo contract |
| `spec` | Specification and shared test fixtures |
| `arkiv` | How we use Arkiv: schema, feedback, and the write-ups for Arkiv's prize |

## Install

Claude Code:

```bash
claude plugin marketplace add Team-Managed/EVM-Web3MCP
```

```bash
claude plugin install web3mcp@evm-web3mcp
```

Codex installs the same plugin from the same marketplace:

```bash
codex plugin marketplace add Team-Managed/EVM-Web3MCP
```

```bash
codex plugin add web3mcp@evm-web3mcp
```

The plugin carries the server as one bundled file (`plugins/claude-code/server/`) with the signing page, so it needs only Node 22 or newer; nothing is downloaded from npm. Claude Code takes your wallet address from the plugin's options. In Codex, or any time, tell the agent your wallet ("my wallet is yourname.eth") and it sets it with the `wallet` tool. More on Codex, including a development launcher: [plugins/codex](plugins/codex/README.md).

## Build with Web3MCP

The `web3mcp-build` skill teaches a coding agent to make any contract agent-ready: write and check its manifest, design or upgrade the contract, and publish its tools on ENS. It ships with the plugin, and installs on its own in Claude Code, Codex, Cursor and other agents:

```bash
npx skills add Team-Managed/EVM-Web3MCP --skill web3mcp-build
```

It carries its own checker (`scripts/web3mcp-publish.mjs`), so it needs only Node 22. Try: "make my vault at 0x… usable by agents under vault.myprotocol.eth".

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

It's live on Sepolia at [`0xE17021E2fd5Dd0A6608293E7Ac5E3c361ae30e58`](https://sepolia.etherscan.io/address/0xE17021E2fd5Dd0A6608293E7Ac5E3c361ae30e58), owned by `web3mcp.eth`. `agentswap.web3mcp.eth` points at it and holds its manifest, and its primary name points back, so discovery marks it owner-verified. It was deployed through the deterministic CREATE2 deployer and published from the owner's wallet on the local signing page. The constructor takes the owner, Uniswap's PoolManager and Quoter, Chainlink's ETH/USD feed, and Circle's USDC.

## Search on Arkiv

A publisher lists its name on an index on [Arkiv](https://arkiv.network), so agents can find it by what it does. Each search term is an indexed attribute, so Arkiv itself finds the listings that match, and each listing expires unless the publisher refreshes it. Hosts keep only listings that still match the name's ENS record. Details: [spec section 6](spec/SPEC.md#6-search-arkiv) and [`arkiv/`](arkiv).

Search the index the way an agent's `search` tool does (after `npm ci` and `npm run build`):

```bash
npx web3mcp-publish search swap usdc
```

List a published name, or refresh its listing for another 30 days. Fund your wallet with tGLM from the [Arkiv faucet](https://hub.arkiv.network/faucet) first, then sign in your browser wallet, on the same local signing page agents use for writes. The page adds Arkiv's network to your wallet if it doesn't have it:

```bash
npx web3mcp-publish index agentswap.web3mcp.eth --browser <your-address>
```

Or sign with a [Foundry keystore](https://getfoundry.sh/cast/reference/wallet/import). Either way, no key goes in the environment:

```bash
npx web3mcp-publish index agentswap.web3mcp.eth --account web3mcp
```

Set `WEB3MCP_ARKIV_KEY` to an [Arkiv access key](https://hub.arkiv.network/access-keys) to avoid the public endpoint's rate limit. Listings live on Arkiv's Rabdi testnet (chain 7794095). Our listing of `agentswap.web3mcp.eth` was written by [`0x99230d725DaEFb3571917661755feBB309822ECb`](https://rabdi.explorer.arkiv.network/address/0x99230d725DaEFb3571917661755feBB309822ECb).

## Status

Working on Sepolia: discovery from ENS with trust checks (proxies included), reads with ENS-name inputs and formatted amounts, and writes that are simulated, shown on a local signing page and signed in your own wallet. Uniswap quotes run through dry-run reads. The demo contract swaps on Uniswap v4 with a Chainlink price check and passes its tests on a Sepolia fork. It's deployed and published at `agentswap.web3mcp.eth`. Published names can be listed on an Arkiv index, so an agent finds a protocol from a goal ("swap my ETH") when the user names none. Next: the explorer.

To try signing, set `WEB3MCP_ACCOUNT` to your Sepolia wallet before opening Claude Code in this repo, then ask it to swap 0.001 ETH for USDC on `agentswap.web3mcp.eth`. Get test ETH from a Sepolia faucet and test USDC from faucet.circle.com.

## License

Apache-2.0
