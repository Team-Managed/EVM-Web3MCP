import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rabdi } from '@arkiv-network/sdk/chains';
import { Approvals } from '@web3mcp/mcp/approvals';
import { browserTransport } from '../dist/browser.js';

const HASH = `0x${'ab'.repeat(32)}`;
const FROM = '0x88f74C969Ee6d8c7D5638d0f0b4024c5Bc933D67';
const page = { protocol: 'agentswap.web3mcp.eth', title: 'List agentswap.web3mcp.eth in Web3MCP search', description: 'Write its search listing' };

/** The transport with a fake RPC, and the signing page's API for the request it opens. */
function setup() {
  let opened!: (url: string) => void;
  const url = new Promise<string>((resolve) => (opened = resolve));
  const forwarded: string[] = [];
  const chain = rabdi({ accessKey: 'secret-key' });
  const transport = browserTransport(chain, page, new Approvals(opened), async ({ method }) => (forwarded.push(method), '0x76ecaf'))({ chain });
  const sent = transport.request({ method: 'eth_sendTransaction', params: [{ from: FROM, to: `0x44${'0'.repeat(36)}44`, data: '0x1234', gas: '0x5208' }] });
  const api = url.then((u) => u.replace('/approve/', '/api/approvals/'));
  const settle = async (body: object) =>
    fetch(await api, { method: 'POST', headers: { origin: new URL(await api).origin, 'content-type': 'application/json' }, body: JSON.stringify(body) });
  return { transport, forwarded, sent, api, settle };
}

test('reads go to the RPC, and the transaction goes to the signing page and back with its hash', async () => {
  const { transport, forwarded, sent, api, settle } = setup();
  assert.equal(await transport.request({ method: 'eth_chainId' }), '0x76ecaf');
  assert.deepEqual(forwarded, ['eth_chainId']);

  const shown = await (await fetch(await api)).json();
  assert.equal(shown.title, page.title);
  assert.equal(shown.account, FROM);
  assert.deepEqual(shown.calls[0], { to: `0x44${'0'.repeat(36)}44`, data: '0x1234', gas: '21000', description: page.description, contract: 'Arkiv' });
  // The wallet may add Arkiv's network from this, so it gets the public RPC, never the access key.
  assert.equal(shown.chain.id, 7794095);
  assert.deepEqual(shown.chain.rpcUrls.default.http, ['https://rpc.rabdi.db-chain.testnet.arkiv.network']);

  assert.equal((await settle({ status: 'submitted', hashes: [HASH] })).status, 200);
  assert.equal(await sent, HASH);
  assert.deepEqual(forwarded, ['eth_chainId']);
});

test('a rejection in the wallet fails the send once, without opening the page again', async () => {
  const { sent, settle } = setup();
  const failed = assert.rejects(sent, /rejected it in your wallet/);
  await settle({ status: 'rejected' });
  await failed;
});
