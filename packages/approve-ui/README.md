# approve-ui (planned)

The local signing page the MCP server opens for every write, at `http://localhost:<port>/approve/<id>`.

It shows the protocol's ENS name and trust level, each call decoded, and the exact balance changes from simulation. The user connects their own wallet (an injected wallet such as MetaMask, or WalletConnect for a phone) and signs, batched with EIP-5792 `wallet_sendCalls` where supported. The page reports the transaction hash back to the MCP server, which the agent reads with `tx_status`.

Stack: Vite, React, wagmi and viem, built to static files that the MCP server serves.
