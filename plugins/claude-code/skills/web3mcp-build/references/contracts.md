# Contracts agents can use

Any contract can be published, but these choices decide whether agents can use it safely. AgentSwap ([source](https://github.com/Team-Managed/EVM-Web3MCP/blob/main/contracts/src/AgentSwap.sol)) follows all of them.

## Checklist for a new contract

1. **Flat user functions.** Arguments are `address`, `uint`/`int`, `bool`, `bytes32` or `string`. One external function per user action, even if it wraps struct-heavy internals. AgentSwap's `swapEthToUsdc(uint256 minUsdcOut, address recipient)` wraps Uniswap v4's `PoolKey` and `SwapParams`.
2. **The user is `msg.sender`.** The host simulates each write for the user's wallet, and the user sends it from that wallet. Never use `tx.origin`.
3. **An explicit `recipient`** wherever tokens or ETH go out.
4. **A minimum-out argument** on anything priced, and revert below it. The price can move between the simulation and the signature; agents quote first and pass about 1% below the quote.
5. **Reads for everything an agent needs:** balances, quotes, limits, prices. Make quotes `view` where you can. If a quote has to run state-changing code, as Uniswap's Quoter does, keep it non-payable and publish it with `dryRun`.
6. **Readable reverts.** `require` messages or named custom errors. The simulation shows the reason to the agent and the user before anyone signs.
7. **Tokens in by approve-then-call.** The manifest adds the approval step, and hosts skip it when the allowance is enough. Permit and other signatures aren't supported.
8. **ETH in by a `payable` function**, bound to an `ether` input.
9. **`decimals()` on any token** an `amount` input or an `output` refers to.
10. **An ERC-173 `owner()`.** ENS lets the address it returns set the contract's primary name, which is what makes the contract `owner-verified`. OpenZeppelin's `Ownable` works. So does an immutable `owner` with no other power, as in AgentSwap.
11. **Four transactions at most per action**, approvals included.

## Existing contracts

- **Immutable contracts:** publish a manifest for their flat user functions, with no code change. They are `owner-verified` only if they expose `owner()` and that owner sets their primary name. Otherwise they stay `name-only`, and hosts warn users and ask for an extra confirmation before writes.
- **Functions that don't fit**, because of struct, array or `bytes` arguments, signatures or too many steps: add an adapter.

## Adapters

A small contract with flat functions that calls the original for the user, as AgentSwap does for Uniswap v4.

- Pull tokens from `msg.sender`, after the manifest's approval to the adapter, and send the output straight to `recipient` in the same transaction. Hold nothing between transactions.
- Enforce the user's minimum in the adapter, not just in the underlying call.
- Give it `owner()` so it can be `owner-verified`, and list it and every token it touches in the manifest's `contracts`.
- Fork-test each path against the real protocol: `forge test --fork-url <rpc>`.

## Upgradeable contracts

- Discovery finds functions in the proxy's implementation for EIP-1967 proxies (transparent and UUPS), OpenZeppelin's older slot, EIP-1822 and EIP-1167 clones. Beacon proxies, diamonds (EIP-2535) and other custom proxies fail discovery, because their functions can't be found; put an adapter in front of them.
- Hosts record a fingerprint of the proxy's and implementation's code at discovery, and refuse writes after any change until the agent discovers the name again. An upgrade can't silently change what a user signs.
- **Adding functions:** upgrade first, then publish the manifest that uses them. `check` fails until the new implementation is live.
- **Removing or changing functions:** publish a manifest without them first, then upgrade.
- To make an upgradeable contract `owner-verified`, add `owner()` in the next implementation if it lacks one. ENS calls it through the proxy.

## Deploying

Deploy with a Foundry keystore, never a raw key: `forge create src/Vault.sol:Vault --account <keystore> --rpc-url <rpc> --broadcast --constructor-args …`. Verify the source on the block explorer so users and agents can read it. Then write the manifest for the deployed address and run `check`.
