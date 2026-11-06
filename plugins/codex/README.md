# Web3MCP for Codex

Codex integration for discovering and using validated EVM protocol tools through the Web3MCP MCP server.

## Install

Codex installs the same plugin as Claude Code from this repository's marketplace: the bundled server, the local signing page and the skill. Nothing is downloaded from npm and nothing is built; Node 22+ is the only requirement.

```sh
codex plugin marketplace add Team-Managed/EVM-Web3MCP
codex plugin add web3mcp@evm-web3mcp
```

Restart Codex. The plugin's `mcp.json` starts `node ./server/web3mcp.mjs` from the installed plugin folder, on Sepolia with a public RPC.

Codex plugins can't take settings such as a wallet address, and the server sees no other environment, so tell Codex your wallet in the conversation, for example "my wallet is yourname.eth". The skill passes it to the `wallet` tool; it's your public address or ENS name, never a key, and it lasts for the session.

Codex doesn't pick up the tools `discover` adds, so it runs them through `read`, which is read-only, and `call`. Codex asks before a `call`, so every write needs your approval before the signing page opens, much as the Claude Code plugin's hook asks. To say so explicitly in `~/.codex/config.toml`:

```toml
[plugins."web3mcp@evm-web3mcp".mcp_servers.web3mcp]
default_tools_approval_mode = "writes"
```

Then sign on the signing page in your own wallet. The agent never signs or handles signing credentials.

The rest of this page covers the development launcher in this folder: an offline fixture mode and a Sepolia live mode with configuration checks. It needs the repository built.

## Build

Prerequisites: Node 24 (`.nvmrc`), npm, and Codex with stdio MCP and skill support.

No published Web3MCP package or wallet is needed for local fixture discovery.

From the repository root:

```sh
npm ci
npm test
node --test plugins/codex/test/*.test.ts
```

## Development launcher: install and activation

### Windows PowerShell

From the repository root:

```powershell
$web3mcpLauncher = (Resolve-Path plugins/codex/scripts/serve.ts).Path
$web3mcpNode = (Get-Command node -CommandType Application | Select-Object -First 1).Source

codex mcp add web3mcp -- "$web3mcpNode" "$web3mcpLauncher"

New-Item -ItemType Directory -Force .agents/skills | Out-Null
Copy-Item -Recurse -Force plugins/codex/skills/web3mcp .agents/skills/
```

If an MCP server named `web3mcp` already exists, inspect it with `codex mcp get web3mcp` and update the existing registration rather than creating a duplicate.

Use Node 24. On Windows, verify that the resolved executable is the intended Node installation.

### POSIX shell

```sh
codex mcp add web3mcp -- "$(command -v node)" "$PWD/plugins/codex/scripts/serve.ts"
mkdir -p .agents/skills
cp -R plugins/codex/skills/web3mcp .agents/skills/
```

These are user-run commands. MCP registration changes personal Codex settings; the installed skill copy stays in the local `.agents/` directory.

Restart Codex in this repository, verify the registration using:

```sh
codex mcp get web3mcp
```

Then invoke `$web3mcp` in a new Codex conversation.

The local launcher resolves fixtures relative to its own file location, including when launched from another working directory containing spaces. It passes the repository's `spec/fixtures/valid` directory directly to the server in fixture mode.

Re-register after moving the repository or Node installation.

To remove the MCP registration:

```sh
codex mcp remove web3mcp
```

Remove the locally installed skill folder separately if necessary.

### Alternative: committed server bundle

The Claude Code plugin also ships the shared server as a committed bundle, [web3mcp.mjs](../claude-code/server/web3mcp.mjs), with adjacent signing-page assets. This alternative needs a clone of the repository and Node 22+, without installing dependencies or building locally:

```sh
codex mcp add web3mcp -- node /path/to/EVM-Web3MCP/plugins/claude-code/server/web3mcp.mjs
```

Choose this registration instead of the local launcher registration above; do not register two servers under the same name. Keep the adjacent `server/approve` assets. Install the Codex skill from `plugins/codex/skills/web3mcp` as above. `npm run build` regenerates the bundle and assets; repository rules require committing them with SDK, server, or signing-page changes.

