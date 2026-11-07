# approve-ui

The local signing page. The MCP server opens it for every write at `http://127.0.0.1:<port>/approve/<id>`. The publisher CLI opens it too, for `web3mcp-publish index --browser`: there it signs the Arkiv listing, and asks the wallet to add Arkiv's network if the wallet doesn't have it.

It reads top to bottom as a route: your wallet, then each step in plain words ("Allow swap to use 5 USDC", "Swap USDC to ETH") with its contract, trust level and arguments as you typed them, then your simulated balance after. While you sign, each step shows whether it's waiting for your wallet, confirming on chain or done, with a link to its transaction. Raw calldata is folded under Technical details. The user connects their own browser wallet (MetaMask, Rabby, or anything that injects `window.ethereum`), which must be the account the write was simulated for, and signs:

- One wallet prompt for all steps, through EIP-5792 `wallet_sendCalls`, when the wallet already supports batching. The page never asks a plain account to upgrade to a smart account.
- Otherwise one transaction at a time, each confirmed before the next, so later steps see earlier ones.
- Declining the transaction rejects the request. An error before anything is sent can be retried.

The page reports the transaction hashes to the MCP server, which re-checks them on chain when the agent calls `status`. All text is inserted as text nodes, never HTML, because steps come from untrusted manifests.

Source: `src/page.ts` and `src/page.css`, plain TypeScript and viem. `npm run build` in `packages/mcp` bundles them with esbuild into the MCP server's `dist/approve/`, so they ship with `@web3mcp/mcp`.
