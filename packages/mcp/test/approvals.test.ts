import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Approvals } from '../dist/approvals.js';
import { send } from './http.ts';

const HASH = `0x${'ab'.repeat(32)}`;

async function created() {
  let opened = '';
  const approvals = new Approvals((url) => (opened = url));
  const prepared = {
    protocol: 'vault.web3mcp-demo.eth',
    tool: 'deposit',
    account: '0x00000000000000000000000000000000000000aa',
    calls: [{ to: '0x0000000000000000000000000000000000000002', data: '0x095ea7b3', description: 'usdc.approve(vault, 10000000)' }],
    assetChanges: [],
  };
  const protocol = {
    name: 'vault.web3mcp-demo.eth',
    manifest: { chainId: 11155111 },
    contracts: { vault: { address: '0x0000000000000000000000000000000000000001', trust: 'owner-verified', fingerprint: '0x' } },
  };
  const { id, url } = await approvals.create(prepared as never, protocol as never, 'tx_vault_deposit');
  assert.equal(opened, url);
  const origin = new URL(url).origin;
  return { approvals, id, url, origin, api: `${origin}/api/approvals/${id}` };
}

test('serves the page and the request only to its own host', async () => {
  const { approvals, url, api } = await created();
  assert.match(new URL(url).host, /^127\.0\.0\.1:\d+$/);
  assert.equal((await send(url)).status, 200);
  assert.match(JSON.parse((await send(api)).body).calls[0].description, /usdc\.approve/);
  // A DNS-rebinding page reaches the same port under another host name.
  assert.equal((await send(api, { host: `evil.example:${new URL(url).port}` })).status, 403);
  assert.equal((await send(api.replace(/[0-9a-f]{32}$/, '0'.repeat(32)))).status, 404);
  approvals.close();
});

test('accepts a result only from its own page, and only once', async () => {
  const { approvals, id, origin, api } = await created();
  const submitted = { status: 'submitted', hashes: [HASH] };
  assert.equal((await send(api, { method: 'POST', body: submitted })).status, 403);
  assert.equal((await send(api, { method: 'POST', origin: 'http://evil.example', body: submitted })).status, 403);
  assert.equal((await send(api, { method: 'POST', origin, body: { status: 'submitted', hashes: ['0x12'] } })).status, 400);
  assert.equal((await send(api, { method: 'POST', origin, body: submitted })).status, 200);
  assert.equal(approvals.get(id)?.status, 'submitted');
  assert.equal((await send(api, { method: 'POST', origin, body: { status: 'rejected' } })).status, 409);
  approvals.close();
});

test('wait returns as soon as the page reports', async () => {
  const { approvals, id, origin, api } = await created();
  const started = Date.now();
  const waiting = approvals.wait(id, 10_000);
  await send(api, { method: 'POST', origin, body: { status: 'rejected' } });
  assert.equal((await waiting)?.status, 'rejected');
  assert.ok(Date.now() - started < 2_000);
  approvals.close();
});
