# approve-ui

The local signing page. The MCP server opens it for every write at `http://127.0.0.1:<port>/approve/<id>`.

It shows the protocol and each contract's trust level, every step in readable form, and the simulated balance changes. The user connects their own browser wallet (MetaMask, Rabby, or anything that injects `window.ethereum`), which must be the account the write was simulated for, and signs:

- One wallet prompt for all steps, through EIP-5792 `wallet_sendCalls`, when the wallet already supports batching. The page never asks a plain account to upgrade to a smart account.
- Otherwise one transaction at a time, each confirmed before the next, so later steps see earlier ones.
- Declining the transaction rejects the request. An error before anything is sent can be retried.

The page reports the transaction hashes to the MCP server, which re-checks them on chain when the agent calls `status`. All text is inserted as text nodes, never HTML, because steps come from untrusted manifests.

Source: `src/page.ts` and `src/page.css`, plain TypeScript and viem. `npm run build` in `packages/mcp` bundles them with esbuild into the MCP server's `dist/approve/`, so they ship with `@web3mcp/mcp`.
