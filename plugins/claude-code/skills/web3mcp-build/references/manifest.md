# Writing a manifest

A manifest lists the tools agents get for a protocol. Name the file after the ENS name it will be published on, such as `vault.myprotocol.eth.json`, and run the checker on it. The checker runs the same validation as every host, so trust it over this page if the two disagree.

## Example

A vault holding USDC: one read, and two writes. Depositing approves the vault first; the host skips the approval when the allowance already covers it.

```json
{
  "web3mcp": "0.1-evm",
  "chainId": 11155111,
  "name": "vault.myprotocol.eth",
  "contracts": {
    "vault": "0x0000000000000000000000000000000000000001",
    "usdc": "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"
  },
  "tools": [
    {
      "name": "balance",
      "kind": "read",
      "description": "USDC a wallet has deposited in the vault.",
      "inputs": { "owner": { "type": "address", "description": "Wallet address or ENS name" } },
      "call": { "contract": "vault", "function": "function balanceOf(address owner) view returns (uint256)", "args": ["$input.owner"] },
      "output": { "decimalsFrom": "usdc", "symbol": "USDC" }
    },
    {
      "name": "deposit",
      "kind": "write",
      "description": "Deposit USDC into the vault.",
      "inputs": { "amount": { "type": "amount", "token": "usdc", "description": "USDC to deposit, such as 10.5" } },
      "steps": [
        { "approve": { "token": "usdc", "spender": "vault", "amount": "$input.amount" } },
        { "call": { "contract": "vault", "function": "function deposit(uint256 amount)", "args": ["$input.amount"] } }
      ]
    },
    {
      "name": "withdraw",
      "kind": "write",
      "description": "Withdraw USDC from the vault to a wallet: the user's own unless they name someone.",
      "inputs": {
        "amount": { "type": "amount", "token": "usdc", "description": "USDC to withdraw, such as 10.5" },
        "recipient": { "type": "address", "description": "Who gets the USDC: an address or ENS name" }
      },
      "steps": [
        { "call": { "contract": "vault", "function": "function withdraw(uint256 amount, address recipient)", "args": ["$input.amount", "$input.recipient"] } }
      ]
    }
  ]
}
```

A full live example is AgentSwap, published as `agentswap.web3mcp.eth`: [manifest](https://github.com/Team-Managed/EVM-Web3MCP/blob/main/spec/fixtures/valid/agentswap.web3mcp.eth.json), [contract](https://github.com/Team-Managed/EVM-Web3MCP/blob/main/contracts/src/AgentSwap.sol). The full rules are in the [spec](https://github.com/Team-Managed/EVM-Web3MCP/blob/main/spec/SPEC.md).

## Fields

- `web3mcp`: `"0.1-evm"`.
- `chainId`: the chain the contracts are on: 11155111 (Sepolia) or 1. The `web3mcp` plugin reads Sepolia only today; see "Supported chains" in [SKILL.md](../SKILL.md).
- `name`: the ENS name it's published on, lowercase.
- `contracts`: aliases to addresses. Aliases are lowercase identifiers (`^[a-z][a-z0-9_]{0,31}$`). `you` is reserved for the user's wallet. List every token a tool approves or formats, not just the protocol's contracts.
- `tools`: 1 to 32. Each has a `name` (a unique lowercase identifier), `kind` (`read` or `write`), a `description` (up to 500 characters) and `inputs`.

A read has one `call`, an optional `output`, and `dryRun` when needed. A write has 1 to 4 `steps`, each either `{ "call": … }` or `{ "approve": { "token", "spender", "amount" } }`.

A `call` names a contract alias, a human-readable `function` signature, one `args` binding per parameter (at most 8), and a `value` binding for `payable` functions only. Copy the signature from the ABI with its exact types, `view` or `payable` mutability, and `returns`; the checker compares mutability against the tool's kind.

## Inputs

| Type | The agent passes | The contract gets |
|---|---|---|
| `address` | an address or ENS name | the address |
| `amount` | a decimal string, such as `"10.5"`; needs `"token": "<alias>"` | scaled by that token's `decimals()` |
| `ether` | ETH as a decimal string, such as `"0.01"` | wei |
| `uint256` | a whole number as a string | the number |
| `bool` | `true` or `false` | the bool |
| `bytes32` | `0x` and 64 hex digits | the bytes |
| `string` | text | the text |

## Bindings

An argument is a literal or one of these:

- `$input.<name>`: a declared input.
- `$sender`: the user's wallet.
- `$contracts.<alias>`: an address from `contracts`.

Literals are parsed against the parameter's ABI type: numbers in base units (`"1000000"` is 1 USDC), `true` or `false`, addresses, and hex for fixed bytes.

## Rules the checker enforces

- Reads call `view` or `pure` functions. A function that changes state but is only meant to be simulated, such as Uniswap's Quoter, is allowed in a read with `"dryRun": true`; it must be non-payable, and hosts only ever run it with `eth_call`.
- Write steps call state-changing functions.
- An approval's `amount` is a literal in base units, or an `amount` input in the same token being approved.
- `value` only on `payable` functions; bind it to an `ether` input.
- The argument count matches the signature. Every alias, input and binding exists. Unknown fields fail.

## Good tools

- One tool per thing a user wants to do, named for it: `deposit`, `quote_eth_to_usdc`. Hosts expose reads as `<first label of the name>_<tool>` and writes as `tx_<first label>_<tool>`.
- Give agents a read for everything a write depends on: balances, quotes, limits, prices. Agents check state before and after a write.
- For a write that takes a minimum, provide a quote read and say so in the description: "Quote first and set min_usdc about 1% below the quote."
- Use `amount` with its token for token amounts and `ether` for ETH, never raw `uint256`. Add `output` to numeric reads so agents see `10.5 USDC`, not `10500000`.
- Where the output goes somewhere, take a `recipient` input described as "the user's own wallet unless they name someone".
- Keep it under about 4 KB. Every byte is stored on chain in a text record: AgentSwap's first publication (2.8 KB) took 10.7M gas, and a later update (3.2 KB) took 2.1M. One transaction can use at most 16,777,216 gas, so a much larger manifest won't fit in its first publication. `check` warns above 4,000 bytes.

## What doesn't fit yet

User functions that take structs (tuples), arrays or dynamic `bytes`; signatures (permit, EIP-712); negative numbers from inputs; or more than four transactions per action. Put an adapter contract with flat functions in front of them ([contracts.md](contracts.md), "Adapters"). The spec plans `abiEncode(...)` bindings for nested calldata.
