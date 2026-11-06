import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { keccak256, toBytes, decodeFunctionData, parseAbi } from 'viem';
import { giftBoxManifest } from '../src/giftbox.ts';
import { publicationPlan } from '../src/prepare.ts';

const box = '0x0000000000000000000000000000000000000003';
const usdc = '0x0000000000000000000000000000000000000002';
const resolver = '0x0000000000000000000000000000000000000004';
test('GiftBox generator requires real address parameters and includes all seven tools', () => {
  const m = giftBoxManifest(box, usdc);
  assert.deepEqual(m.tools.map(t => t.name), ['gifts_for', 'gift', 'who_can_claim', 'gift_usdc', 'gift_eth', 'claim', 'cancel']);
  assert.throws(() => giftBoxManifest(box, box));
  assert.throws(() => giftBoxManifest('0x' + '0'.repeat(40), usdc));
  assert.throws(() => giftBoxManifest('not-an-address', usdc));
});
test('publication digest covers exactly the manifest record bytes and both setText calls', () => {
  const plan = publicationPlan(giftBoxManifest('0x0000000000000000000000000000000000100001', '0x0000000000000000000000000000000000100002'), '0x0000000000000000000000000000000000100003');
  assert.equal(plan.digest, keccak256(toBytes(plan.records[0].value)));
  assert.equal(plan.records[1].value, plan.digest);
  const abi = parseAbi(['function setText(bytes name,string key,string value)']);
  plan.calls.forEach((call, i) => {
    assert.equal(call.to, '0x0000000000000000000000000000000000100003');
    const d = decodeFunctionData({ abi, data: call.data });
    assert.equal(d.args![1], plan.records[i].key); assert.equal(d.args![2], plan.records[i].value);
  });
});
test('publisher refuses to create a request without explicit signer and authority options', () => {
  const cli = fileURLToPath(new URL('../dist/index.js', import.meta.url));
  const fixture = fileURLToPath(new URL('../../../spec/fixtures/valid/gifts.web3mcp.eth.json', import.meta.url));
  const result = spawnSync(process.execPath, [cli, 'publish', fixture], { encoding: 'utf8' });
  assert.equal(result.status, 1); assert.match(result.stderr, /Publication checks or verification failed/);
});

test('publication plan rejects synthetic fixture/precompile targets', () => {
  assert.throws(() => publicationPlan(giftBoxManifest(box, usdc), resolver), /Synthetic/);
});
