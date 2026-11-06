import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { ToolListChangedNotificationSchema } from '@modelcontextprotocol/sdk/types.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Approvals } from '../dist/approvals.js';
import { createServer, type ServerOptions } from '../dist/server.js';
import { fakeClient, published, USDC, vaultChain, vaultManifest } from '../../sdk/test/fake-chain.ts';
import { send } from './http.ts';

const manifestDir = fileURLToPath(new URL('../../../spec/fixtures/valid/', import.meta.url));

async function connect(options: ServerOptions = { manifestDir }) {
  // Tests never open a real browser.
  const server = createServer({ approvals: new Approvals(() => {}), ...options });
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
  assert.deepEqual(await toolNames(client), ['call', 'discover', 'status']);

  const result = await call(client, 'discover', { name: 'vault.web3mcp-demo.eth' });
  const first = result.content[0];
  assert.ok(!result.isError, first?.type === 'text' ? first.text : 'discover failed');
  assert.deepEqual(await toolNames(client), [
    'call',
    'discover',
    'status',
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
  assert.match(review, /1\. usdc\.approve\(vault, 10 USDC\)/);
  assert.match(review, /2\. vault\.deposit\(10 USDC\)/);
  assert.match(review, /USDC -10/);
});

test('discovering a protocol again refreshes its tools and drops pulled ones', async () => {
  const chain = vaultChain();
  const { client } = await connect({ client: fakeClient(chain) });
  await call(client, 'discover', { name: 'vault.web3mcp-demo.eth' });

  // The publisher pulls withdraw and rewords deposit.
  const updated = structuredClone(vaultManifest);
  updated.tools = updated.tools.filter((t: { name: string }) => t.name !== 'withdraw');
  updated.tools.find((t: { name: string }) => t.name === 'deposit').description = 'Deposit USDC. Now with a new description.';
  chain.texts!['vault.web3mcp-demo.eth'] = published(updated);
  await call(client, 'discover', { name: 'vault.web3mcp-demo.eth' });

  const { tools } = await client.listTools();
  assert.deepEqual(tools.map((t) => t.name).sort(), ['call', 'discover', 'status', 'tx_vault_deposit', 'vault_get_balance']);
  assert.match(tools.find((t) => t.name === 'tx_vault_deposit')?.description ?? '', /new description/);
  assert.equal((await call(client, 'call', { tool: 'tx_vault_withdraw', args: { amount: '1' } })).isError, true);
});

test('a write opens the signing page, and status confirms the transaction on chain', async () => {
  let opened = '';
  const chain = vaultChain({
    read: (fn) => ({ decimals: 6, balanceOf: 10_500000n, allowance: 0n })[fn],
    simulate: (calls) => ({ results: calls.map(() => ({ status: 'success' })), assetChanges: [] }),
  });
  const { client } = await connect({
    client: fakeClient(chain),
    account: '0x00000000000000000000000000000000000000aa',
    approvals: new Approvals((url) => (opened = url)),
  });
  await call(client, 'discover', { name: 'vault.web3mcp-demo.eth' });

  const prepared = textOf(await call(client, 'tx_vault_deposit', { amount: '10' }));
  const id = /id "([0-9a-f]{32})"/.exec(prepared)?.[1] ?? '';
  assert.ok(opened.endsWith(`/approve/${id}`), prepared);

  // The user signs on the page, which reports the hash; status then checks the chain itself.
  const hash = `0x${'ab'.repeat(32)}`;
  const origin = new URL(opened).origin;
  const posted = await send(`${origin}/api/approvals/${id}`, { method: 'POST', origin, body: { status: 'submitted', hashes: [hash] } });
  assert.equal(posted.status, 200);
  assert.match(textOf(await call(client, 'status', { id })), /not found on chain yet/);
  chain.receipts = { [hash]: 'success' };
  assert.match(textOf(await call(client, 'status', { id })), new RegExp(`confirmed: ${hash}`));
});

test('a failed wallet lookup is retried, and reads never wait on it', async () => {
  const chain = fakeClient(
    vaultChain({
      read: (fn) => ({ decimals: 6, balanceOf: 10_500000n, allowance: 0n })[fn],
      simulate: (calls) => ({ results: calls.map(() => ({ status: 'success' })), assetChanges: [] }),
    }),
  );
  let lookups = 0;
  const flaky = {
    ...chain,
    getEnsAddress: async () => {
      lookups += 1;
      if (lookups === 1) throw new Error('block not found');
      return '0x00000000000000000000000000000000000000AA';
    },
  } as typeof chain;
  const { client } = await connect({ client: flaky, account: 'riya.eth' });
  await call(client, 'discover', { name: 'vault.web3mcp-demo.eth' });

  // The first lookup fails, but a read doesn't need the wallet and still works.
  assert.equal(textOf(await call(client, 'vault_get_balance', { owner: '0x00000000000000000000000000000000000000aa' })), '10.5 USDC');
  // The failure isn't cached, so the write's own lookup succeeds.
  const review = await call(client, 'tx_vault_deposit', { amount: '10' });
  assert.ok(!review.isError, textOf(review));
});
