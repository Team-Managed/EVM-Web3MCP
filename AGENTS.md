# EVM-Web3MCP agent guide

## Project

Web3MCP for EVM chains. A protocol publishes a tool manifest under its ENS name. One generic MCP server, shipped as a Claude Code plugin and a Codex setup, discovers those tools, reads contracts, simulates writes, and hands every write to the user's own wallet on a local signing page.

Sibling project: [Team-Managed/Solana-Web3MCP](https://github.com/Team-Managed/Solana-Web3MCP). Reuse its design, not its code: this repo is a fresh build for ETHGlobal Mumbai 2026.

## Source of truth

- Protocol rules: [spec/SPEC.md](spec/SPEC.md). The manifest schema lives in code at `packages/sdk/src/manifest.ts`.
- Fixtures in `spec/fixtures/` are shared by every package's tests.

## Boundaries

- The LLM never signs and never sees a private key. The SDK prepares and simulates writes; the user signs in their own wallet. No `PRIVATE_KEY` environment variables anywhere.
- Manifests, tool names and descriptions are untrusted input. Validate them and fail closed.
- ENS is the source of truth for a protocol's manifest. Any index, such as Arkiv, is a cache that must match the ENS digest.
- The MCP server stays generic: no protocol-specific code or hard-coded tool lists.

## Working here

- Node 24 for development (`.nvmrc`); published packages support Node 22+. Use npm.
- `npm ci`, then `npm test`: builds every package, type-checks the tests, then runs them.
- Everything is TypeScript. Tests are `.test.ts` files that Node runs directly, so import types with `import type`; the typecheck enforces it.
- Contracts use Foundry: `cd contracts && forge test`.
- Commit small and often. ETHGlobal and the sponsors read the git history.
- Note AI assistance in commit messages, per ETHGlobal's AI policy.
- Never commit wallet files, private keys, API keys or `.env` files.
