import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { decodeFunctionData, parseAbi, erc20Abi } from 'viem';
import { parseDateInput, formatDateInput, prepareWrite, discover } from '../dist/index.js';
import { fakeClient, codeWith, published } from './fake-chain.ts';

test('date inputs resolve calendar dates and explicit offsets to UTC seconds', () => {
  assert.equal(parseDateInput('1970-01-01'), 0n);
  assert.equal(parseDateInput('2028-02-29'), BigInt(Date.parse('2028-02-29T00:00:00Z') / 1000));
  assert.equal(parseDateInput('2026-11-07T05:30:00+05:30'), parseDateInput('2026-11-07'));
  assert.equal(parseDateInput('2026-11-07T00:00:00.999999999Z'), parseDateInput('2026-11-07'));
  assert.equal(formatDateInput(parseDateInput('2026-11-07')), '2026-11-07T00:00:00Z (UTC)');
});

test('date inputs reject normalization, ambiguity, malformed dates and overflow', () => {
  for (const value of ['2026-02-29', '2026-04-31', '2026-00-01', '2026-01-00', '2026-13-01',
    '2026-01-01T24:00:00Z', '2026-01-01T00:60:00Z', '2026-01-01T00:00:60Z',
    '2026-01-01T00:00:00', '2026-01-01T00:00:00-00:00', '2026-01-01T00:00:00+14:01',
    '2026-01-01T00:00:00+01:99', '1969-12-31', '1970-01-01T00:00:00+01:00', '0000-01-01', '9999999999999999-01-01', '1', '2026-1-1', '2026-01-01\n']) {
    assert.throws(() => parseDateInput(value), /valid ISO/, value);
  }
});

test('GiftBox USDC input scales decimals, approves exact amount, and encodes the date', async () => {
  const manifest = JSON.parse(readFileSync(new URL('../../../spec/fixtures/valid/gifts.web3mcp.eth.json', import.meta.url), 'utf8'));
  const box = manifest.contracts.giftbox;
  const signatures = manifest.tools.flatMap((t: { kind: string; call?: { function: string }; steps?: { call?: { function: string } }[] }) =>
    t.kind === 'read' ? [t.call!.function] : t.steps!.flatMap(s => s.call ? [s.call.function] : []));
  const client = fakeClient({ texts: { 'gifts.web3mcp.eth': published(manifest) }, code: {
    [box]: codeWith(...signatures), [manifest.contracts.usdc]: codeWith('function approve(address,uint256)', 'function decimals()'),
  }, read: fn => fn === 'decimals' ? 6 : 0n,
  simulate: calls => ({ results: calls.map(() => ({ status: 'success' })), assetChanges: [] }) });
  const protocol = await discover(client, 'gifts.web3mcp.eth');
  const args = { name: 'riya.eth', amount: '10.123456', unlock_on: '2028-02-29T05:30:00+05:30', message: 'Gift' };
  const p = await prepareWrite(client, protocol, 'gift_usdc', args, box);
  assert.equal(p.calls.length, 2);
  assert.deepEqual(decodeFunctionData({ abi: erc20Abi, data: p.calls[0].data }).args, [box, 10123456n]);
  const abi = parseAbi(['function giftUsdc(string,uint256,uint64,string) returns (uint256)']);
  assert.deepEqual(decodeFunctionData({ abi, data: p.calls[1].data }).args, ['riya.eth', 10123456n, parseDateInput('2028-02-29'), 'Gift']);
  assert.equal(p.calls[1].value, undefined);
  await assert.rejects(prepareWrite(client, protocol, 'gift_usdc', { ...args, unlock_on: '2027-02-29' }, box), /valid ISO date/);
});

test('GiftBox preparation encodes uint64 seconds and ETH value while showing UTC', async () => {
  const manifest = JSON.parse(readFileSync(new URL('../../../spec/fixtures/valid/gifts.web3mcp.eth.json', import.meta.url), 'utf8'));
  const box = manifest.contracts.giftbox;
  const client = fakeClient({ texts: { 'gifts.web3mcp.eth': published(manifest) }, code: {
    [box]: codeWith(...manifest.tools.flatMap((t: { kind: string; call?: { function: string }; steps?: { call?: { function: string } }[] }) =>
      t.kind === 'read' ? [t.call!.function] : t.steps!.flatMap(s => s.call ? [s.call.function] : []))),
    [manifest.contracts.usdc]: codeWith('function approve(address,uint256)', 'function decimals()'),
  }, simulate: calls => ({ results: calls.map(() => ({ status: 'success' })), assetChanges: [] }) });
  const protocol = await discover(client, 'gifts.web3mcp.eth');
  const p = await prepareWrite(client, protocol, 'gift_eth', { name: 'riya.eth', amount: '0.001', unlock_on: '2028-02-29', message: 'Happy birthday' }, box);
  const decoded = decodeFunctionData({ abi: parseAbi(['function giftEth(string,uint64,string) payable returns (uint256)']), data: p.calls[0].data });
  assert.deepEqual(decoded.args, ['riya.eth', parseDateInput('2028-02-29'), 'Happy birthday']);
  assert.equal(p.calls[0].value, 1000000000000000n);
  assert.match(p.calls[0].description, /2028-02-29T00:00:00Z \(UTC\)/);
  assert.match(p.calls[0].args![1].value, /UTC/);
});
