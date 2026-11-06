import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { Hex } from 'viem';
import { listing, search, searchTerms, validateManifest, type ArkivReader } from '../dist/index.js';
import { fakeClient, published, vaultManifest } from './fake-chain.ts';

const agentswapJson: unknown = JSON.parse(
  readFileSync(new URL('../../../spec/fixtures/valid/agentswap.web3mcp.eth.json', import.meta.url), 'utf8'),
);
const agentswap = validateManifest(agentswapJson);
const DIGEST = `0x${'a'.repeat(64)}` as Hex;
const OWNER = '0x0000000000000000000000000000000000000abc';

/** An Arkiv query result row, as the SDK returns it without a schema. */
const row = (ens: string, digest: string, terms: string[]) => ({
  $owner: OWNER,
  ens: { type: 'str', value: ens },
  digest: { type: 'str', value: digest },
  ...Object.fromEntries(terms.map((t) => [`t.${t}`, { type: 'bool', value: true }])),
});

/** Returns these rows for any query, and records what was selected. */
function fakeArkiv(rows: object[], seen: { selection?: object } = {}): ArkivReader {
  const builder = { where: () => builder, limit: () => builder, fetch: async () => ({ entities: rows, blockNumber: 1n, skipped: 0 }) };
  return { select: (selection: object) => ((seen.selection = selection), builder) } as unknown as ArkivReader;
}

test('search terms put the keywords first, then words from tools, and fit in one Arkiv entity', () => {
  const terms = searchTerms(agentswap);
  assert.deepEqual(terms.slice(0, 3), ['swap', 'exchange', 'trade']);
  assert.ok(terms.includes('chainlink'));
  assert.ok(terms.length <= 28);
  assert.ok(!terms.includes('to') && !terms.includes('the'));
  // "savings" is stored as "saving", so a search for either finds it.
  assert.ok(searchTerms(validateManifest(vaultManifest)).includes('saving'));
});

test('a listing indexes one attribute per term, within Arkiv limits', () => {
  const { schema, values, terms } = listing(agentswap, DIGEST);
  assert.ok(schema);
  const v = values as Record<string, unknown>;
  assert.equal(v.ens, 'agentswap.web3mcp.eth');
  assert.equal(v.digest, DIGEST);
  assert.equal(v['t.swap'], true);
  assert.equal(Object.keys(v).filter((k) => k.startsWith('t.')).length, terms.length);
});

test('keeps only listings that name the manifest on ENS, and shows what that manifest says', async () => {
  const swapRecords = published(agentswapJson);
  const vaultRecords = published(vaultManifest);
  const swapDigest = swapRecords['org.web3mcp.digest'];
  const seen: { selection?: object } = {};
  const arkiv = fakeArkiv(
    [
      row('vault.web3mcp-demo.eth', vaultRecords['org.web3mcp.digest'], ['usdc']),
      // Stale or fake: its digest isn't the manifest the name publishes now.
      row('agentswap.web3mcp.eth', DIGEST, ['swap', 'usdc']),
      // A stranger's copy of the real digest, claiming words the manifest doesn't have.
      row('agentswap.web3mcp.eth', swapDigest, ['swap', 'usdc', 'lend']),
      // No manifest on ENS at all.
      row('unlisted.eth', DIGEST, ['swap', 'usdc']),
    ],
    seen,
  );
  const chain = fakeClient({ texts: { 'agentswap.web3mcp.eth': swapRecords, 'vault.web3mcp-demo.eth': vaultRecords } });

  const results = await search(arkiv, chain, ['Swaps', 'USDC', 'lend'], 11155111);
  assert.deepEqual(
    results.map((r) => [r.ens, r.matched]),
    [
      ['agentswap.web3mcp.eth', ['swap', 'usdc']],
      ['vault.web3mcp-demo.eth', ['usdc']],
    ],
  );
  assert.equal(results[0].description, agentswap.description);
  assert.equal(results[0].owner, OWNER);
  assert.ok('t.swap' in seen.selection! && 't.lend' in seen.selection!);

  // Words only the listing claims find nothing.
  assert.deepEqual(await search(arkiv, chain, ['lend'], 11155111), []);
});

test('a search with no usable words asks Arkiv nothing', async () => {
  const arkiv = { select: () => assert.fail('queried Arkiv') } as unknown as ArkivReader;
  assert.deepEqual(await search(arkiv, fakeClient({}), ['to', 'the', '!!'], 11155111), []);
});
