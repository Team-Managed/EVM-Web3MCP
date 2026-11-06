# GiftBox: gifts that follow an ENSv2 name

GiftBox is an original, independent Sepolia demo for `gifts.web3mcp.eth`, deployed at `0xdcF1c9809aA58C7C390753E43dE25Dd064F7eda8`. It is published at `gifts.web3mcp.eth`, and its primary name is that name, so discovery marks it `owner-verified`. AgentSwap remains separate. Unlike address-at-send gifting, the beneficiary is whoever owns the recipient name when claiming, not the wallet that owned it when the sender deposited, and not its resolver's address record.

## Verified Sepolia deployment

The local deployment verifier independently read the transaction, successful receipt, deployed runtime and constructor getters on 7 November 2026. This manual on-chain check is separate from automated tests; explorer source-code verification has not been performed.

| Field | Verified value |
|---|---|
| Chain | Sepolia, `11155111` |
| GiftBox | `0xdcF1c9809aA58C7C390753E43dE25Dd064F7eda8` |
| Deployment transaction | [`0xb72abd0a946f2b1b583d72dd8715ef6272246b3b2672af86a2daa014bfe56f54`](https://sepolia.etherscan.io/tx/0xb72abd0a946f2b1b583d72dd8715ef6272246b3b2672af86a2daa014bfe56f54) |
| Block / gas used | `12079133` / `10851847` |
| Runtime keccak256 | `0x50501f8be841499422f49c5a4f6273663eea91f544f7cf61751c81b1a585405b` |
| Constructor `owner_` / getter `owner()` | `0x99230d725DaEFb3571917661755feBB309822ECb` (web3mcp.eth's owner; ENS lets it set GiftBox's primary name, nothing else) |
| Constructor `usdc_` / getter `usdc()` | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` (Circle Sepolia USDC, 6 decimals) |
| Constructor `root_` / getter `root()` | `0xB458D6a3a77919449d03e7A6903C26827c1eC43f` (immutable) |
| CREATE2 factory | `0x4e59b44847b379578588920cA78FbF26c0B4956C` |
| Deployment wallet | `0x99230d725DaEFb3571917661755feBB309822ECb` |
| Salt | `0x8b4f7a949cac977df2f05b69a4c486d645a30e57166d88d616bc8545d12c653d` |
| Init-code keccak256 | `0x0699dce7a9dd22adb2611a4a916e1dcc3ee7426f48c2a3e94e62d2d340f434cc` |

The selected root's `.eth` subregistry was checked as `0xD4eBcbBdF463C9c45784603Db0dDD499BC44A8B4`; GiftBox looks it up dynamically at use time. The earlier source-tagged root described below is a different deployment. The first deployment, `0x4dE77bbB49885C92e2149C9b06054886c848E842`, had no owner and no lapsed-name cancel; it is superseded and was never published.

## Lifecycle and boundaries

The constructor fixes an owner, a USDC token and an ENSv2 root registry; the token and root must be deployed contracts. It verifies that the root exposes a deployed `.eth` registry. The owner (ERC-173) has no power over gifts: ENS only lets it set GiftBox's primary name. There is no admin, fee, upgrade mechanism, or emergency withdrawal. It cannot prove that an arbitrary contract address is genuine USDC or an authentic ENS root; deployment review must establish this.

`giftEth(name, unlockAt, message)` escrows exactly `msg.value`. `giftUsdc(name, amount, unlockAt, message)` transfers the configured token after an allowance check by the generic SDK workflow. Both require an active registered name, nonzero amount, and unlock time at or after the current block timestamp. Messages are public and limited to 1024 UTF-8 bytes. IDs start at zero; `gifts(id)` returns every struct field, while `giftsFor(name)` includes active and completed IDs.

| Operation | Who | Time |
|---|---|---|
| Claim | Current nonzero ENSv2 owner | At or after unlock, until completed |
| Cancel | Original sender | Strictly before unlock, or any time the name has no owner |
| Recover | Original sender | At or after unlock plus 90 days |

At exactly unlock, cancellation stops and claiming starts. At exactly unlock plus 90 days, both the owner and sender may compete; the first successful transaction wins. Claiming does not expire after 90 days. Outside the claim window, cancellation does not depend on current registry availability. Timestamp addition uses uint256, avoiding uint64 overflow. There is no upper bound on a future unlock date, so a sender can intentionally lock funds for a very long time.

Ownership transfers (including re-registration after expiry) transfer the right to unclaimed gifts. Expired/unregistered names cannot receive new gifts or claim existing ones. Renewal can restore claiming. If the name has no owner after unlock (expired or unregistered), the sender may cancel at once, before someone else registers it and claims. The root's current `.eth` subregistry is queried each time; registry governance changes therefore affect beneficiaries. Contract owners must themselves be able to call `claim` and receive the asset; no wallet delegation or alternate payout address is provided. Failed payouts revert the entire claim/refund, preserving the active gift. Done state is set before transfers and all mutating entry points share a reentrancy guard.

Token calls accept successful optional-return ERC20 transfers and check exact escrow/recipient balance deltas. Fee-on-transfer behavior is rejected on deposit and payout. Malicious or rebasing tokens and future changes to an upgradeable USDC implementation remain external trust risks. There is no rescue for accidentally forced ETH or directly transferred tokens. Name-ID arrays and stored messages are public and unbounded in aggregate; callers should index events for larger datasets.

## ENSv2 interface verification

No ENSv2 Solidity dependency is installed in this repository. The two small read-only interface subsets in `GiftBox.sol` were checked against ENS's tagged Sepolia source, not another team's demo:

- [`IRegistry.getSubregistry(string)`](https://github.com/ensdomains/contracts-v2/blob/sepolia-deployment-2026-09-15/contracts/src/registry/interfaces/IRegistry.sol)
- [`IOwnedRegistry.findOwner(string)`](https://github.com/ensdomains/contracts-v2/blob/sepolia-deployment-2026-09-15/contracts/src/registry/interfaces/IOwnedRegistry.sol)
- [`PermissionedRegistry`](https://github.com/ensdomains/contracts-v2/blob/sepolia-deployment-2026-09-15/contracts/src/registry/PermissionedRegistry.sol) masks expired ownership; [`LabelStore`](https://github.com/ensdomains/contracts-v2/blob/sepolia-deployment-2026-09-15/contracts/src/utils/LabelStore.sol) delegates label-size validation to ENS NameCoder.

The lookup is `root.getSubregistry("eth")`, then `.findOwner(label)` with `.eth` removed. GiftBox applies an intentionally narrower policy than general ENS: 1–63 ASCII bytes from lowercase a–z, digits and hyphens; no leading/trailing hyphen, no hyphens together in positions three and four, no Unicode, no subdomains. This avoids normalization and punycode ambiguity; it is not a full ENSIP-15 implementation. Names must also exist and be unexpired in the actual supplied registry. Never lowercase a recipient silently.

The official [September 15 Sepolia deployment list](https://github.com/ensdomains/contracts-v2/blob/sepolia-deployment-2026-09-15/contracts/docs/addresses/sepolia.md) is a source for deployment review, not a hard-coded runtime address. Before deployment, verify the latest endorsed deployment, root bytecode, returned `.eth` registry, expiry semantics, and a name you control on chain `11155111`. Compatibility with that exact live deployment is a prerequisite; mocks do not establish it. ENSv1 ownership and resolver address records are not substitutes.

A read-only compatibility probe on 7 November 2026 confirmed chain `11155111`, deployed code at the tagged root `0x9703dbd26dab89504490994138cf2c575251a9ce`, its `.eth` subregistry `0x657ea849311d3d5823348dded7c2aaafb3ede09e`, and a zero `findOwner` result for an unregistered probe label. This establishes that both ABI calls execute against that deployment, not live GiftBox functionality or expiry/transfer behavior. Recheck the deployment and a controlled registered name before deploying.

## Date inputs and manifests

The backwards-compatible manifest input type `date` accepts `YYYY-MM-DD` at 00:00:00 UTC or `YYYY-MM-DDTHH:mm:ss[.fraction]Z` / an explicit offset such as `+05:30`. It validates the calendar, refuses timezone-free date-times, unknown `-00:00`, offsets outside ±14:00, negative Unix times and uint64 overflow. Four-digit years only; fractions truncate to seconds, and leap seconds are rejected. Calldata carries uint64 seconds; signing-page argument metadata shows the corresponding UTC instant. Date syntax validation does not guarantee a future unlock: the contract checks block time.

The [shared fixture](../spec/fixtures/valid/gifts.web3mcp.eth.json) uses synthetic test addresses only. It is not a deployment manifest and must never be published unchanged. The real [Sepolia manifest](../manifests/sepolia/gifts.web3mcp.eth.json) contains the deployed GiftBox and Circle USDC addresses and all seven tools. Its digest is `0xdd3d54976b0cbbc73ef2f03cf8425e73ad076861d670e8f0564cb5b56a164d70`. A publisher test checks that it matches the fixture apart from the addresses.

The tracked file is the exact compact UTF-8 manifest record, without a trailing newline. Validation and the normal publication planner reproduce these bytes and digest unchanged. Reformatting the file can change a digest calculated directly from file bytes; always compare against the actual emitted resolver record. To validate it:

```sh
npm run build
node apps/publisher/dist/index.js validate manifests/sepolia/gifts.web3mcp.eth.json
```

| Tool | Inputs | Behavior |
|---|---|---|
| `gifts_for` | `name` string | All IDs for this canonical name |
| `gift` | `id` integer string | Complete gift struct |
| `who_can_claim` | `name` string | Current owner, zero if unavailable; not a gift/time eligibility check |
| `gift_usdc` | `name`, `amount`, `unlock_on`, `message` | Decimal USDC; approve the exact required amount if allowance is insufficient, then escrow |
| `gift_eth` | Same | Decimal ETH converted to payable value |
| `claim` | `id` | Current owner claims after unlock |
| `cancel` | `id` | Sender cancellation or recovery |

The publisher ENS name `gifts.web3mcp.eth` gives MCP names such as `gifts_gift` and `tx_gifts_gift_eth`; there is no protocol-specific MCP implementation. Example arguments, after live discovery and explicit authorization:

```json
{"name":"riya.eth","amount":"0.001","unlock_on":"2028-02-29","message":"Happy birthday"}
```

The existing string-input behavior trims leading/trailing whitespace, including in messages. Review the normalized values. USDC approvals are separate steps on wallets without batching; an approval can remain if the gift transaction subsequently fails. Simulations require `eth_simulateV1` and tracing support, and may fail on future-dated claim attempts. Never bypass simulation. The manifest contains a tuple-return signature so the SDK reads full details; no output formatting is applied to the struct.

## Publication preparation

The existing `validate` command remains available. Publication checks Sepolia chain ID, deployed contract selectors/fingerprints, canonical DNS encoding, resolver ERC165 support for `setText(bytes,string,string)` and `resolve(bytes,bytes)`, the expected current owner (or explicit nearest registered ancestor), and signer permissions for both keys. GiftBox publication also checks the deployed `root()` and `usdc()` getters against the independently reviewed configuration. Low fixture/precompile addresses are rejected. Both records are written in one resolver `multicall` of two `setText(bytes name,string key,string value)` calls, simulated from the intended signer before review.

```sh
node apps/publisher/dist/index.js publish manifests/sepolia/gifts.web3mcp.eth.json --dry-run --account <authorized-signer> --root 0xB458D6a3a77919449d03e7A6903C26827c1eC43f --resolver 0xCCfB47fd7d28C8E6eD12fE2d16923c60960339bc --owner <independently-verified-current-name-or-ancestor-owner> --usdc 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
```

`WEB3MCP_RPC_URL` may select a Sepolia HTTP(S) RPC. Redact credentials from diagnostics. The digest is keccak256 of the exact UTF-8 manifest record emitted in the plan, not a separately reformatted file. `org.web3mcp.manifest` and `org.web3mcp.digest` must be updated together.

`--dry-run` performs reads and simulation only; it never opens a signing page. To publish later, after separate authorization, run the same command without `--dry-run` in an interactive terminal. Inspect the emitted DNS-name calldata, signer, owner scope, resolver and records. Type `publish` only to authorize creation of the local request; the shared signing page then requires the user to connect the matching wallet and confirm the transaction. The CLI has no signing credentials and never deploys contracts.

Publication is one transaction, so the name never has a manifest without its matching digest. Before submission the local server repeats ownership, permission, code/upgrade-slot, configuration and simulation checks; drift or a ten-minute expiry stops the request. The CLI checks the transaction's signer, resolver, calldata, zero value and successful receipt, then reads both records back through ENS (ENSv2 resolvers answer through `resolve(bytes,bytes)`, not `text(bytes32,string)`) before reporting `confirmed`. Its result always includes the request ID and transaction hashes, even when verification fails. This is mined confirmation, not a finality-depth guarantee. A timeout or lost page/server can leave an in-flight wallet prompt; inspect wallet history before creating anything new.

The signer may be a delegated publisher only when both resolver text-key roles (or the resolver root text role) actually authorize it. Owning the name alone is not assumed sufficient. Missing child registries can yield a parent-owned wildcard resolver: `ownerScope` explicitly identifies that ancestor. An expired/unregistered top-level .eth name is rejected. The root supplied to GiftBox is immutable; only its .eth subregistry is looked up dynamically. The earlier source-tagged root and the public resolver's active root are different deployments. `gifts.web3mcp.eth` was published by web3mcp.eth's owner, which the resolver authorizes for both records (owner scope `web3mcp.eth`).

Simulation sends the exact transaction directly through `eth_simulateV1` with validation enabled, EIP-1559 fee estimates and bounded gas, two blocks behind the newest because load-balanced public RPCs can lack the newest block. It avoids Viem's `simulateCalls` sentinel. The suggested gas limit has 20% headroom and must fit the 16,777,216 transaction cap; the suggested limits are simulated again before review and rechecked before signing. Insufficient funds, invalid fee estimates or inadequate headroom fail closed.

The publisher published `gifts.web3mcp.eth` live on 7 November 2026 in transaction [`0x2c4e25d80b5782cd5f7f41d65279d7e7eb95c8352c7ad46f706b4813f42d4e83`](https://sepolia.etherscan.io/tx/0x2c4e25d80b5782cd5f7f41d65279d7e7eb95c8352c7ad46f706b4813f42d4e83) and reported `confirmed` after reading both records back. Supported resolver permissions follow ENSv2 PermissionedResolver's text-key role model; other resolver families fail closed. ERC165 claims are not proof of benevolent bytecode, so review the resolver and upgrade authorities independently. Checks cannot eliminate a state change while a wallet prompt is open; the resolver must still enforce authority at execution. Its owner then pointed `gifts.web3mcp.eth`'s address record at GiftBox and set GiftBox's primary name to `gifts.web3mcp.eth` through the ENSv2 reverse registrar, so discovery marks GiftBox `owner-verified`.

## Local verification and deployment prerequisites

```sh
cd contracts
forge build
forge test --match-contract GiftBoxTest
# Existing AgentSwap tests require a Sepolia fork:
forge test --match-contract AgentSwapTest --fork-url <Sepolia-RPC>
cd ..
npm test
git diff --check
```

GiftBox tests are deterministic and use mock root/.eth registries, expiry-aware ownership, and ERC20 tokens. Run them without `--fork-url`: their balance assertions assume fresh fixture accounts, and running them on a live fork can fail those assumptions. They cover ownership changes, exact unlock/recovery boundaries, payouts, ETH receiver and malicious ERC20 callbacks, transfer failures, events and amount accounting. The malicious token attempts all four mutating entry points during deposit and payout and checks that unrelated escrow cannot be drained or claimed twice. They do not replace a security review or live ENSv2 compatibility check. Run a supported Node 24 development environment and Foundry/solc 0.8.28. GiftBox alone is compiled with the optimizer (200 runs) and viaIR (a Foundry compilation restriction), with Cancun EVM; deployment addresses must be recomputed from that exact artifact. Other contracts keep the defaults, so AgentSwap still rebuilds to its deployed bytecode. `npm test` builds/typechecks/tests the SDK, MCP and publisher, then runs the Codex tests. Builds regenerate the committed Claude Code server bundle as required by AGENTS.md.

Finalization checks on 7 November 2026, after integrating current `main`, passed: 34 SDK, 13 MCP, 20 publisher and 6 Codex automated tests; 25 GiftBox Foundry tests (including 256 accounting fuzz runs) and 7 AgentSwap Sepolia-fork regression tests. Build, typecheck, production-manifest validation, compiled-ABI selector checks, exact publisher digest comparison, local documentation links and `git diff --check` also passed. These automated results are separate from the manual deployment verification above and do not establish successful live GiftBox payouts.

Deployment, publication and the primary name are complete, and live discovery reports GiftBox `owner-verified`. No live gift has been sent yet. These checks do not constitute a security audit certification.

## Reviewed MetaMask deployment helper

The helper was used for the deployment above. Do not start another deployment request. Its default preparation now fails closed because the pinned address is occupied. Before deployment, it checked and simulated deployment, pinned the reviewed init-code hash and predicted address, checked the source and optimized compiler settings, verified factory runtime and address vacancy, checked root/token dependencies and balance, and validated gas below the transaction cap.

For reference, the historical deployment action (not needed again) was:

```sh
node apps/publisher/dist/deploy-giftbox.js --open
```

An interactive terminal must receive the exact confirmation `deploy GiftBox` before the shared review page opens. This is a factory call, not an ENS-discovered tool: its target is `0x4e59b44847b379578588920cA78FbF26c0B4956C`, value zero, and calldata is the reviewed salt followed by constructor-encoded creation bytecode. The user alone connects MetaMask on Sepolia, reviews the calldata/gas, and signs. The helper has no private keys or RPC broadcast method. It rechecks artifact identity, vacancy and the reviewed gas margin before signing and expires the request after ten minutes. Keep it running; do not start duplicate requests or retry blindly after an in-flight wallet prompt.

The pinned artifact predicts `0xdcF1c9809aA58C7C390753E43dE25Dd064F7eda8`. Any code or build-setting change requires a new review and explicit pin update; the helper fails rather than silently accepting a different address.

After a user-submitted transaction, the helper automatically checks it, or run this read-only command separately:

```sh
node apps/publisher/dist/deploy-giftbox.js --verify 0xb72abd0a946f2b1b583d72dd8715ef6272246b3b2672af86a2daa014bfe56f54
```

Verification binds the hash and successful receipt to the expected wallet, factory, exact calldata and zero value, checks runtime against the artifact with immutable slots masked, and checks the actual `owner()`, `usdc()` and `root()` getters. CREATE2 happens inside the factory, so a top-level receipt's `contractAddress` is not the GiftBox address. The predicted address and verified runtime/getters establish the deployment result. This checks a mined receipt, not finality depth or explorer source verification. No ENS publication happens in this command.

## Demo prompts (Claude Code or Codex)

After deployment and verified publication, with the correct live server selected:

- “Discover gifts.web3mcp.eth. List the read and write schemas. Do not prepare a transaction.”
- “Read gifts for riya.eth and who currently owns that name. Do not call writes.”
- “Prepare one 0.001 ETH gift to riya.eth, unlock 2028-02-29 UTC, with message Happy birthday. I authorize preparation and automatic local review-page opening only. Do not connect or sign.”
- “Query status for this exact request ID. Do not create a second request.”

The user alone connects, rejects, approves, signs and submits in their wallet. A simulation is not an actual payout, and a successful receipt alone does not prove an exact token delta.

## Future Arkiv indexing

`GiftSent`, `GiftClaimed`, and `GiftCancelled` index gift ID, canonical name hash, and sender/claimant. An indexer could key records by chain, contract and gift ID, retain block/log ordering and reorg handling, and join the sent name/message to later terminal events. It must re-read contract state and current ENS ownership before presenting a claim opportunity. No Arkiv client, index, synchronization, or search is implemented here.
