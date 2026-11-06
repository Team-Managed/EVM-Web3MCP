import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { encodeDeployData, parseAbi, keccak256 } from 'viem';
import { DEPLOYMENT, deriveDeployment, assertReviewedDeployment, matchesRuntime } from '../dist/deployment.js';

test('CREATE2 payload is salt followed by exactly constructor-encoded creation bytecode', () => {
  const abi = parseAbi(['constructor(address usdc_,address root_)']);
  const init = encodeDeployData({ abi, bytecode: '0x6000', args: [DEPLOYMENT.usdc, DEPLOYMENT.root] });
  const plan = deriveDeployment('0x6000', abi);
  assert.equal(plan.data, `${DEPLOYMENT.salt}${init.slice(2)}`);
  assert.equal(plan.initCodeHash, keccak256(init));
  assert.throws(() => assertReviewedDeployment(plan), /differs from the reviewed/);
});

test('reviewed hash and predicted address must both match', () => {
  const plan = { initCodeHash: DEPLOYMENT.initCodeHash, address: DEPLOYMENT.address, data: '0x' as const };
  assert.doesNotThrow(() => assertReviewedDeployment(plan));
  assert.throws(() => assertReviewedDeployment({ ...plan, address: DEPLOYMENT.factory }));
  assert.throws(() => assertReviewedDeployment({ ...plan, initCodeHash: `0x${'00'.repeat(32)}` }));
});

test('runtime comparison masks immutable slots only and rejects changed code', () => {
  const artifact = { deployedBytecode: { object: `0x60${'00'.repeat(32)}f3`, immutableReferences: { '1': [{ start: 1, length: 32 }] } } };
  assert.equal(matchesRuntime(`0x60${'ab'.repeat(32)}f3`, artifact as never), true);
  assert.equal(matchesRuntime(`0x61${'ab'.repeat(32)}f3`, artifact as never), false);
  assert.equal(matchesRuntime('0x60f3', artifact as never), false);
});

test('non-interactive deployment cannot open a review page or reach wallet prompts', () => {
  const cli = fileURLToPath(new URL('../dist/deploy-giftbox.js', import.meta.url));
  const result = spawnSync(process.execPath, [cli, '--open'], { encoding: 'utf8', timeout: 3000 });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /checks\/verification failed/);
  assert.doesNotMatch(result.stdout, /Local review:/);
});