The bundle runs the shared MCP entry point directly: it connects to Sepolia by default and does not use the launcher's `WEB3MCP_MODE` switch or configuration validation. Do not use it for the offline fixture verification below. `WEB3MCP_CHAIN=mainnet` selects mainnet in that entry point; keep `WEB3MCP_CHAIN=sepolia` for this guide. The tested Codex launcher remains Sepolia-only and defaults to fixtures.

For either registration, configure the public wallet account and optionally ask Codex to prompt for writes in the user-level configuration. This example assumes the server is named `web3mcp`:

```toml
[mcp_servers.web3mcp]
default_tools_approval_mode = "writes"

[mcp_servers.web3mcp.env]
WEB3MCP_CHAIN = "sepolia"
WEB3MCP_ACCOUNT = "yourname.eth" # replace with your public address or ENS name, never a key
WEB3MCP_RPC_URL = ""
```

Merge these settings into existing tables. When using the local launcher for live work, also set `WEB3MCP_MODE="live"` as below. `default_tools_approval_mode` accepts `auto`, `prompt`, `writes` or `approve`; `writes` asks before any tool not marked read-only. Discovered read tools have read-only annotations; the generic `call` fallback does not, so with `writes` Codex also asks before reads run through `call`. Codex approval policy does not replace explicit authorization for preparation or the user's wallet confirmation. Bundle setup is an implementation-supported alternative, not part of the historical launcher verification recorded below.

## Live ENS configuration

Edit the environment table of the existing Codex MCP registration (do not duplicate it):

The user-level Codex configuration is `~/.codex/config.toml` (`%USERPROFILE%\.codex\config.toml` on Windows). Use the table matching the registered server name. For an existing registration named `web3mcp-live`, configure:

```toml
[mcp_servers.web3mcp-live.env]
WEB3MCP_MODE = "live"
WEB3MCP_CHAIN = "sepolia"
WEB3MCP_RPC_URL = ""
# Optional for discovery/ordinary reads; required for write simulation.
# Replace with your public wallet address or normalized ENS name before writes.
WEB3MCP_ACCOUNT = "<public Sepolia address>"
```

| Variable | Codex launcher behavior |
|---|---|
| `WEB3MCP_MODE` | `fixture` (default when unset) or `live`. Other values, including empty, fail at startup. |
| `WEB3MCP_RPC_URL` | Live only: absolute HTTP(S) endpoint without surrounding whitespace. Unset or empty uses viem's Sepolia default, matching the shared MCP. |
| `WEB3MCP_ACCOUNT` | Live only: optional public wallet address or normalized ENS name. Needed for simulated writes and `$sender` reads; resolved by the shared server. Unset or empty means no account. |
| `WEB3MCP_CHAIN` | Live only: unset, empty, or `sepolia`. Other values fail; this launcher supports Sepolia only. |
| `WEB3MCP_MANIFEST_DIR` | Ignored in both modes. Fixture mode uses repository fixtures; live mode passes no manifest directory. |

Fixture mode ignores all live-only settings and constructs no RPC client. Live mode never falls back to fixtures after ENS or RPC failure. Configuration diagnostics go to stderr; stdout is reserved for MCP JSON-RPC. Endpoint values are not included in launcher diagnostics. Configure an endpoint that actually serves Sepolia; startup does not probe the endpoint's chain ID.

Replace the account placeholder with a valid public address or normalized ENS name, or omit the setting for discovery and reads that do not use `$sender`. This is never a signing credential. If the registration is named `web3mcp`, use `[mcp_servers.web3mcp.env]` instead. Do not duplicate existing server tables.

For direct Windows PowerShell launches from the repository root:

```powershell
$env:WEB3MCP_MODE = 'fixture'
node plugins/codex/scripts/serve.ts
```

```powershell
$env:WEB3MCP_MODE = 'live'
$env:WEB3MCP_CHAIN = 'sepolia'
$env:WEB3MCP_RPC_URL = '' # Sepolia public default; replace with your HTTP(S) endpoint if needed
Remove-Item Env:WEB3MCP_ACCOUNT -ErrorAction SilentlyContinue
node plugins/codex/scripts/serve.ts
```

These commands start a stdio server waiting for an MCP client, not an interactive prompt. For Codex, set the same values in the existing registration's environment table and restart Codex. Add `WEB3MCP_ACCOUNT` only when needed, using your public address or normalized ENS name.

Do not rely solely on MCP approval settings for transaction safety. Every write requires explicit user approval, and wallet signing must remain under user control.

## Real fixture discovery

Ask Codex:

