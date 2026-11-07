import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeFunctionData, parseAbi, toFunctionSelector, type Address, type Hex } from 'viem';
import { Approvals } from '@web3mcp/mcp/approvals';
import { readFileSync } from 'node:fs';
import { validateManifest } from '@web3mcp/evm';
import { preparePublication, revalidatePublication, verifyPublication, type PublicationClient } from '../dist/publication.js';
import { runPublication } from '../dist/session.js';

const box = '0x0000000000000000000000000000000000100001' as Address;
const usdc = '0x0000000000000000000000000000000000100002' as Address;
const resolver = '0x0000000000000000000000000000000000100003' as Address;
const root = '0x0000000000000000000000000000000000100004' as Address;
const eth = '0x0000000000000000000000000000000000100005' as Address;
const account = '0x0000000000000000000000000000000000100006' as Address;
const owner = '0x0000000000000000000000000000000000100007' as Address;
const other = '0x0000000000000000000000000000000000100008' as Address;
const zero = '0x0000000000000000000000000000000000000000';
const hash1 = `0x${'ab'.repeat(32)}` as Hex, hash2 = `0x${'cd'.repeat(32)}` as Hex;
const options = { account, root, resolver, owner, usdc };
const real = JSON.parse(readFileSync(new URL('../../../manifests/sepolia/gifts.web3mcp.eth.json', import.meta.url), 'utf8'));
const gifts = (giftbox: string, token: string) => ({ ...real, contracts: { giftbox, usdc: token } });

function fixture() {
  const manifest = gifts(box, usdc);
  const signatures = validateManifest(manifest).tools.flatMap(t => t.kind === 'read' ? [t.call.function] : t.steps.flatMap(s => 'call' in s ? [s.call.function] : []));
  const code = (`0x6080${signatures.map(s => toFunctionSelector(s).slice(2)).join('')}${toFunctionSelector('approve(address,uint256)').slice(2)}${toFunctionSelector('decimals()').slice(2)}`) as Hex;
  const state = { chain: 11155111, currentOwner: owner, resolved: resolver, token: usdc, immutableRoot: root,
    supports: true, allow: true, deniedKey: '', noCode: '', simulationFails: false, changed: false,
    txSigner: account, txTarget: resolver, txWrongData: false, reverted: false, missingReceipt: false,
    wrongReadback: false, wrongReceipt: false, resolverImpl: zero,
    records: new Map<string, string>(), simulations: [] as unknown[], transactions: new Map<string, unknown>() };
  const client = {
    getChainId: async () => state.chain, getBlockNumber: async () => 100n,
    getTransactionCount: async () => 7,
    estimateFeesPerGas: async () => ({ maxFeePerGas: 100n, maxPriorityFeePerGas: 1n }),
    getBalance: async () => 10n ** 18n,
    getEnsName: async () => null,
    getCode: async ({ address }: { address: string }) => address === state.noCode ? '0x' : `${code}${state.changed && address === resolver ? '00' : ''}`,
    getStorageAt: async ({ address }: { address: string }) => address === resolver ? `0x${state.resolverImpl.slice(2).padStart(64, '0')}` : `0x${'0'.repeat(64)}`,
    getEnsResolver: async () => state.resolved,
    getEnsText: async ({ key }: { key: string }) => state.wrongReadback ? 'wrong' : state.records.get(key) ?? null,
    readContract: async ({ address, functionName: fn, args = [] }: { address: string; functionName: string; args?: unknown[] }) => {
      if (fn === 'root') return state.immutableRoot;
      if (fn === 'usdc') return state.token;
      if (fn === 'decimals') return 6;
      if (fn === 'findOwner') return state.currentOwner;
      if (fn === 'getResolver') return address === root ? zero : resolver;
      if (fn === 'getSubregistry') return address === root ? eth : zero;
      // Like the live ENSv2 PermissionedResolver: reads go through resolve(bytes,bytes), and text(bytes32,string) isn't offered.
      if (fn === 'supportsInterface') return args[0] !== '0xffffffff' && args[0] !== toFunctionSelector('text(bytes32,string)') && state.supports;
      if (fn === 'hasRootRoles') return false;
      if (fn === 'hasRoles') {
        const { keccak256, toBytes } = await import('viem');
        return state.allow && args[2] === account && (!state.deniedKey || args[0] !== BigInt(keccak256(toBytes(state.deniedKey))));
      }
      throw new Error(`Unexpected read ${fn}`);
    },
    request: async (input: { method: string; params: [{ blockStateCalls: { calls: { from: Address }[] }[] }] }) => {
      state.simulations.push(input); assert.equal(input.method, 'eth_simulateV1');
      const calls = input.params[0].blockStateCalls[0].calls;
      calls.forEach(call => assert.equal(call.from, account));
      return [{ calls: calls.map(() => ({ status: state.simulationFails ? '0x0' : '0x1', gasUsed: '0x186a0' })) }];
    },
    getTransaction: async ({ hash }: { hash: string }) => {
      const call = state.transactions.get(hash) as { data: Hex } | undefined;
      if (!call) throw new Error('Unknown hash');
      return { hash, from: state.txSigner, to: state.txTarget, input: state.txWrongData ? '0x' : call.data, value: 0n, chainId: state.chain };
    },
    getTransactionReceipt: async ({ hash }: { hash: string }) => {
      if (state.missingReceipt) throw new Error('RPC unavailable');
      return { transactionHash: state.wrongReceipt ? hash2 : hash, status: state.reverted ? 'reverted' : 'success' };
    },
  } as unknown as PublicationClient;
  return { manifest, client, state };
}

