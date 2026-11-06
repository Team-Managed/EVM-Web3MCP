# Arkiv schema

Web3MCP writes one kind of entity: a **listing**, which tells agents that an ENS name publishes Web3MCP tools and what they can be found by. The rules are in [spec section 6](../spec/SPEC.md#6-search-arkiv); the code is [`packages/sdk/src/search.ts`](../packages/sdk/src/search.ts).

Network: Arkiv's Rabdi testnet, chain 7794095.

## `web3mcp.listing`

One per ENS name and publisher wallet. Tagged `arkiv.schema = "web3mcp.listing"`.

| Attribute | Type | Indexed | Queried by | Value |
|---|---|---|---|---|
| `arkiv.schema` | `str` | yes | every search | `web3mcp.listing` |
| `ens` | `str` | yes | the publisher, to find its own listing | ENS name, such as `agentswap.web3mcp.eth` |
| `chainId` | `u64` | yes | every search | Chain the manifest is on, such as `11155111` (Sepolia) |
| `digest` | `str` | yes | hosts, after the query | The name's `org.web3mcp.digest` ENS record when the listing was written |
| `about` | `bytes` | no | shown in results | The manifest's `description` (up to 200 characters, more than a `str` holds) |
| `t.<term>` | `bool` | yes | every search, as `EXISTS(t.<term>)` | `true`; one per search term, up to 27 |

The terms are the manifest's `keywords`, then words from its tool names, contract aliases and descriptions. An entity holds at most 32 attributes; the tag and four columns use 5, which leaves 27 for terms. The AgentSwap listing uses all 27: `swap, exchange, trade, convert, dex, uniswap, eth, ether, usdc, stablecoin, quote, price, …`.

**Owner:** the publisher's wallet, which signs with `web3mcp-publish index`. Only that wallet can extend or delete the listing. Anyone can write a listing that claims any name, so hosts keep a listing only while its `digest` equals the name's current ENS record.

**Expires:** 30 days after it is written or last refreshed. Running `web3mcp-publish index` again extends it if the manifest is unchanged. If the manifest changed, the same transaction deletes the old listing and writes a new one. A protocol that stops refreshing drops out of search, but stays usable by name through ENS.

## The query a host runs

```
arkiv.schema = "web3mcp.listing" && chainId = 11155111 && (EXISTS(t.swap) || EXISTS(t.usdc))
```

Run it with:

```bash
npx web3mcp-publish search swap usdc
```
