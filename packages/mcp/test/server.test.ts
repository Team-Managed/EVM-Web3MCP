import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { ToolListChangedNotificationSchema } from '@modelcontextprotocol/sdk/types.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { createServer } from '../dist/server.js';

const manifestDir = fileURLToPath(new URL('../../../spec/fixtures/valid/', import.meta.url));

async function connect() {
  const server = createServer({ manifestDir });
  const client = new Client({ name: 'test', version: '0.0.0' });
  const changes: unknown[] = [];
  client.setNotificationHandler(ToolListChangedNotificationSchema, (n) => {
    changes.push(n);
  });
  const [serverSide, clientSide] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverSide), client.connect(clientSide)]);
  return { client, changes };
}

const toolNames = async (client: Client) => (await client.listTools()).tools.map((t) => t.name).sort();

const call = async (client: Client, name: string, args: Record<string, unknown>) =>
  (await client.callTool({ name, arguments: args })) as CallToolResult;

test('discover registers protocol tools and tells the client', async () => {
  const { client, changes } = await connect();
  assert.deepEqual(await toolNames(client), ['call', 'discover']);

  const result = await call(client, 'discover', { name: 'vault.web3mcp-demo.eth' });
  const first = result.content[0];
  assert.ok(!result.isError, first?.type === 'text' ? first.text : 'discover failed');
  assert.deepEqual(await toolNames(client), [
    'call',
    'discover',
    'tx_vault_deposit',
    'tx_vault_withdraw',
    'vault_get_balance',
  ]);
  assert.ok(changes.length > 0, 'expected notifications/tools/list_changed');

  const { tools } = await client.listTools();
  assert.equal(tools.find((t) => t.name === 'vault_get_balance')?.annotations?.readOnlyHint, true);
  assert.equal(tools.find((t) => t.name === 'tx_vault_deposit')?.annotations?.readOnlyHint, false);
});

test('discover refuses names that could escape the manifest folder', async () => {
  const { client } = await connect();
  const result = await call(client, 'discover', { name: '../../etc/passwd' });
  assert.equal(result.isError, true);
});
