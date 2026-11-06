# Web3MCP for Codex

Fixture-backed discovery only. Live ENS resolution, contract reads, simulation,
execution and wallet signing are not implemented.

## Build

Prerequisites: Node 24 (`.nvmrc`), npm, Codex with stdio MCP and skill support.
No published Web3MCP package, RPC account or wallet is needed. From the repo root:

```sh
npm ci
npm test
node --test plugins/codex/test/*.test.ts
```

## Manual install and activation

PowerShell, from the repository root:

```powershell
$web3mcpLauncher = (Resolve-Path plugins/codex/scripts/serve.ts).Path
$web3mcpNode = (Get-Command node -CommandType Application).Source
codex mcp add web3mcp -- "$web3mcpNode" "$web3mcpLauncher"
New-Item -ItemType Directory -Force .agents/skills | Out-Null
Copy-Item -Recurse plugins/codex/skills/web3mcp .agents/skills/
```

POSIX shell equivalent:

```sh
codex mcp add web3mcp -- "$(command -v node)" "$PWD/plugins/codex/scripts/serve.ts"
mkdir -p .agents/skills
cp -R plugins/codex/skills/web3mcp .agents/skills/
```

These are user-run steps: `codex mcp add` changes personal Codex settings; the
skill copy stays in the ignored local `.agents/` directory. Inspect existing
entries before replacing them. Restart Codex in this repository, check
`codex mcp get web3mcp`, and invoke `$web3mcp` in a new chat.
The launcher resolves paths from its own location, independently of working
directory, and deliberately sets WEB3MCP_MANIFEST_DIR to spec/fixtures/valid.
Re-register after moving the checkout or Node installation. Uninstall MCP with
`codex mcp remove web3mcp`; remove only the installed skill folder separately.

## Real fixture discovery

Ask Codex:

> Use $web3mcp. Call the connected Web3MCP discover tool with
> {"name":"vault.web3mcp-demo.eth"}. Report its exact result and tool types.
> Do not read fixture JSON directly or execute discovered tools.

Expected MCP response text:

```text
Discovered vault.web3mcp-demo.eth on chain 11155111: vault_get_balance, tx_vault_deposit, tx_vault_withdraw. If these tools don't appear in your tool list, run them with the call tool.
```

`vault_get_balance` is a read; `tx_vault_deposit` and `tx_vault_withdraw` are writes.
This proves fixture discovery through MCP, not live ENS or onchain access.
The integration check launches the actual stdio server and checks registered
read/write annotations without invoking any discovered tools.

## Packaging and limitations

The root plugin.json and skills/ layout follows the
[official portable plugin format](https://developers.openai.com/plugins/build/plugins).
This is a skills-only plugin package; no legacy overlay is needed. The manual
skill copy above is the locally usable activation path.

<!-- shortcut: MCP registration is manual because plugin caches omit sibling server and fixtures; bundle a self-contained server when distribution is implemented. -->
There is intentionally no mcp.json. Installing the plugin alone does not connect
MCP: Codex copies plugins into a cache without this checkout's sibling packages
and fixtures. Relative paths outside the plugin would fail there. Automatic
plugin installation/cache activation has not been verified. Use manual setup,
which generates machine-local paths without storing personal paths in source.

## Troubleshooting

- Missing build/modules: run `npm ci` and `npm run build` at the repo root.
- Node missing: install Node 24 and restart the terminal; use the resolved executable above.
- No discover tool: check `codex mcp get web3mcp`, enable MCP and restart Codex.
- ENS-not-implemented error: another server configuration is active; use this launcher.
- Dynamic tools absent: the documented fallback is `call({tool, args})` for a
  successfully registered name only, with the same write approval requirements.
- `... is discovered, but running tools isn't implemented yet.` is the current
  execution limit. Do not retry as a transaction or claim a balance/signature.
- Skill absent: open Codex in the repository containing the local skill copy.