test('DNS setter encoding, signer simulation and explicit nearest-owner scope', async () => {
  const { client, manifest, state } = fixture();
  const p = await preparePublication(client, manifest, options);
  assert.equal(p.ownerName, 'web3mcp.eth'); assert.equal(p.plan.calls.length, 1);
  const abi = parseAbi(['function multicall(bytes[])', 'function setText(bytes,string,string)']);
  const [first] = decodeFunctionData({ abi, data: p.plan.calls[0].data }).args![0] as Hex[];
  const decoded = decodeFunctionData({ abi, data: first });
  assert.equal(decoded.args![0], '0x05676966747307776562336d63700365746800');
  assert.equal(decoded.args![1], 'org.web3mcp.manifest');
  assert.equal(state.simulations.length, 2);
});

test('rejects wrong chain, owner, signer permissions and resolver target', async () => {
  for (const scenario of ['chain', 'owner', 'signer', 'resolver', 'permission']) {
    const f = fixture();
    if (scenario === 'chain') f.state.chain = 1;
    if (scenario === 'owner') f.state.currentOwner = other;
    if (scenario === 'resolver') f.state.resolved = other;
    if (scenario === 'permission') f.state.deniedKey = 'org.web3mcp.digest';
    await assert.rejects(preparePublication(f.client, f.manifest, { ...options, ...(scenario === 'signer' ? { account: other } : {}) }));
    assert.equal(f.state.simulations.length, 0);
  }
});

test('fails closed for unsupported resolver, missing code, fixture, bad manifest and immutable mismatch', async () => {
  for (const scenario of ['interface', 'bytecode', 'fixture', 'manifest', 'token', 'root']) {
    const f = fixture();
    if (scenario === 'interface') f.state.supports = false;
    if (scenario === 'bytecode') f.state.noCode = box;
    if (scenario === 'token') f.state.token = other;
    if (scenario === 'root') f.state.immutableRoot = other;
    const m = scenario === 'fixture' ? gifts('0x0000000000000000000000000000000000000003', usdc) : scenario === 'manifest' ? {} : f.manifest;
    await assert.rejects(preparePublication(f.client, m, options));
    assert.equal(f.state.simulations.length, 0);
  }
});

test('simulation failure prevents any handoff and preflight rejects code or ownership drift', async () => {
  const f = fixture(); f.state.simulationFails = true;
  await assert.rejects(preparePublication(f.client, f.manifest, options), /simulation failed/);
  f.state.simulationFails = false;
  const p = await preparePublication(f.client, f.manifest, options);
  f.state.changed = true; await assert.rejects(revalidatePublication(f.client, p), /changed/);
  f.state.changed = false; f.state.resolverImpl = other;
  await assert.rejects(revalidatePublication(f.client, p), /changed/);
  f.state.resolverImpl = zero; f.state.currentOwner = other;
  await assert.rejects(revalidatePublication(f.client, p), /owner/);
});

