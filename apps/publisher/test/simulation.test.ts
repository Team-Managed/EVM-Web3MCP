import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPublicClient, custom, type Address } from 'viem';
import { sepolia } from 'viem/chains';
import { simulatePublication, TRANSACTION_GAS_CAP } from '../dist/simulation.js';

const account = '0x0000000000000000000000000000000000100001' as Address;
const to = '0x0000000000000000000000000000000000100002' as Address;
test('actual viem transport emits exactly two fee-funded, bounded transactions without sentinel calls', async () => {
  const requests: { method: string; params?: unknown }[] = [];
  const client = createPublicClient({ chain: sepolia, transport: custom({ request: async ({ method, params }) => {
    requests.push({ method, params });
    if (method === 'eth_blockNumber') return '0x64';
    if (method === 'eth_getTransactionCount') return '0x7';
    if (method === 'eth_getBalance') return '0xde0b6b3a7640000';
    if (method === 'eth_getBlockByNumber') return { number: '0x64', baseFeePerGas: '0x64', transactions: [], timestamp: '0x1' };
    if (method === 'eth_maxPriorityFeePerGas') return '0x2';
    if (method === 'eth_simulateV1') return [{ calls: ['0x186a0', '0x2ee0'].map(gasUsed => ({ status: '0x1', gasUsed })) }];
    throw new Error(`Unexpected RPC ${method}`);
  } }) });
  const calls = [{ to, data: '0x1234' as const, value: 0n }, { to, data: '0x5678' as const, value: 0n }];
  const result = await simulatePublication(client, account, calls);
  assert.deepEqual(result.gas, [120000n, 21000n]);
  const simulations = requests.filter(r => r.method === 'eth_simulateV1');
  assert.equal(simulations.length, 2);
  for (const [index, request] of simulations.entries()) {
    const [body, block] = request.params as [{ validation: boolean; blockStateCalls: { calls: Record<string, string>[] }[] }, string];
    assert.equal(body.validation, true); assert.equal(block, '0x64');
    assert.equal(body.blockStateCalls.length, 1); assert.equal(body.blockStateCalls[0].calls.length, 2);
    body.blockStateCalls[0].calls.forEach((call, i) => {
      assert.equal(call.from, account); assert.equal(call.to, to); assert.equal(call.data, calls[i].data);
      assert.equal(call.value, '0x0'); assert.equal(BigInt(call.nonce), BigInt(7 + i));
      assert.ok(BigInt(call.maxFeePerGas) >= 100n); assert.equal(BigInt(call.maxPriorityFeePerGas), 2n);
      assert.equal(BigInt(call.gas), index === 0 ? TRANSACTION_GAS_CAP : result.gas[i]);
    });
  }
});

test('rejects unaffordable fees and gas estimates lacking cap headroom', async () => {
  const base = { getBlockNumber: async () => 100n, getTransactionCount: async () => 0,
    estimateFeesPerGas: async () => ({ maxFeePerGas: 100n, maxPriorityFeePerGas: 1n }),
    getBalance: async () => 0n,
    request: async () => [{ calls: [0, 1].map(() => ({ status: '0x1', gasUsed: '0xf42400' })) }],
  };
  const calls = [{ to, data: '0x' as const }, { to, data: '0x' as const }];
  await assert.rejects(simulatePublication(base as never, account, calls), /cannot fund/);
  await assert.rejects(simulatePublication({ ...base, getBalance: async () => 10n ** 18n } as never, account, calls), /20% margin/);
});
