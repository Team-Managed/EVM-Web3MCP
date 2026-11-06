# Web3MCP for EVM — v0.1-evm (draft)

A protocol publishes the tools it wants AI agents to use under its own ENS name. A generic host discovers them, reads contracts directly, and prepares writes for the user to sign in their own wallet. Nothing here is protocol-specific: one host works for every compatible protocol.

## 1. Publication (ENS)

The manifest lives in text records on the protocol's ENS name:

| Key | Value |
|---|---|
| `org.web3mcp.manifest` | The manifest JSON (section 2) |
| `org.web3mcp.digest` | `keccak256` of the exact record bytes, as `0x`-prefixed hex |

Each contract can have its own subname (`vault.example.eth`) whose `addr` record points to it. With ENSv2's PermissionedResolver, the protocol grants its release key a role for the `org.web3mcp.*` records only, so that key can update tools but cannot change address records.

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

- **Read tool** (`"kind": "read"`): one `call` to a `view` or `pure` function.
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
3. Trust level per contract:
   - **Owner-verified**: the name's `addr` record points to the contract, and the contract's ENS primary name points back to the name.
   - **Publisher-only**: only the forward record matches, as for third-party contracts. Hosts must show this label and ask for an extra confirmation.

## 4. Writes

The host builds every step, simulates them together (`eth_simulateV1`), and shows the user the decoded calls and exact balance changes. It re-checks code fingerprints just before sending, then asks the user's wallet to sign, batched with EIP-5792 `wallet_sendCalls` where supported. The model never holds a key.

## 5. Exposure over MCP

The generic MCP server starts with two tools:

- `discover(name)` loads a protocol and registers its tools, then sends `notifications/tools/list_changed`.
- `call(tool, args)` runs a discovered tool, for clients that do not refresh their tool list.

Discovered tools are named `<namespace>_<tool>` for reads and `tx_<namespace>_<tool>` for writes. The namespace is the first label of the ENS name. Reads carry `readOnlyHint: true`. Every description is prefixed with its publisher, because it is untrusted text.
