# @web3mcp/mcp

One generic MCP server for every EVM contract that publishes Web3MCP tools. Claude Code and Codex install it through the plugins in [`plugins/`](../../plugins).

Its main tools:

- `discover(name)` reads a protocol's tools from its ENS name, checks its contracts, registers the tools (`<protocol>_<tool>` for reads, `tx_<protocol>_<tool>` for writes), and notifies the client that its tool list changed.
- `search(terms)` finds protocols by what they can do, through the [Arkiv index](../../spec/SPEC.md#6-search-arkiv), when the user names no protocol.
- `call(tool, args)` runs a discovered tool, for clients that don't refresh their tool list.
- `status(id)` reports whether you signed a write and whether it confirmed on chain.

Reads run straight away. A write is prepared and simulated, then the server opens the [signing page](../approve-ui) in your browser, where your own wallet signs. The agent never holds a key.

## Settings

| Variable | Meaning |
|---|---|
| `WEB3MCP_ACCOUNT` | Your wallet address or ENS name, used to simulate writes. Never a key. |
| `WEB3MCP_RPC_URL` | RPC endpoint. Empty uses the chain's public default; use your own for demos, as public endpoints are sometimes flaky. |
| `WEB3MCP_CHAIN` | `sepolia` (default) or `mainnet` |
| `WEB3MCP_ARKIV_KEY` | Optional [Arkiv access key](https://hub.arkiv.network/access-keys) for search. Without one, search uses Arkiv's rate-limited public endpoint. |
| `WEB3MCP_MANIFEST_DIR` | Development only: a folder of `<ens-name>.json` manifests checked before ENS |

```bash
WEB3MCP_MANIFEST_DIR=spec/fixtures/valid node packages/mcp/dist/index.js
```
