import { readFileSync } from 'node:fs';
import { keccak256, toBytes, toFunctionSelector, type Address, type Hex } from 'viem';
import type { ChainClient } from '../dist/index.js';

/** An in-memory chain for tests: ENS records, contract code, reads and simulation. */
export interface FakeChain {
  chainId?: number;
  texts?: Record<string, Record<string, string>>;
  code?: Record<string, Hex>;
  /** Storage by lowercase address, then slot. Unset slots read as zero. */
  storage?: Record<string, Record<string, Hex>>;
  primaryNames?: Record<string, string>;
  addresses?: Record<string, Address>;
  read?: (functionName: string, args: readonly unknown[], address: Address) => unknown;
  simulate?: (calls: { to: Address; data: Hex }[]) => unknown;
}

export function fakeClient(chain: FakeChain): ChainClient {
  return {
    chain: { id: chain.chainId ?? 11155111 },
    getBlockNumber: async () => 100n,
    getEnsText: async ({ name, key }: { name: string; key: string }) => chain.texts?.[name]?.[key] ?? null,
    getEnsName: async ({ address }: { address: Address }) => chain.primaryNames?.[address.toLowerCase()] ?? null,
    getEnsAddress: async ({ name }: { name: string }) => chain.addresses?.[name] ?? null,
    getCode: async ({ address }: { address: Address }) => chain.code?.[address.toLowerCase()],
    getStorageAt: async ({ address, slot }: { address: Address; slot: Hex }) =>
      chain.storage?.[address.toLowerCase()]?.[slot] ?? `0x${'0'.repeat(64)}`,
    readContract: async ({ functionName, args, address }: { functionName: string; args?: unknown[]; address: Address }) =>
      chain.read!(functionName, args ?? [], address),
    simulateCalls: async ({ calls }: { calls: { to: Address; data: Hex }[] }) => chain.simulate!(calls),
  } as unknown as ChainClient;
}

/** Bytecode containing the selectors of these signatures, enough for discovery's function checks. */
export const codeWith = (...signatures: string[]): Hex =>
  `0x6080${signatures.map((s) => toFunctionSelector(s).slice(2)).join('')}`;

/** ENS text records for a published manifest, with a matching digest. */
export function published(manifest: unknown): Record<string, string> {
  const text = JSON.stringify(manifest);
  return { 'org.web3mcp.manifest': text, 'org.web3mcp.digest': keccak256(toBytes(text)) };
}

export const vaultManifest = JSON.parse(
  readFileSync(new URL('../../../spec/fixtures/valid/vault.web3mcp-demo.eth.json', import.meta.url), 'utf8'),
);
export const VAULT = '0x0000000000000000000000000000000000000001';
export const USDC = '0x0000000000000000000000000000000000000002';

/** The vault fixture published on ENS, with its contracts deployed and the vault owner-verified. */
export function vaultChain(overrides: FakeChain = {}): FakeChain {
  return {
    texts: { 'vault.web3mcp-demo.eth': published(vaultManifest) },
    code: {
      [VAULT]: codeWith('function balanceOf(address)', 'function deposit(uint256)', 'function withdraw(uint256)'),
      [USDC]: codeWith('function approve(address,uint256)', 'function decimals()'),
    },
    primaryNames: { [VAULT]: 'vault.web3mcp-demo.eth' },
    ...overrides,
  };
}
