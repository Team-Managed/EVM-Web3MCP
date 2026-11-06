# Arkiv feedback

Notes from building the Web3MCP search index on Rabdi with `@arkiv-network/sdk` 1.0.1.

## Bugs and confusing errors

**"Insufficient funds" is reported as "Execution error without revert data".**
- Expected: an unfunded account's write fails with a message about funds.
- Happened: `createEntity` and `executeBatch` throw `EntityMutationError: Transaction failed: Execution error without revert data`. The real reason is six levels down the `cause` chain: `insufficient funds for gas * price + value: have 0 want 180817200000000`.
- Reproduce: generate a fresh key with viem, then `createWalletClient({ chain: rabdi({ accessKey: "" }), transport: http(), account })` and `createEntity(defineSchema("probe", { a: str().indexed() }), { a: "x" }, { expiration: ExpirationTime.fromHours(1) })`.
- We work around it by printing the root cause's `details` in our CLI.

**`executeBatch` can't infer a conditional list of creates.**
- `executeBatch({ creates: done ? [] : [entry] })` fails to type-check, because the creates are inferred as `readonly []`. Annotating the array as `CreateEntityParameters[]` fixes it.

## What we'd like improved

- **Text search.** Filters are equality, ranges, `startsWith` and `EXISTS`, with no "contains" or multi-valued attribute. For keyword search we store each term as its own indexed attribute (`t.swap`) and query `EXISTS(t.a) || EXISTS(t.b)`. A string-set attribute, or "contains" on an indexed string, would make this direct.
- **32 attributes per entity.** That caps a listing at 27 terms. One string set (above) would remove the need for many attributes.
- **Typed queries over dynamic attributes.** A schema's `where` only takes the schema's own columns, so our per-term attributes need an untyped query, with values unwrapped from `{ type, value }` by hand.
- **`str` is 128 bytes.** That's short for a one-line description (we allow 200 characters), so ours goes in `bytes`. It's documented, but surprising.
- **Docs drift.** The npm README's install output shows `"@arkiv-network/sdk": "^0.9.0"` while npm has 1.0.1. Web search also turns up docs for SDK 0.4.4 on the `mendoza` chain and 0.6.0 on `kaolin`, while the current testnet is Rabdi.
- **Keys in `.env`.** The README's first example puts `PRIVATE_KEY` in `.env`. An example that signs with a keystore or a browser wallet would steer people away from that. We decrypt a Foundry keystore with `cast` instead.

## What worked well

- The query builder and `EXISTS` worked on the live testnet the first time, including selecting attributes by name without a schema.
- Gas estimation runs the whole batch, so a malformed entity fails before anything is sent. We checked the full 27-term listing this way from an unfunded account: the only error was the funds error.
- `executeBatch` made "delete the old listing and write the new one" a single atomic transaction.
