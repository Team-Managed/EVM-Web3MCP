import { test } from 'node:test';
import assert from 'node:assert/strict';
import { keccak256, toBytes } from 'viem';
import { discover, DiscoveryError } from '../dist/index.js';
import { codeWith, fakeClient, published, USDC, VAULT, vaultChain, vaultManifest } from './fake-chain.ts';

test('discovers a published protocol and sets trust per contract', async () => {
  const protocol = await discover(fakeClient(vaultChain()), 'vault.web3mcp-demo.eth');
  assert.equal(protocol.contracts.vault.trust, 'owner-verified');
  assert.equal(protocol.contracts.usdc.trust, 'name-only');
  assert.equal(protocol.manifest.tools.length, 3);
});

test('a subname of the publishing name owner-verifies a contract; a lookalike does not', async () => {
  const chain = vaultChain();
  chain.primaryNames![USDC] = 'usdc.vault.web3mcp-demo.eth';
  chain.primaryNames![VAULT] = 'notvault.web3mcp-demo.eth';
  const protocol = await discover(fakeClient(chain), 'vault.web3mcp-demo.eth');
  assert.equal(protocol.contracts.usdc.trust, 'owner-verified');
  assert.equal(protocol.contracts.vault.trust, 'name-only');
});

test('rejects a manifest that does not match its digest', async () => {
  const records = published(vaultManifest);
  records['org.web3mcp.digest'] = published({ other: true })['org.web3mcp.digest'];
  const client = fakeClient(vaultChain({ texts: { 'vault.web3mcp-demo.eth': records } }));
  await assert.rejects(discover(client, 'vault.web3mcp-demo.eth'), DiscoveryError);
});

test('rejects a name with no manifest', async () => {
  await assert.rejects(discover(fakeClient(vaultChain()), 'nobody.eth'), /has no Web3MCP manifest/);
});

test('rejects a contract that lacks a declared function', async () => {
  const chain = vaultChain();
  chain.code![VAULT] = codeWith('function balanceOf(address)', 'function deposit(uint256)');
  await assert.rejects(discover(fakeClient(chain), 'vault.web3mcp-demo.eth'), /no function with selector/);
});

test("finds a proxy's functions in its implementation", async () => {
  const implementation = '0x00000000000000000000000000000000000000f1';
  const chain = vaultChain();
  chain.code![USDC] = codeWith('function upgradeTo(address)');
  chain.code![implementation] = codeWith('function approve(address,uint256)', 'function decimals()');
  // OpenZeppelin's older proxy slot, the one Circle's USDC uses.
  const slot = keccak256(toBytes('org.zeppelinos.proxy.implementation'));
  chain.storage = { [USDC]: { [slot]: `0x${implementation.slice(2).padStart(64, '0')}` } };
  const protocol = await discover(fakeClient(chain), 'vault.web3mcp-demo.eth');
  assert.equal(protocol.contracts.usdc.trust, 'name-only');
});

test('an EIP-1167 minimal proxy is followed to its implementation', async () => {
  const implementation = '00000000000000000000000000000000000000f2';
  const chain = vaultChain();
  chain.code![USDC] = `0x363d3d373d3d3d363d73${implementation}5af43d82803e903d91602b57fd5bf3`;
  chain.code![`0x${implementation}`] = codeWith('function approve(address,uint256)', 'function decimals()');
  await discover(fakeClient(chain), 'vault.web3mcp-demo.eth');
});

test('rejects an address with no contract', async () => {
  const chain = vaultChain();
  delete chain.code![USDC];
  await assert.rejects(discover(fakeClient(chain), 'vault.web3mcp-demo.eth'), /no contract/);
});

test('rejects a manifest for another chain', async () => {
  await assert.rejects(discover(fakeClient(vaultChain({ chainId: 1 })), 'vault.web3mcp-demo.eth'), /chain 11155111/);
});
