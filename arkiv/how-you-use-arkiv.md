# How we use Arkiv

Arkiv holds the Web3MCP search index: one listing per published ENS name (see [schema.md](schema.md)). Every Arkiv feature we use changes what a user sees.

| Arkiv feature | How we use it | What the user sees |
|---|---|---|
| Indexed attributes and filters | Each search term is an indexed attribute (`t.swap`). A search is one query: `arkiv.schema = "web3mcp.listing" && chainId = <id> && (EXISTS(t.swap) \|\| EXISTS(t.usdc) \|\| …)` | Asking "swap my ETH for USDC" without naming a protocol finds `agentswap.web3mcp.eth`. The filtering happens on Arkiv, not by downloading every listing. |
| `chainId` filter | Hosts only ask for listings on their own chain | A Sepolia user is never offered a mainnet protocol, or the reverse |
| Ownership | The publisher's wallet owns its listing. `index` finds the listing with `ownedBy(wallet)`, and only that wallet can extend or delete it | Results show who listed each name. Nobody else can edit or remove a publisher's listing |
| Expiration | 30 days, extended by running `index` again | Protocols that stop maintaining their listing drop out of search |
| Batch transactions | When a manifest changes, the old listing is deleted and the new one written in one `executeBatch` | Search never shows a name twice, or a half-updated listing |

The `digest` attribute ties each listing to ENS: hosts keep a listing only while it matches the name's current `org.web3mcp.digest` record. So a stale or fake listing can't send an agent somewhere unexpected, and the agent still discovers and checks the name on chain before using it.

## Try it

```bash
npm ci && npm run build
npx web3mcp-publish search swap usdc
```

In Claude Code with the plugin installed, ask *"swap 0.001 ETH for USDC"* without naming a protocol. The agent calls `search`, picks a name from the index, then discovers it from ENS.

## How we used AI

We built this with AI coding assistants (Claude Code). Every AI-assisted commit says so in its message, as ETHGlobal's rules require.
