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

- Node 24 for development (`.nvmrc`); published packages support Node 22+. Use npm only: no pnpm, Bun or Yarn lockfiles.
- `npm ci`, then `npm test`: builds every package, type-checks the tests, then runs them. Run `npm test` before every push.
- Everything is TypeScript. Tests are `.test.ts` files that Node runs directly, so import types with `import type`; the typecheck enforces it.
- Contracts use Foundry: `cd contracts && forge test`.

## Team rules for the hackathon

Follow these strictly.

1. **One source of truth for the manifest format.** The rules are in `spec/SPEC.md`, the schema in `packages/sdk/src/manifest.ts`, the examples in `spec/fixtures/`. Change all three in the same commit; the tests fail if they disagree.
2. **Stay in your area.** Areas: SDK and MCP server (`packages/sdk`, `packages/mcp`); signing page (`packages/approve-ui`); contracts and ENS publishing (`contracts`, `apps/publisher`); Uniswap manifest; explorer (`apps/explorer`). Don't edit another area's files without telling its owner.
3. **Short branches, merged often.** Name branches by area, such as `sdk/ens-discovery`. Open a PR so CI runs. `main` must always build and be demo-able.
4. **Small, frequent commits.** ETHGlobal reads the git history. Note AI assistance in every AI-assisted commit message, per ETHGlobal's AI policy.
5. **No secrets, ever.** Never commit private keys, seed phrases, wallet files, API keys or `.env` files. Deploy contracts with a Foundry keystore, not a private key in `.env`.
6. **Mark shortcuts.** Write any known limitation as a `shortcut: <limit>, <when to fix>` comment. `grep -r "shortcut:"` lists what's left.
7. **Commit the plugin bundles.** The Claude Code plugin ships the server as one file in `plugins/claude-code/server/`, and the builder skill's checker in `plugins/claude-code/skills/web3mcp-build/scripts/`. `npm run build` regenerates both. Commit them with any change to the SDK, server, signing page or publisher; CI fails when anything in `plugins/claude-code` is stale.
8. **Agent files stay local.** Never commit agent planning or tracking files: plans, specs or notes written for agents, task lists, trackers, scratch files, session memory, `.claude/`, `.codex/`, `.agents/`, `CLAUDE.local.md`. Keep them on your own machine. Only product and project files go in the repo. This file and `CLAUDE.md` are the only agent files in the repo; change them only when the team agrees.
