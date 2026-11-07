# Reach

## Who it's for

- **People who use AI agents for on-chain actions**, in Claude Code or Codex. They describe a goal ("swap my ETH for USDC"), and search finds a protocol that publishes tools for it, so they don't need to know its ENS name.
- **Protocol teams** that publish Web3MCP tools. One command lists them on the index, where every compatible agent can find them, with no sign-up and no gatekeeper.

## Can they try it today?

Yes, on Sepolia and Arkiv's Rabdi testnet:

- Search the index: `npx web3mcp-publish search swap usdc` (after `npm ci && npm run build`).
- Use it from an agent: install the plugin (see the [README](../README.md#install)) and ask for a swap without naming a protocol.
- List your own protocol: publish a manifest on your ENS name, then run `npx web3mcp-publish index <your-name.eth> --browser <your-address>` and sign in your browser wallet.

## Numbers

- Listed names: 1, `agentswap.web3mcp.eth`, as of 7 November 2026. It's written by [`0x99230d725DaEFb3571917661755feBB309822ECb`](https://rabdi.explorer.arkiv.network/address/0x99230d725DaEFb3571917661755feBB309822ECb).
- Terms per listing: 28 for `agentswap.web3mcp.eth`, its 12 keywords and then words from its tools, the most one Arkiv entity holds alongside our columns. A search for "convert ether to dollars" matches three of them.
- Cost of a listing: about 0.00086 tGLM for AgentSwap's at the gas price when we estimated it.

## After Mumbai

We plan to keep building Web3MCP after Mumbai. Next:

- Search in the Codex setup, so every host finds protocols by goal.
- The explorer: a public page that reads the Arkiv listings and shows every protocol in the agent web.
- More protocols listing themselves, starting with the ones our builder skill helps publish.
- Mainnet: ENS on Ethereum, and Arkiv's production network when it's available.
