# Web3MCP for Codex

Codex integration for discovering and using validated EVM protocol tools through the Web3MCP MCP server.

The included local launcher supports fixture-backed discovery. Live ENS resolution, contract reads, and transaction capabilities depend on the installed SDK/MCP implementation and configuration.

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

The local launcher resolves paths relative to its own file location and currently sets `WEB3MCP_MANIFEST_DIR` to `spec/fixtures/valid`.

Re-register after moving the repository or Node installation.

To remove the MCP registration:

```sh
codex mcp remove web3mcp
```

Remove the locally installed skill folder separately if necessary.

## Live ENS configuration

The shared SDK/MCP implementation may support live ENS discovery, contract reads, and transaction preparation.

The following settings were introduced by the shared team's configuration and should be checked against the installed MCP implementation and Codex version before use:

```toml
[mcp_servers.web3mcp]
default_tools_approval_mode = "writes"

[mcp_servers.web3mcp.env]
WEB3MCP_ACCOUNT = "yourname.eth"
WEB3MCP_RPC_URL = ""
```

`WEB3MCP_ACCOUNT` is a public wallet address or ENS name, never a private key. An empty RPC URL is intended to select the shared implementation's default Sepolia RPC endpoint.

Do not duplicate an existing `[mcp_servers.web3mcp]` table. Add the relevant settings to the existing server configuration.

The included `serve.ts` launcher currently forces local fixture discovery. Setting live account/RPC variables alone does not switch that launcher to live ENS mode. Use the live SDK/MCP configuration once its launch requirements are confirmed.

Do not rely solely on MCP approval settings for transaction safety. Every write requires explicit user approval, and wallet signing must remain under user control.

## Real fixture discovery

Ask Codex:

> Use $web3mcp. Call the connected Web3MCP discover tool with
> {"name":"vault.web3mcp-demo.eth"}. Report its exact result and tool types.
> Do not read fixture JSON directly or execute discovered tools.

Expected MCP response:

```text
Discovered vault.web3mcp-demo.eth on chain 11155111: vault_get_balance, tx_vault_deposit, tx_vault_withdraw. If these tools don't appear in your tool list, run them with the call tool.
```

Discovered tools:

- `vault_get_balance` — read
- `tx_vault_deposit` — write
- `tx_vault_withdraw` — write

This proves fixture-backed discovery through MCP, not live ENS resolution or blockchain execution.

The integration test launches the actual stdio server and checks registered read/write annotations without executing discovered tools.

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

The included development launcher is fixture-backed. Live ENS discovery and execution must be tested against the shared SDK/MCP implementation separately.

## Troubleshooting

- Missing build/modules: run `npm ci` and `npm run build` from the repository root.
- Wrong Node version: use Node 24 and verify the executable path.
- No discover tool: run `codex mcp get web3mcp`, check registration, and restart Codex.
- ENS discovery unavailable: confirm whether the active server is running fixture or live mode.
- Dynamically registered tools absent: use the documented `call({tool, args})` fallback only for successfully discovered tools, preserving the same approval requirements.
- A message saying a tool is discovered but execution is not implemented indicates a runtime limitation, not a successful contract call.
- Skill missing: open Codex from the repository containing the installed `.agents/skills/web3mcp` skill.

Do not claim live ENS discovery, balances, simulations, transaction submission, or wallet signing worked unless verified through the actual runtime.
