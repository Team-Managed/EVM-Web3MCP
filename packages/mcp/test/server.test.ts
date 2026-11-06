import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { ToolListChangedNotificationSchema } from '@modelcontextprotocol/sdk/types.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { createServer, type ServerOptions } from '../dist/server.js';
import { fakeClient, USDC, vaultChain } from '../../sdk/test/fake-chain.ts';

const manifestDir = fileURLToPath(new URL('../../../spec/fixtures/valid/', import.meta.url));

async function connect(options: ServerOptions = { manifestDir }) {
  const server = createServer(options);
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

const textOf = (result: CallToolResult) => {
  const first = result.content[0];
  return first?.type === 'text' ? first.text : '';
};

test('tools discovered from ENS run reads and prepare writes', async () => {
  const chain = fakeClient(
    vaultChain({
      read: (fn) => ({ decimals: 6, balanceOf: 10_500000n, allowance: 0n })[fn],
      simulate: (calls) => ({
        results: calls.map(() => ({ status: 'success' })),
        assetChanges: [{ token: { address: USDC, symbol: 'USDC', decimals: 6 }, value: { pre: 0n, post: 0n, diff: -10_000000n } }],
      }),
    }),
  );
  const { client } = await connect({ client: chain, account: '0x00000000000000000000000000000000000000aa' });

  const discovered = textOf(await call(client, 'discover', { name: 'vault.web3mcp-demo.eth' }));
  assert.match(discovered, /from ENS/);
  assert.match(discovered, /vault 0x0+1 \(owner-verified\)/);

  assert.equal(textOf(await call(client, 'vault_get_balance', { owner: '0x00000000000000000000000000000000000000aa' })), '10.5 USDC');

  const review = textOf(await call(client, 'call', { tool: 'tx_vault_deposit', args: { amount: '10' } }));
  assert.match(review, /1\. usdc\.approve\(vault, 10000000\)/);
  assert.match(review, /2\. vault\.deposit\(10000000\)/);
  assert.match(review, /USDC -10/);
});
