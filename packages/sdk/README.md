# @web3mcp/evm

Node.js SDK for Web3MCP on EVM chains. Pass it a viem `PublicClient`.

- `discover(client, name)` reads a protocol's manifest from its ENS text records, checks the digest and the manifest, confirms each contract exists and has the declared functions (following common proxies), and sets each contract's trust: **owner-verified** when its ENS primary name points back to the publishing name, otherwise **name-only**.
- `executeRead(client, protocol, tool, input)` runs a read. Address inputs accept ENS names, and results are formatted when the tool declares `output`, such as `10.5 USDC`.
- `prepareWrite(client, protocol, tool, input, account)` builds the write's calls, skips approvals the wallet already gave, re-checks that no contract changed since discovery, and simulates everything together. It returns the calls and the wallet's balance changes. It never signs.
- `validateManifest(json)` checks a manifest offline, for publishing tools.

See [spec/SPEC.md](../../spec/SPEC.md).
