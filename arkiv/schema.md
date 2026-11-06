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
| `t.<term>` | `bool` | yes | every search, as `EXISTS(t.<term>)` | `true`; one per search term, up to 28 |

The terms are the manifest's `keywords`, then words from its tool names, contract aliases and descriptions. An entity holds at most 32 attributes; the tag and three columns use 4, which leaves 28 for terms. The AgentSwap listing uses all 28: its keywords `swap, exchange, trade, convert, dex, uniswap, eth, ether, usdc, stablecoin, quote, price`, then words from its tools such as `chainlink` and `dollar`.

**Owner:** the publisher's wallet, which signs with `web3mcp-publish index`. Only that wallet can extend or delete the listing. Anyone can write a listing that claims any name, even one that copies a real name's digest. So a listing only points to a name: hosts keep it only while its `digest` is keccak256 of the name's manifest record on ENS, and show the terms and description from that manifest, never from the listing. The listing carries no text of its own.

**Expires:** 30 days after it is written or last refreshed. Running `web3mcp-publish index` again extends it if the manifest is unchanged. If the manifest changed, the same transaction deletes the old listing and writes a new one. A protocol that stops refreshing drops out of search, but stays usable by name through ENS.

## The query a host runs

```
arkiv.schema = "web3mcp.listing" && chainId = 11155111 && (EXISTS(t.swap) || EXISTS(t.usdc))
```

Run it with:

```bash
npx web3mcp-publish search swap usdc
```
