# Web3MCP for Codex

Codex integration for discovering and using validated EVM protocol tools through the Web3MCP MCP server.

The local launcher defaults to offline fixture discovery. Explicit live mode enables Sepolia ENS discovery, contract reads, and write preparation through the shared SDK/MCP. After successful simulation, the shared server opens a local signing page. The user reviews and signs in their browser wallet; the agent never signs or handles signing credentials.

## Build

Prerequisites: Node 24 (`.nvmrc`), npm, and Codex with stdio MCP and skill support.

No published Web3MCP package or wallet is needed for local fixture discovery.

From the repository root:

```sh
npm ci
npm test
node --test plugins/codex/test/*.test.ts
```

## Manual install and activation

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

## Live ENS configuration

Edit the environment table of the existing Codex MCP registration (do not duplicate it):

```toml
[mcp_servers.web3mcp.env]
WEB3MCP_MODE = "live"
WEB3MCP_RPC_URL = ""
```

| Variable | Codex launcher behavior |
|---|---|
| `WEB3MCP_MODE` | `fixture` (default when unset) or `live`. Other values, including empty, fail at startup. |
| `WEB3MCP_RPC_URL` | Live only: absolute HTTP(S) endpoint without surrounding whitespace. Unset or empty uses viem's Sepolia default, matching the shared MCP. |
| `WEB3MCP_ACCOUNT` | Live only: optional public wallet address or normalized ENS name. Needed for simulated writes and `$sender` reads; resolved by the shared server. Unset or empty means no account. |
| `WEB3MCP_CHAIN` | Live only: unset, empty, or `sepolia`. Other values fail; this launcher supports Sepolia only. |
| `WEB3MCP_MANIFEST_DIR` | Ignored in both modes. Fixture mode uses repository fixtures; live mode passes no manifest directory. |

Fixture mode ignores all live-only settings and constructs no RPC client. Live mode never falls back to fixtures after ENS or RPC failure. Configuration diagnostics go to stderr; stdout is reserved for MCP JSON-RPC. Endpoint values are not included in launcher diagnostics. Configure an endpoint that actually serves Sepolia; startup does not probe the endpoint's chain ID.

