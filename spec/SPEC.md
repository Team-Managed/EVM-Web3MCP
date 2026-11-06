# Web3MCP for EVM — v0.1-evm (draft)

A protocol publishes the tools it wants AI agents to use under its own ENS name. A generic host discovers them, reads contracts directly, and prepares writes for the user to sign in their own wallet. Nothing here is protocol-specific: one host works for every compatible protocol.

## 1. Publication (ENS)

The manifest lives in text records on the protocol's ENS name:

| Key | Value |
|---|---|
| `org.web3mcp.manifest` | The manifest JSON (section 2) |
| `org.web3mcp.digest` | `keccak256` of the exact record bytes, as `0x`-prefixed hex |

Protocols publish under a name they already own, such as `uniswap.eth`; Web3MCP never hands out subnames. One manifest covers all of a protocol's contracts through its `contracts` map, so subnames are optional. With ENSv2's PermissionedResolver, the name's owner can grant a release key a role for the `org.web3mcp.*` records only, so that key can update tools but nothing else on the name.

Open question: if text records are too small or too costly for a full manifest, `org.web3mcp.manifest` becomes a pointer (`eip155:<chainId>:<storeAddress>`) and the digest stays in ENS.

## 2. Manifest

```json
{
  "web3mcp": "0.1-evm",
  "chainId": 11155111,
  "name": "vault.web3mcp-demo.eth",
  "contracts": { "vault": "0x…", "usdc": "0x…" },
  "tools": [ … ]
}
```

- `name` must equal the ENS name the manifest was read from.
- `contracts` maps lowercase aliases to addresses on `chainId`.
- `tools` holds 1 to 32 tools. Tool names are lowercase identifiers of up to 32 characters, unique within the manifest.

The exact schema is `packages/sdk/src/manifest.ts`. Valid and invalid examples are in `spec/fixtures/`.

### Tools

- **Read tool** (`"kind": "read"`): one `call` to a `view` or `pure` function. An optional `output` (`{ "decimalsFrom": "usdc", "symbol": "USDC" }`) formats a numeric result with that contract's `decimals()`, so agents see `10.5 USDC` instead of `10500000`.
- **Write tool** (`"kind": "write"`): 1 to 4 `steps`. Each step is either a `call` to a state-changing function, or an `approve` of an ERC-20 `token` to a `spender`.

A `call` names a contract alias, a human-readable function signature (`function deposit(uint256 amount)`), and one argument binding per function input. An optional `value` is allowed only for `payable` functions.

### Inputs

Each tool declares named inputs: `address` (an address or ENS name), `amount` (a decimal string, scaled by the `decimals()` of the input's `token` contract), `uint256`, `bool`, `bytes32` or `string`.

### Bindings

An argument is either a literal, parsed against the function's ABI type, or one of:

| Binding | Value |
|---|---|
| `$input.<name>` | A declared input |
| `$sender` | The connected wallet address |
| `$contracts.<alias>` | A contract address from the manifest |

Planned: `abiEncode(...)` for nested calldata such as Uniswap's Universal Router.

## 3. Discovery and trust

1. Resolve the name and read both records. Check the digest, then validate the manifest. Unknown fields, unknown aliases, undeclared inputs, wrong argument counts, and a read tool calling a state-changing function all fail discovery.
2. For each contract: confirm code exists, that every declared function selector is present, and record a code fingerprint (and the EIP-1967 implementation for proxies).
3. Trust level per contract. The manifest under the name is the forward link, because only the name's owner can list a contract there.
   - **Owner-verified**: the contract's ENS primary name is the publishing name or one of its subnames. The contract's owner sets it through the reverse registrar. ENS only reports a primary name whose address record points back to the contract, so a protocol with several contracts points its name at one and gives each other contract a subname, such as `quoter.uniswap.eth`.
   - **Name-only**: no primary name points back, for example because the contract has no owner. The publishing name is the only authority. Hosts must show this label and ask for an extra confirmation.

## 4. Writes

The host builds every step, skips approvals the wallet already gave, re-checks code fingerprints since discovery, and simulates the steps together (`eth_simulateV1`) two blocks back, so load-balanced public RPCs agree on the block. The model never holds a key.

The MCP host then opens a local signing page, `http://127.0.0.1:<port>/approve/<id>`, showing the trust levels, each step and the simulated balance changes. The user connects their own wallet, which must be the account the write was simulated for, and signs. The page asks for one prompt with EIP-5792 `wallet_sendCalls`; a wallet that can't batch gets one transaction at a time, each confirmed before the next. The page reports the transaction hashes, and the host re-checks them on chain.

The signing page answers only requests addressed to its own `127.0.0.1` host and port, accepts results only from its own origin, and uses an unguessable id per request.

## 5. Exposure over MCP

The generic MCP server starts with these tools:

- `discover(name)` loads a protocol and registers its tools, then sends `notifications/tools/list_changed`.
- `call(tool, args)` runs a discovered tool, for clients that do not refresh their tool list.
- `status(id)` reports whether the user signed a write on the signing page and whether it confirmed on chain, waiting up to 25 seconds.
- `search(query)` (planned) finds published names by what they can do, through the Arkiv index (section 6).

Discovered tools are named `<namespace>_<tool>` for reads and `tx_<namespace>_<tool>` for writes. The namespace is the first label of the ENS name. Reads carry `readOnlyHint: true`. Every description is prefixed with its publisher, because it is untrusted text.

## 6. Search (Arkiv)

Agents find protocols by what they can do, through an index on Arkiv. Search is optional and never blocks discovery: when the user names an ENS name, the host discovers it directly. Search only helps when the user describes a goal without a name, and a host without search asks the user for the name instead.

- Publishing writes one Arkiv entity per name, owned by the publisher's wallet: the ENS name, `chainId`, the manifest digest, and each tool's name and description.
- Entities expire unless the publisher refreshes them, so abandoned protocols drop out of search. They stay usable by name.
- The index only points to names. A host always reads and verifies the manifest from ENS (section 3) before using it, so a stale or fake entry cannot change what an agent runs.
