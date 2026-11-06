import assert from 'node:assert/strict';
import { readFile, mkdtemp, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

test('portable plugin and skill metadata', async () => {
  const plugin = JSON.parse(await readFile(new URL('../plugin.json', import.meta.url), 'utf8'));
  assert.equal(plugin.$schema, 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json');
  assert.equal(plugin.name, 'web3mcp');
  assert.match(plugin.version, /^\d+\.\d+\.\d+$/);
  assert.ok(plugin.description);
  const skill = await readFile(new URL('../skills/web3mcp/SKILL.md', import.meta.url), 'utf8');
  assert.match(skill, /^---\r?\nname: web3mcp\r?\ndescription: .+\r?\n---/);
});

test('real stdio discovery from unrelated cwd with spaces', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'web3mcp codex '));
  const client = new Client({ name: 'codex-integration-check', version: '0.0.1' });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [fileURLToPath(new URL('../scripts/serve.ts', import.meta.url))],
    cwd,
    env: { ...process.env, WEB3MCP_MANIFEST_DIR: join(cwd, 'wrong-directory') } as Record<string, string>,
  });
  try {
    await client.connect(transport);
    const result = await client.callTool({ name: 'discover', arguments: { name: 'vault.web3mcp-demo.eth' } });
    assert.notEqual(result.isError, true);
    assert.deepEqual(result.content, [{ type: 'text', text: "Discovered vault.web3mcp-demo.eth on chain 11155111: vault_get_balance, tx_vault_deposit, tx_vault_withdraw. If these tools don't appear in your tool list, run them with the call tool." }]);
    const { tools } = await client.listTools();
    assert.deepEqual(tools.map(({ name }) => name).sort(), ['call', 'discover', 'tx_vault_deposit', 'tx_vault_withdraw', 'vault_get_balance']);
    for (const name of ['vault_get_balance', 'tx_vault_deposit', 'tx_vault_withdraw']) {
      assert.equal(tools.find((tool) => tool.name === name)?.annotations?.readOnlyHint, !name.startsWith('tx_'));
    }
  } finally {
    await client.close();
    await rmdir(cwd);
  }
});
