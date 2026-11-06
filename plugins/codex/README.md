# Web3MCP for Codex

Add the MCP server. It's the same single-file build the Claude Code plugin ships, so a clone of this repo and Node 22+ are all it needs:

```bash
codex mcp add web3mcp -- node /path/to/EVM-Web3MCP/plugins/claude-code/server/web3mcp.mjs
```

Then, in `~/.codex/config.toml`, give it your wallet so writes can be simulated, and make Codex ask before anything that isn't a read. Discovered read tools are marked read-only, so they run without a prompt:

```toml
[mcp_servers.web3mcp]
default_tools_approval_mode = "writes"

[mcp_servers.web3mcp.env]
WEB3MCP_ACCOUNT = "yourname.eth"  # your address or ENS name, never a key
WEB3MCP_RPC_URL = ""              # optional; empty uses a public Sepolia endpoint
```

Install the skill, which uses the same `SKILL.md` format as the Claude Code plugin: copy `plugins/claude-code/skills/web3mcp` into the folder Codex loads skills from. In a repository that's `.agents/skills/`, where Solana-Web3MCP keeps its Codex skills.

Codex may not refresh its tool list when `discover` adds tools. If not, the skill tells it to run them through the `call` tool.

To do: package this as a Codex plugin from the `/plugins` marketplace once its manifest format is confirmed.
