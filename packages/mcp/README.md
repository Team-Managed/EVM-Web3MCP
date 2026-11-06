# @web3mcp/mcp

One generic MCP server for every EVM contract that publishes Web3MCP tools. Claude Code and Codex install it through the plugins in [`plugins/`](../../plugins).

It starts with two tools:

- `discover(name)` loads a protocol's manifest, registers its tools (`<protocol>_<tool>` for reads, `tx_<protocol>_<tool>` for writes) and notifies the client that its tool list changed.
- `call(tool, args)` runs a discovered tool, for clients that don't refresh their tool list.

Until ENS discovery lands, `discover` reads `<ens-name>.json` from the folder in `WEB3MCP_MANIFEST_DIR`, and discovered tools are registered but don't run yet.

```bash
WEB3MCP_MANIFEST_DIR=spec/fixtures/valid node packages/mcp/dist/index.js
```
