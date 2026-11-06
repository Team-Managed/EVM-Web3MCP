# Reach

## Who it's for

- **People who use AI agents for on-chain actions**, in Claude Code or Codex. They describe a goal ("swap my ETH for USDC"), and search finds a protocol that publishes tools for it, so they don't need to know its ENS name.
- **Protocol teams** that publish Web3MCP tools. One command lists them on the index, where every compatible agent can find them, with no sign-up and no gatekeeper.

## Can they try it today?

Yes, on Sepolia and Arkiv's Rabdi testnet:

- Search the index: `npx web3mcp-publish search swap usdc` (after `npm ci && npm run build`).
- Use it from an agent: install the plugin (see the [README](../README.md#install)) and ask for a swap without naming a protocol.
- List your own protocol: publish a manifest on your ENS name, then run `npx web3mcp-publish index <your-name.eth> --account <keystore>`.

## Numbers

- Listed names: TODO, after the first listings are written.
- Terms per listing: 28 for `agentswap.web3mcp.eth`, the most one Arkiv entity holds alongside our columns.
- Cost of a listing: about 0.00086 tGLM for AgentSwap's at the gas price when we estimated it.

## After Mumbai

TODO: the team to say whether development continues, and what comes next.
