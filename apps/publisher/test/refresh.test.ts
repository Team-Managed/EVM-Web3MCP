import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ExpirationTime, type CreateEntityParameters } from '@arkiv-network/sdk';
import type { Hex } from 'viem';
import { refreshBatch } from '../dist/refresh.js';

const NOW = `0x${'a'.repeat(64)}` as Hex;
const OLD = `0x${'b'.repeat(64)}` as Hex;
const key = (n: number) => `0x${n.toString().padStart(64, '0')}` as Hex;
const owned = (n: number, digest: Hex) => ({ $key: key(n), digest: { type: 'str', value: digest } });
const expiration = ExpirationTime.fromDays(30);
const create = { values: { ens: 'agentswap.web3mcp.eth' }, expiration } as unknown as CreateEntityParameters;

test('an unchanged manifest extends its listing and deletes every other, never the current one', () => {
  const { current, batch } = refreshBatch([owned(1, OLD), owned(2, NOW), owned(3, NOW)], NOW, create, expiration);
  assert.equal(current, key(2));
  assert.deepEqual(batch.extensions, [{ entityKey: key(2), expiration }]);
  assert.deepEqual(batch.deletes, [{ entityKey: key(1) }, { entityKey: key(3) }]);
  assert.deepEqual(batch.creates, []);
});

test('a changed manifest deletes the old listings and writes a new one', () => {
  const { current, batch } = refreshBatch([owned(1, OLD)], NOW, create, expiration);
  assert.equal(current, undefined);
  assert.deepEqual(batch.extensions, []);
  assert.deepEqual(batch.deletes, [{ entityKey: key(1) }]);
  assert.deepEqual(batch.creates, [create]);
  assert.deepEqual(refreshBatch([], NOW, create, expiration).batch, { deletes: [], extensions: [], creates: [create] });
});