> Use $web3mcp. Call the connected Web3MCP discover tool with
> {"name":"vault.web3mcp-demo.eth"}. Report its exact result and tool types.
> Do not read fixture JSON directly or execute discovered tools.

Expected MCP response:

```text
Discovered vault.web3mcp-demo.eth from a local manifest file, chain 11155111.
Contracts: not checked on chain.
Tools: vault_get_balance(owner), tx_vault_deposit(amount), tx_vault_withdraw(amount). If these don't appear in your tool list, run reads with the read tool and writes with the call tool, using these input names.
```

Discovered tools:

- `vault_get_balance` — read
- `tx_vault_deposit` — write
- `tx_vault_withdraw` — write

This proves fixture-backed discovery through MCP, not live ENS resolution or blockchain execution.

The server also exposes `discover`, `call`, and the read-only `read`, `status` and `wallet` tools. Fixture mode remains offline and cannot execute the discovered contract tools.

The integration test launches the actual stdio server and checks registered read/write annotations without executing discovered tools.

## Manual live verification

The repository documents AgentSwap at `agentswap.web3mcp.eth` on Ethereum Sepolia (`11155111`), contract `0xE17021E2fd5Dd0A6608293E7Ac5E3c361ae30e58`. This is deployment information, not proof that your current runtime has reached ENS or executed a tool.

1. Enable live mode, select a Sepolia HTTP(S) RPC, refresh the installed skill copy, and restart Codex. If preserving a fixture registration, use a separate live registration and explicitly select that server for every step; do not mix discovery or signing IDs across servers.
2. Ask `$web3mcp` to call `discover` with `{"name":"agentswap.web3mcp.eth"}`. Check that the response says `from ENS`, reports chain `11155111`, and identifies the swap contract above. Inspect actual trust labels; do not infer them from this document.
3. Confirm these registered tools: `agentswap_eth_price`, `agentswap_quote_eth_to_usdc`, `agentswap_quote_usdc_to_eth`, `agentswap_usdc_balance`, `tx_agentswap_eth_to_usdc`, and `tx_agentswap_usdc_to_eth`. The server also exposes `discover`, `call`, and `status`.
4. Run `agentswap_eth_price` with `{}`, then the quote tools with `{"amount":"0.001"}` ETH and `{"amount":"1"}` USDC respectively. Quotes are dry-run `eth_call` reads, even though the quote functions are non-view. Run `agentswap_usdc_balance` with `{"owner":"<your public address>"}`, replacing the placeholder. Inspect actual results. Use `call({tool, args})` only if dynamic tools are absent, checking the registered schema first.
5. To verify failure isolation, discover a fixture name that the publisher confirms has no live publication: expect an error, never local-fixture discovery.
6. Before a write, set `WEB3MCP_ACCOUNT` to the public address or normalized ENS name of the wallet that will sign, restart the server, and rediscover. Ensure suitable Sepolia balances and gas. Explain the exact swap, amount, recipient, and expected costs, then obtain explicit approval before calling the write tool. ETH → USDC requires `amount`, `min_usdc` and `recipient`; USDC → ETH requires `amount`, `min_eth` and `recipient`. Quote first and set the minimum about 1% below the quote. Supply the user's own public address unless they explicitly choose another recipient.
7. The shared SDK simulates first, requiring RPC support for `eth_simulateV1` and asset-tracing state overrides. On failure, report the error and stop. The contract may reject swaps more than 3% below Chainlink's price; do not bypass this check. On success, the tool returns a review, signing-page URL, and request ID, and attempts to open the browser. This is a signing handoff, not a simulation-only tool.
8. The user opens the returned `http://127.0.0.1:<port>/approve/<id>` URL if necessary, reviews the steps, connects an injected browser wallet matching the simulated account, and chooses whether to sign on Sepolia. Never control the wallet approval for them. To test rejection first, reject on the page and check its status; a later attempt needs a new write request.
9. Call `status({"id":"<returned request ID>"})` on the same MCP server. It waits up to 25 seconds for the page and reports pending, rejected, failed, or signed transactions with receipt results and explorer links. Repeat while waiting as needed. Distinguish submitted/not-found receipts from confirmed success; inspect reverted results. Keep the MCP server running throughout.

Automated tests are offline: they cover configuration, fixture preservation, and live stdio wiring to a controlled local RPC that rejects ENS calls. They do not prove a live deployment or successful real-network simulation.

