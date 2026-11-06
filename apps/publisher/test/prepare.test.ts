import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { keccak256, toBytes, decodeFunctionData, parseAbi } from 'viem';
import { validateManifest } from '@web3mcp/evm';
import { publicationPlan } from '../src/prepare.ts';

const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const real = read('../../../manifests/sepolia/gifts.web3mcp.eth.json');
const fixture = '../../../spec/fixtures/valid/gifts.web3mcp.eth.json';
const gifts = (giftbox: string, usdc: string) => ({ ...real, contracts: { giftbox, usdc } });

test('the published GiftBox manifest is valid, has all seven tools and matches the spec fixture', () => {
  assert.deepEqual(validateManifest(real).tools.map(t => t.name), ['gifts_for', 'gift', 'who_can_claim', 'gift_usdc', 'gift_eth', 'claim', 'cancel']);
  assert.deepEqual({ ...read(fixture), contracts: real.contracts }, real);
});

test('one multicall publishes the exact manifest bytes and their digest', () => {
  const resolver = '0x0000000000000000000000000000000000100003';
  const plan = publicationPlan(gifts('0x0000000000000000000000000000000000100001', '0x0000000000000000000000000000000000100002'), resolver);
  assert.equal(plan.digest, keccak256(toBytes(plan.records[0].value)));
  assert.equal(plan.records[1].value, plan.digest);
  assert.equal(plan.calls.length, 1);
  assert.equal(plan.calls[0].to, resolver);
  const abi = parseAbi(['function multicall(bytes[] calls) returns (bytes[])', 'function setText(bytes name,string key,string value)']);
  const writes = decodeFunctionData({ abi, data: plan.calls[0].data }).args![0] as `0x${string}`[];
  assert.deepEqual(writes.map(data => decodeFunctionData({ abi, data }).args!.slice(1)), plan.records.map(r => [r.key, r.value]));
});

test('publisher says which option is missing before reading the chain', () => {
  const cli = fileURLToPath(new URL('../dist/index.js', import.meta.url));
  const result = spawnSync(process.execPath, [cli, 'publish', fileURLToPath(new URL(fixture, import.meta.url))], { encoding: 'utf8' });
  assert.equal(result.status, 1); assert.match(result.stderr, /Missing --account/);
});

test('publication plan rejects synthetic fixture/precompile targets', () => {
  assert.throws(() => publicationPlan(read(fixture), '0x0000000000000000000000000000000000000004'), /Synthetic/);
});
