# Publishing on ENS

## What hosts check

1. The name's `org.web3mcp.manifest` text record holds the manifest, and `org.web3mcp.digest` holds the keccak256 of those exact bytes. A mismatch fails discovery.
2. The manifest's `name` field is that ENS name.
3. Each contract's trust level. It is `owner-verified` when the contract's ENS primary name is the publishing name or one of its subnames. ENS only reports a primary name whose address record points back to the contract. Otherwise it is `name-only`.

## First publication

1. **A name you own on the contracts' chain.** Use sepolia.app.ens.domains for Sepolia and app.ens.domains for mainnet. A subname of the protocol's existing name works, such as `vault.myprotocol.eth`. Web3MCP never hands out names.
2. **An address record.** Point the name at the main contract: in the ENS app, Records, then the ETH address. Give each other contract a subname pointing at it, such as `quoter.myprotocol.eth`, if it should be `owner-verified` too.
3. **A primary name for each contract,** sent from the address its `owner()` returns:
   - Sepolia (ENSv2), the call AgentSwap used: `cast send 0x36f97328e843e37520cbF530e9402791c2754066 "setName(address,string)" <contract> <name> --account <owner-keystore> --rpc-url <rpc>` on the DefaultReverseRegistrarAdapter.
   - ENS v1 deployments: `setNameForAddr(address addr, address owner, address resolver, string name)` on the ReverseRegistrar, the owner of `addr.reverse` in the ENS registry.
   - Elsewhere, or if neither applies, follow the current ENS docs for naming a contract. Run `check` afterwards either way to confirm.
   - A contract without `owner()` stays `name-only`.
4. **Check the manifest:** `node <skill>/scripts/web3mcp-publish.mjs check <name>.json`.
5. **Publish both text records in one transaction**, so no host ever sees a manifest without its matching digest:
   - In the ENS app: add the text records `org.web3mcp.manifest` (the JSON line `check` printed, exactly) and `org.web3mcp.digest`, and save them in the same edit.
   - With Foundry: run the `cast send <resolver> --data 0x… --account <keystore>` command `check` printed. It is one `multicall` of both `setText` calls, for the resolver version on the name: ENS v1's PublicResolver or ENSv2's PermissionedResolver. Only accounts with the right to set text records on the name can send it; it reverts for anyone else.
6. **Confirm:** `check <name>` must say the name is published and the digest matches, with the trust levels you expect.

## Updating

- Edit the manifest, run `check` (it shows what ENS holds now), and publish both records again in one transaction. Hosts pick up the change at their next `discover`.
- A contract at a new address: update `contracts`, then the address record and the new contract's primary name.
- Upgrading a proxy: see "Upgradeable contracts" in [contracts.md](contracts.md) for the order of upgrade and publication.
- ENSv2 resolvers support per-record roles, so the name's owner can give a separate release key the right to set only the `org.web3mcp.*` records. See the ENS docs for the current call.
