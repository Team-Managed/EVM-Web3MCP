import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { decodeFunctionData, erc20Abi, type Address, type Hex } from 'viem';
import { discover, executeRead, prepareWrite, ToolError } from '../dist/index.js';
import { codeWith, fakeClient, published, USDC, VAULT, vaultChain, type FakeChain } from './fake-chain.ts';

const RIYA = '0x00000000000000000000000000000000000000AA' as Address;

async function setup(overrides: FakeChain = {}) {
  const client = fakeClient(vaultChain(overrides));
  return { client, protocol: await discover(client, 'vault.web3mcp-demo.eth') };
}

const reads =
  (allowance = 0n) =>
  (functionName: string): unknown =>
    ({ decimals: 6, balanceOf: 10_500000n, allowance })[functionName];

const simulateOk = (calls: unknown[]) => ({
  results: calls.map(() => ({ status: 'success' })),
  assetChanges: [{ token: { address: USDC, symbol: 'USDC', decimals: 6 }, value: { pre: 50_000000n, post: 40_000000n, diff: -10_000000n } }],
});

test('a read formats its result with the declared decimals', async () => {
  const { client, protocol } = await setup({ read: reads() });
  assert.equal(await executeRead(client, protocol, 'get_balance', { owner: RIYA }), '10.5 USDC');
});

test('an address input accepts an ENS name', async () => {
  let asked: unknown;
  const { client, protocol } = await setup({
    addresses: { 'riya.eth': RIYA },
    read: (fn, args) => {
      if (fn === 'balanceOf') asked = args[0];
      return reads()(fn);
    },
  });
  await executeRead(client, protocol, 'get_balance', { owner: 'riya.eth' });
  assert.equal(asked, RIYA);
});

test('a write approves first when the allowance is too low, then simulates', async () => {
  const { client, protocol } = await setup({ read: reads(0n), simulate: simulateOk });
  const prepared = await prepareWrite(client, protocol, 'deposit', { amount: '10' }, RIYA);
  assert.deepEqual(prepared.calls.map((c) => c.to), [USDC, VAULT]);
  const approve = decodeFunctionData({ abi: erc20Abi, data: prepared.calls[0].data as Hex });
  assert.deepEqual(approve.args, [VAULT, 10_000000n]);
  assert.deepEqual(prepared.assetChanges, [{ token: USDC, symbol: 'USDC', change: '-10' }]);
});

test('a write skips the approval when the allowance already covers it', async () => {
  const { client, protocol } = await setup({ read: reads(100_000000n), simulate: simulateOk });
  const prepared = await prepareWrite(client, protocol, 'deposit', { amount: '10' }, RIYA);
  assert.deepEqual(prepared.calls.map((c) => c.to), [VAULT]);
});

test('a failed simulation is reported with the failing step', async () => {
  const { client, protocol } = await setup({
    read: reads(0n),
    simulate: (calls) => ({
      results: calls.map((_, i) => (i === 1 ? { status: 'failure', error: { message: 'insufficient balance' } } : { status: 'success' })),
      assetChanges: [],
    }),
  });
  await assert.rejects(prepareWrite(client, protocol, 'deposit', { amount: '10' }, RIYA), /step 2 .*insufficient balance/);
});

test('a write needs the wallet address', async () => {
  const { client, protocol } = await setup({ read: reads() });
  await assert.rejects(prepareWrite(client, protocol, 'deposit', { amount: '10' }, undefined), ToolError);
});

test('amounts must be plain decimals', async () => {
  const { client, protocol } = await setup({ read: reads(), simulate: simulateOk });
  await assert.rejects(prepareWrite(client, protocol, 'deposit', { amount: '1e6' }, RIYA), /plain decimal/);
});

test('amounts with more decimals than the token are refused, not rounded', async () => {
  const { client, protocol } = await setup({ read: reads(), simulate: simulateOk });
  await assert.rejects(prepareWrite(client, protocol, 'deposit', { amount: '0.0000001' }, RIYA), /more decimal places than usdc supports \(6\)/);
  const exact = await prepareWrite(client, protocol, 'deposit', { amount: '10.123456' }, RIYA);
  assert.match(exact.calls.at(-1)!.description, /deposit\(10123456\)/);
});

const swapManifest = JSON.parse(readFileSync(new URL('../../../spec/fixtures/valid/agentswap.web3mcp.eth.json', import.meta.url), 'utf8'));
const { swap: SWAP, usdc: SWAP_USDC } = swapManifest.contracts as Record<string, Address>;

async function swapSetup(read: FakeChain['read']) {
  const client = fakeClient({
    texts: { 'agentswap.web3mcp.eth': published(swapManifest) },
    code: {
      [SWAP.toLowerCase()]: codeWith(
        'function ethPrice()',
        'function quoteEthToUsdc(uint128)',
        'function quoteUsdcToEth(uint128)',
        'function swapEthToUsdc(address)',
        'function swapUsdcToEth(uint256,address)',
      ),
      [SWAP_USDC.toLowerCase()]: codeWith('function balanceOf(address)', 'function decimals()', 'function approve(address,uint256)'),
    },
    read,
    simulate: (calls) => ({ results: calls.map(() => ({ status: 'success' })), assetChanges: [] }),
  });
  return { client, protocol: await discover(client, 'agentswap.web3mcp.eth') };
}

test('a dry-run read, like a Uniswap quote, runs and formats with fixed decimals', async () => {
  let asked: unknown;
  const { client, protocol } = await swapSetup((fn, args) => {
    if (fn === 'quoteUsdcToEth') asked = args[0];
    return { decimals: 6, quoteUsdcToEth: 400_000_000_000_000n }[fn];
  });
  assert.equal(await executeRead(client, protocol, 'quote_usdc_to_eth', { amount: '10' }), '0.0004 ETH');
  assert.equal(asked, 10_000000n);
});

test('an ether input is sent as the call value', async () => {
  const { client, protocol } = await swapSetup(() => undefined);
  const prepared = await prepareWrite(client, protocol, 'eth_to_usdc', { amount: '0.001', recipient: RIYA }, RIYA);
  assert.deepEqual(prepared.calls.map((c) => [c.to, c.value]), [[SWAP, 10n ** 15n]]);
  await assert.rejects(
    prepareWrite(client, protocol, 'eth_to_usdc', { amount: '0.0000000000000000001', recipient: RIYA }, RIYA),
    /more decimal places than ETH supports \(18\)/,
  );
});