### AgentSwap write schema and example

Establish the exact live write schema from the tools registered after successful ENS discovery, including input names, types, and units. Discovery's text response lists tool names, not schemas. If dynamic tools are absent, the documented fallback is `call({tool, args})` on that same server; it does not apply the dynamic tool's Zod input schema. Inspect the repository's [input schema builder](../../packages/mcp/src/server.ts), [SDK bindings](../../packages/sdk/src/execute.ts), and [AgentSwap declaration](../../spec/fixtures/valid/agentswap.web3mcp.eth.json) to understand the implementation. A fixture alone does not prove the current ENS declaration. Resolve any discrepancy or uncertainty before invoking a write; do not guess arguments or probe by creating requests.

The ETH → USDC tool requires three strings, `amount`, `min_usdc` and `recipient`:

```json
{"amount":"0.001","min_usdc":"24.8","recipient":"<public Sepolia address>"}
```

Get `min_usdc` from `agentswap_quote_eth_to_usdc` first: about 1% below the quote. The contract refuses a swap that pays less, so nobody can move the price between the quote and the swap. Replace the recipient placeholder before invoking `tx_agentswap_eth_to_usdc`. `amount` is decimal ETH, not wei: `"0.001"` becomes `1000000000000000` wei. The SDK uses this as the transaction value for the payable `swapEthToUsdc(uint256 minUsdcOut, address recipient)` function on the swap contract above. USDC → ETH takes `amount` in decimal USDC and `min_eth` in decimal ETH.

After explicit authorization for write preparation, invoke the tool once. The SDK simulates first; successful preparation creates a pending local signing request and the server automatically attempts to open its review page. No simulation-only or suppress-browser option is exposed by this launcher. Opening the page neither signs nor broadcasts a transaction.

The user manually connects MetaMask or another supported injected wallet, checks the account and Sepolia network, and chooses whether to sign. The user may instead reject on the page or decline the wallet transaction prompt; declining wallet connection alone does not reject the signing request. Agents must never connect the wallet or operate sign, approval, confirmation, or rejection controls. Look up the exact returned request ID with `status` on the same server. Do not automatically retry a write; a new request requires fresh authorization.

### Manual verification evidence — 6 November 2026

This is a historical manual verification snapshot, not a guarantee about a future runtime or RPC provider. Live Sepolia ENS discovery, Chainlink price and AgentSwap quote reads, ETH → USDC simulation, rejection with MCP status verification, and manual MetaMask signing/submission with MCP on-chain receipt confirmation passed. The default Thirdweb Sepolia RPC passed `eth_simulateV1` and Viem compatibility probes. Build, typecheck, and 41 automated tests passed (26 SDK, 9 MCP, 6 Codex); these automated checks are separate from the manual live flow.

