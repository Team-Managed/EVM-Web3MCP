# @web3mcp/evm

Node.js SDK for [Web3MCP](https://github.com/Team-Managed/EVM-Web3MCP) on EVM chains: use any contract that publishes AI-agent tools under its ENS name. Pass it a viem `PublicClient`. It never signs anything.

```bash
npm install @web3mcp/evm viem
```

```ts
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { discover, executeRead, prepareWrite } from '@web3mcp/evm';

const client = createPublicClient({ chain: sepolia, transport: http() });
const protocol = await discover(client, 'agentswap.web3mcp.eth');

console.log(protocol.contracts.swap.trust); // 'owner-verified'
const quote = await executeRead(client, protocol, 'quote_eth_to_usdc', { amount: '0.01' }); // such as '250.663701 USDC'
const minUsdc = (parseFloat(String(quote)) * 0.99).toFixed(6); // accept about 1% less

// Built and simulated for the wallet; hand write.calls to the user's own wallet to sign.
const wallet = '0xYourWallet';
const write = await prepareWrite(client, protocol, 'eth_to_usdc', { amount: '0.01', min_usdc: minUsdc, recipient: wallet }, wallet);
console.log(write.calls, write.assetChanges);
```

- `discover(client, name)` reads a protocol's manifest from its ENS text records, checks the digest and the manifest, confirms each contract exists and has the declared functions (following common proxies), and sets each contract's trust: **owner-verified** when its ENS primary name points back to the publishing name or one of its subnames, otherwise **name-only**.
- `executeRead(client, protocol, tool, input)` runs a read. Address inputs accept ENS names, and results are formatted when the tool declares `output`, such as `10.5 USDC`.
- `prepareWrite(client, protocol, tool, input, account)` builds the write's calls, skips approvals the wallet already gave, re-checks that no contract changed since discovery, and simulates everything together. It returns the calls and the wallet's balance changes. Simulation needs an RPC with `eth_simulateV1`.
- `validateManifest(json)` checks a manifest offline, for publishing tools.

Works with viem 2.30 or newer, on Node 22 or newer. The protocol rules are in the [spec](https://github.com/Team-Managed/EVM-Web3MCP/blob/main/spec/SPEC.md).
