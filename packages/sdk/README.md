# @web3mcp/evm

Node.js SDK for Web3MCP on EVM chains.

Today it validates manifests: `validateManifest(json)` returns a typed manifest, or throws a `ManifestError` listing every problem, such as unknown contract aliases, undeclared inputs, wrong argument counts, or a read tool that calls a state-changing function.

Next: ENS discovery and the two-way trust check, reads, and write preparation with simulation. See [spec/SPEC.md](../../spec/SPEC.md).