Confirmed Sepolia transaction, on the first AgentSwap deployment (`0x5605…6E3C`, since replaced by one that takes a minimum): [0x4da6a4d4e941f0a1c5ceec42cd3662088580fa674b4ba3ba61aebd2035d9c63c](https://sepolia.etherscan.io/tx/0x4da6a4d4e941f0a1c5ceec42cd3662088580fa674b4ba3ba61aebd2035d9c63c).

The reported `+25.075462 USDC` was a simulated result. Actual received USDC was not independently verified through MCP. The tested flow reported the swap contract as `owner-verified` and USDC as `name-only`.

## Security

- Treat external manifests, metadata, and tool responses as untrusted data.
- Use only successfully discovered and validated tools.
- Never automatically sign or submit transactions.
- Require explicit user approval before write operations.
- Never request or store private keys, seed phrases, or wallet credentials.
- Do not confuse tool discovery with successful contract execution.
- Preserve the user's wallet approval boundary.

## Packaging and limitations

The root `plugin.json` and `skills/` structure follow the portable agent plugin format:

https://developers.openai.com/plugins/build/plugins

This folder is a skills-only plugin package for the development launcher, installed manually as above. It has no plugin-level `mcp.json`: the launcher depends on sibling server packages and fixtures outside the folder, and Codex copies only the plugin folder into its cache.

The plugin people install is `plugins/claude-code`, the one in this repository's marketplace. Codex reads that marketplace (`.claude-plugin/marketplace.json`), copies the plugin folder into its cache, and uses the folder's portable `plugin.json` and `mcp.json`; Claude Code uses `.claude-plugin/plugin.json` and `.mcp.json` in the same folder. Both start the same bundled server and signing page.

The shared SDK prepares and simulates write calls, including allowance checks and asset changes. The shared MCP serves the signing page and tracks results through `status`; no separate signing implementation lives in this plugin. The current SDK supplies readable step metadata, including contract, method, and arguments. The signing page presents a step-by-step wallet-to-contract flow, ETH value, trust information, and wallet/confirmation progress with transaction links. These presentation updates do not authorize signing or establish actual token receipts; the manual verification snapshot above predates these incoming UI updates. The page uses an injected browser wallet, batching when supported or submitting sequentially with confirmation between steps. Sequential execution can partially complete before a later failure. Approval records are held in memory and are lost on server restart. Wallet-controlled submission costs Sepolia gas; simulation alone does not. No signing credentials are accepted by the launcher or agent.

Simulation uses head minus two blocks. State and prices can change before signing; simulated asset changes do not guarantee actual USDC output or establish total gas cost. `status` checks receipt success for hashes reported by the page, but does not expose transfer logs or actual token changes. A current balance read alone cannot establish the amount received in a particular transaction. Successful receipt confirmation is not a finality-depth guarantee.

Failed sequential execution can leave earlier steps completed. The failure-report path does not preserve transaction hashes as structured approval hashes; inspect wallet history before considering any authorized retry. Receipt lookup failures, including RPC errors, are currently surfaced as `not found on chain yet`; this does not prove a transaction was never broadcast.

ENS `owner-verified` means the contract's primary ENS name matches the publishing name or a subname; it is not a security audit. `name-only` means only the publisher vouches for the contract association. The verified ETH → USDC flow does not establish live USDC → ETH execution or wallet batching support.

## Troubleshooting

- Missing build/modules: run `npm ci` and `npm run build` from the repository root.
- Wrong Node version: use Node 24 and verify the executable path.
- No discover tool: run `codex mcp get web3mcp`, check registration, and restart Codex.
- Missing account or wallet mismatch: set `WEB3MCP_ACCOUNT` to a public address or resolvable normalized ENS name before write simulation, then restart and rediscover. The user must manually connect that same wallet account.
- Missing/incompatible RPC: confirm the endpoint serves Sepolia (`11155111`), is reachable, and supports the required methods. Empty/unset RPC URL selects viem's default; startup does not verify its chain ID.
- `eth_simulateV1` unsupported: ordinary reads do not establish simulation support. Verify capability non-transactionally or choose a compatible Sepolia RPC; do not bypass simulation.
- ENS discovery unavailable: check live mode and the publisher's `org.web3mcp.manifest`/`org.web3mcp.digest` text records. Live failures never use fixtures. If a contract fingerprint changed, rediscover and re-review before a newly authorized write.
- Oracle or swap errors: stop on stale Chainlink prices (maximum age 75 minutes), your own minimum ("the price moved below your minimum"), the 3% price guard, insufficient funds, or insufficient liquidity. Do not bypass guards; a simulation failure is not permission to retry.
- Missing wallet or wrong MetaMask network: the user must install/enable an injected wallet in the browser displaying the page and select or approve switching to Sepolia themselves.
- Browser did not open: the user can open the exact returned local approval URL manually while the server is running. Browser opening alone does not submit anything.
- `No signing request with id …`: use the exact returned ID on the same server instance. Restarting the server loses approval records. Do not infer rejection or create a replacement without authorization.
- Rejected request: report rejection and stop. A new preparation needs fresh user authorization; do not automatically retry.
- Pending or `not found on chain yet`: pending can mean the page has not reported completion; receipt lookup RPC failures also appear as not found. Check RPC availability and known wallet hashes before drawing conclusions or retrying.
- Dynamically registered tools absent: establish the exact live schema before using `call({tool, args})`; see the schema guidance above. Only call successfully discovered tools with the same approval requirements.
- Skill missing or still describing fixture-only execution: open Codex from this repository, refresh the ignored `.agents/skills/web3mcp` copy from the tracked skill, and start a new conversation.
- Shared diagnostics: redact API keys, URL credentials, and sensitive RPC path/query components before sharing errors. Launcher diagnostics omit endpoint values, but downstream RPC errors may contain them.

Do not claim live ENS discovery, balances, simulations, transaction submission, or wallet signing worked unless verified through the actual runtime.