Do not duplicate an existing `[mcp_servers.web3mcp]` table. Add the relevant settings to the existing server configuration.

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
Tools: vault_get_balance, tx_vault_deposit, tx_vault_withdraw. If these don't appear in your tool list, run them with the call tool.
```

Discovered tools:

- `vault_get_balance` — read
- `tx_vault_deposit` — write
- `tx_vault_withdraw` — write

This proves fixture-backed discovery through MCP, not live ENS resolution or blockchain execution.

The server also exposes `discover`, `call`, and the read-only `status` tool. Fixture mode remains offline and cannot execute the discovered contract tools.

The integration test launches the actual stdio server and checks registered read/write annotations without executing discovered tools.

## Manual live verification

The repository documents AgentSwap at `agentswap.web3mcp.eth` on Ethereum Sepolia (`11155111`), contract `0x5605ee2C4b4aeC0859fC1739e73874aE8D3b6E3C`. This is deployment information, not proof that your current runtime has reached ENS or executed a tool.

1. Enable live mode, select a Sepolia HTTP(S) RPC, refresh the installed skill copy, and restart Codex. If preserving a fixture registration, use a separate live registration and explicitly select that server for every step; do not mix discovery or signing IDs across servers.
2. Ask `$web3mcp` to call `discover` with `{"name":"agentswap.web3mcp.eth"}`. Check that the response says `from ENS`, reports chain `11155111`, and identifies the swap contract above. Inspect actual trust labels; do not infer them from this document.
3. Confirm these registered tools: `agentswap_eth_price`, `agentswap_quote_eth_to_usdc`, `agentswap_quote_usdc_to_eth`, `agentswap_usdc_balance`, `tx_agentswap_eth_to_usdc`, and `tx_agentswap_usdc_to_eth`. The server also exposes `discover`, `call`, and `status`.
4. Run `agentswap_eth_price` with `{}`, then the quote tools with `{"amount":"0.001"}` ETH and `{"amount":"1"}` USDC respectively. Quotes are dry-run `eth_call` reads, even though the quote functions are non-view. Run `agentswap_usdc_balance` with `{"owner":"<your public address>"}`, replacing the placeholder. Inspect actual results. Use `call({tool, args})` only if dynamic tools are absent, checking the registered schema first.
5. To verify failure isolation, discover a fixture name that the publisher confirms has no live publication: expect an error, never local-fixture discovery.
6. Before a write, set `WEB3MCP_ACCOUNT` to the public address or normalized ENS name of the wallet that will sign, restart the server, and rediscover. Ensure suitable Sepolia balances and gas. Explain the exact swap, amount, recipient, and expected costs, then obtain explicit approval before calling the write tool. Both swap tools require `amount` and `recipient`; supply the user's own public address unless they explicitly choose another recipient.
7. The shared SDK simulates first, requiring RPC support for `eth_simulateV1` and asset-tracing state overrides. On failure, report the error and stop. The contract may reject swaps more than 3% below Chainlink's price; do not bypass this check. On success, the tool returns a review, signing-page URL, and request ID, and attempts to open the browser. This is a signing handoff, not a simulation-only tool.
8. The user opens the returned `http://127.0.0.1:<port>/approve/<id>` URL if necessary, reviews the steps, connects an injected browser wallet matching the simulated account, and chooses whether to sign on Sepolia. Never control the wallet approval for them. To test rejection first, reject on the page and check its status; a later attempt needs a new write request.
9. Call `status({"id":"<returned request ID>"})` on the same MCP server. It waits up to 25 seconds for the page and reports pending, rejected, failed, or signed transactions with receipt results and explorer links. Repeat while waiting as needed. Distinguish submitted/not-found receipts from confirmed success; inspect reverted results. Keep the MCP server running throughout.

Automated tests are offline: they cover configuration, fixture preservation, and live stdio wiring to a controlled local RPC that rejects ENS calls. They do not prove a live deployment or successful real-network simulation.

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

This is a skills-only plugin package. The manual skill installation above is the currently tested activation method.

There is intentionally no plugin-level `mcp.json`. The local MCP launcher depends on sibling server packages and fixtures outside the plugin folder. Plugin caching may omit these dependencies.

Installing the plugin alone does not automatically register the MCP server.

Automatic plugin installation and cache activation have not been verified.

The shared SDK prepares and simulates write calls, including allowance checks and asset changes. The shared MCP serves the signing page and tracks results through `status`; no separate signing implementation lives in this plugin. The page uses an injected browser wallet, batching when supported or submitting sequentially with confirmation between steps. Sequential execution can partially complete before a later failure. Approval records are held in memory and are lost on server restart. Wallet-controlled submission costs Sepolia gas; simulation alone does not. No signing credentials are accepted by the launcher or agent.

## Troubleshooting

- Missing build/modules: run `npm ci` and `npm run build` from the repository root.
- Wrong Node version: use Node 24 and verify the executable path.
- No discover tool: run `codex mcp get web3mcp`, check registration, and restart Codex.
- ENS discovery unavailable: confirm live mode, Sepolia endpoint availability, and the publisher's manifest/digest text records. Live failures never use fixtures.
- Dynamically registered tools absent: use the documented `call({tool, args})` fallback only for successfully discovered tools, preserving the same approval requirements.
- A message saying a tool is discovered but execution is not implemented indicates a runtime limitation, not a successful contract call.
- Skill missing: open Codex from the repository containing the installed `.agents/skills/web3mcp` skill.

Do not claim live ENS discovery, balances, simulations, transaction submission, or wallet signing worked unless verified through the actual runtime.