test('receipts bind signer/target/calldata and exact read-back; failed/rejected never confirm', async () => {
  const f = fixture(), p = await preparePublication(f.client, f.manifest, options);
  f.state.transactions.set(hash1, p.plan.calls[0]);
  assert.equal((await verifyPublication(f.client, p, { status: 'rejected', hashes: [] })).status, 'rejected');
  assert.equal((await verifyPublication(f.client, p, { status: 'failed', hashes: [] })).status, 'failed');
  f.state.missingReceipt = true;
  assert.notEqual((await verifyPublication(f.client, p, { status: 'submitted', hashes: [hash1] })).status, 'confirmed');
  f.state.missingReceipt = false;
  await assert.rejects(verifyPublication(f.client, p, { status: 'submitted', hashes: [hash1] }), /read-back/);
  p.plan.records.forEach(r => f.state.records.set(r.key, r.value));
  assert.equal((await verifyPublication(f.client, p, { status: 'submitted', hashes: [hash1] })).status, 'confirmed');
  f.state.wrongReadback = true;
  await assert.rejects(verifyPublication(f.client, p, { status: 'submitted', hashes: [hash1] }), /read-back/);
  f.state.wrongReadback = false; f.state.wrongReceipt = true;
  await assert.rejects(verifyPublication(f.client, p, { status: 'submitted', hashes: [hash1] }), /Receipt hash/);
  f.state.wrongReceipt = false;
  await assert.rejects(verifyPublication(f.client, p, { status: 'submitted', hashes: [hash1, hash1] }), /duplicates/);
  for (const field of ['txSigner', 'txTarget', 'txWrongData'] as const) {
    const prior = f.state[field]; Object.assign(f.state, { [field]: field === 'txWrongData' ? true : other });
    await assert.rejects(verifyPublication(f.client, p, { status: 'submitted', hashes: [hash1] }), /does not match/);
    Object.assign(f.state, { [field]: prior });
  }
  f.state.reverted = true;
  assert.notEqual((await verifyPublication(f.client, p, { status: 'submitted', hashes: [hash1] })).status, 'confirmed');
});

test('independent confirmation can cancel without creating a local signing request', async () => {
  const f = fixture(), p = await preparePublication(f.client, f.manifest, options);
  const result = await runPublication(f.client, p, { confirm: async () => false,
    approvals: () => { throw new Error('Must not create a request'); } });
  assert.equal(result.status, 'cancelled');
});

for (const result of ['rejected', 'failed', 'unverified', 'confirmed'] as const) test(`local mocked signing session: ${result}`, async () => {
  const f = fixture(), p = await preparePublication(f.client, f.manifest, options);
  f.state.transactions.set(hash1, p.plan.calls[0]);
  let posted: Promise<void> | undefined;
  const outcome = await runPublication(f.client, p, { confirm: async () => true, timeoutMs: 2000,
    approvals: beforeSign => new Approvals(() => {}, undefined, beforeSign),
    onCreated: request => { posted = (async () => {
      const origin = new URL(request.url).origin, api = `${origin}/api/approvals/${request.id}`;
      const post = async (body: object) => { const r = await fetch(api, { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(body) }); assert.equal(r.status, 200); };
      assert.equal((await fetch(`${api}/preflight`, { method: 'POST', headers: { origin } })).status, 200);
      if (result === 'rejected') return post({ status: 'rejected' });
      await post({ status: 'pending', hashes: [hash1] });
      if (result === 'failed') { f.state.reverted = true; return post({ status: 'failed', hashes: [hash1] }); }
      // Unverified: the transaction landed but the records don't read back, so verification throws.
      if (result === 'confirmed') p.plan.records.forEach(r => f.state.records.set(r.key, r.value));
      await post({ status: 'submitted', hashes: [hash1] });
    })(); posted.catch(() => {}); },
  });
  await posted; assert.equal(outcome.status, result);
  assert.deepEqual('hashes' in outcome && outcome.hashes, result === 'rejected' ? [] : [hash1]);
});
