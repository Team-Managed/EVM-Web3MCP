import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { decodeFunctionData, keccak256, namehash, parseAbi, toBytes } from 'viem';
import { validateManifest } from '@web3mcp/evm';
import { dnsEncode, manifestRecords, publishCalldata } from '../dist/records.js';

const abi = parseAbi([
  'function multicall(bytes[] data) returns (bytes[])',
  'function setText(bytes32 node, string key, string value)',
  'function setText(bytes name, string key, string value)',
]);
const manifest = { web3mcp: '0.1-evm', name: 'agentswap.web3mcp.eth' };

test('the digest is keccak256 of the exact record bytes', () => {
  const { value, digest } = manifestRecords(manifest);
  assert.equal(value, JSON.stringify(manifest));
  assert.equal(digest, keccak256(toBytes(value)));
});

test('names are DNS-encoded the way ENSv2 resolvers take them', () => {
  // The name argument of the setText calls that published agentswap.web3mcp.eth on Sepolia.
  assert.equal(dnsEncode('agentswap.web3mcp.eth'), '0x096167656e747377617007776562336d63700365746800');
});

for (const version of ['v1', 'v2'] as const) {
  test(`one ${version} multicall sets the manifest and its digest`, () => {
    const records = manifestRecords(manifest);
    const outer = decodeFunctionData({ abi, data: publishCalldata(manifest.name, records, version) });
    assert.equal(outer.functionName, 'multicall');
    const inner = (outer.args[0] as `0x${string}`[]).map((data) => decodeFunctionData({ abi, data }).args);
    const name = version === 'v1' ? namehash(manifest.name) : dnsEncode(manifest.name);
    assert.deepEqual(inner, [
      [name, 'org.web3mcp.manifest', records.value],
      [name, 'org.web3mcp.digest', records.digest],
    ]);
  });
}

test("the builder skill's example manifest is valid", () => {
  const guide = readFileSync(new URL('../../../plugins/claude-code/skills/web3mcp-build/references/manifest.md', import.meta.url), 'utf8');
  const example = /```json\n([\s\S]*?)\n```/.exec(guide)?.[1];
  assert.ok(example, 'no JSON example in the guide');
  assert.equal(validateManifest(JSON.parse(example)).name, 'vault.myprotocol.eth');
});
