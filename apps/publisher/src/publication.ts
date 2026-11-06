import {
  getAddress, isAddress, keccak256, namehash, parseAbi, toBytes, toFunctionSelector,
  type Address, type Hex, type PublicClient,
} from 'viem';
import { normalize } from 'viem/ens';
import { assertUnchanged, validateManifest, verifyManifest, type PreparedWrite, type Protocol } from '@web3mcp/evm';
import { publicationPlan } from './prepare.js';
import { simulatePublication, type SimulationClient } from './simulation.js';

export type PublicationClient = SimulationClient & Pick<PublicClient, 'getChainId' | 'getCode' | 'getStorageAt' |
  'readContract' | 'getEnsResolver' | 'getEnsText' | 'getEnsName' | 'getTransaction' | 'getTransactionReceipt'>;
export interface PublicationOptions {
  account: Address;
  root: Address;
  resolver: Address;
  owner: Address;
  /** Independently reviewed token address, mandatory for the GiftBox manifest. */
  usdc?: Address;
}
const abi = parseAbi([
  'function getSubregistry(string) view returns(address)', 'function getResolver(string) view returns(address)',
  'function findOwner(string) view returns(address)', 'function supportsInterface(bytes4) view returns(bool)',
  'function hasRoles(uint256,uint256,address) view returns(bool)', 'function hasRootRoles(uint256,address) view returns(bool)',
  'function root() view returns(address)', 'function usdc() view returns(address)', 'function decimals() view returns(uint8)',
  'function text(bytes32,string) view returns(string)',
]);
const implementationSlot = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc' as const;
const same = (a: string | null | undefined, b: string) => a?.toLowerCase() === b.toLowerCase();
const nonzero = (a: string | null | undefined): a is Address => !!a && isAddress(a) && BigInt(a) !== 0n;
async function code(client: PublicationClient, address: Address) {
  const value = await client.getCode({ address });
  if (!value || value === '0x') throw new Error(`Missing deployed bytecode at ${address}.`);
  return value;
}

/** Snapshot code and EIP-1967/minimal-proxy dependencies, including the resolver's upgrade slot. */
async function fingerprint(client: PublicationClient, address: Address, depth = 0): Promise<Hex> {
  if (depth > 4) throw new Error('Unsupported proxy depth.');
  const bytecode = await code(client, address);
  const slot = await client.getStorageAt({ address, slot: implementationSlot }) ?? `0x${'0'.repeat(64)}`;
  const minimal = /^0x363d3d373d3d3d363d73([0-9a-fA-F]{40})5af43d82803e903d91602b57fd5bf3/.exec(bytecode);
  let material = `${bytecode}${slot.slice(2)}`;
  if (BigInt(slot)) material += (await fingerprint(client, getAddress(`0x${slot.slice(-40)}`), depth + 1)).slice(2);
  if (minimal) material += (await fingerprint(client, getAddress(`0x${minimal[1]}`), depth + 1)).slice(2);
  return keccak256(material as Hex);
}

async function authority(client: PublicationClient, name: string, options: PublicationOptions) {
  const read = (address: Address, functionName: string, args: readonly unknown[]) =>
    client.readContract({ address, abi, functionName, args } as Parameters<PublicationClient['readContract']>[0]);
  let registry = options.root;
  let currentOwner: Address | undefined;
  let ownerName = '';
  let resolver: Address | undefined;
  const labels = name.split('.').reverse();
  if (labels[0] !== 'eth') throw new Error('Only .eth publication is supported.');
  const visited: Address[] = [];
  for (let i = 0; i < labels.length; ++i) {
    await code(client, registry);
    visited.push(registry);
    const owner = await read(registry, 'findOwner', [labels[i]]) as Address;
    if (i === 1 && !nonzero(owner)) throw new Error('Publishing .eth name is unregistered or expired.');
    const found = await read(registry, 'getResolver', [labels[i]]) as Address;
    if (nonzero(owner)) { currentOwner = owner; ownerName = labels.slice(0, i + 1).reverse().join('.'); }
    if (nonzero(found)) resolver = found;
    if (i === labels.length - 1) break;
    const next = await read(registry, 'getSubregistry', [labels[i]]) as Address;
    if (!nonzero(next)) {
      if (i === 0) throw new Error('Root has no .eth subregistry.');
      break; // Explicit nearest-owner / wildcard-resolver case, reported for review.
    }
    registry = next;
  }
  if (!currentOwner || !same(currentOwner, options.owner)) throw new Error('Current name/ancestor owner does not match expected owner.');
  const resolved = await client.getEnsResolver({ name });
  if (!same(resolver, options.resolver) || !same(resolved, options.resolver)) throw new Error('ENS hierarchy/resolver does not match the expected target.');
  await code(client, options.resolver);
  for (const [id, expected] of [['0x01ffc9a7', true], ['0xffffffff', false],
    [toFunctionSelector('setText(bytes,string,string)'), true], [toFunctionSelector('text(bytes32,string)'), true]] as const) {
    if (await read(options.resolver, 'supportsInterface', [id]) !== expected) throw new Error('Unsupported resolver interface. DNS-name setText is required.');
  }
  for (const key of ['org.web3mcp.manifest', 'org.web3mcp.digest']) {
    const allowed = await read(options.resolver, 'hasRootRoles', [16n, options.account]) === true ||
      await read(options.resolver, 'hasRoles', [BigInt(keccak256(toBytes(key))), 16n, options.account]) === true;
    if (!allowed) throw new Error(`Signer lacks resolver permission for ${key}.`);
  }
  return { currentOwner, ownerName, registries: visited };
}

export interface Publication {
  plan: ReturnType<typeof publicationPlan>;
  options: PublicationOptions;
  protocol: Protocol;
  prepared: PreparedWrite;
  ownerName: string;
  snapshots: Record<string, Hex>;
}

/** All calls here are reads or simulation. Never creates a signing request. */
export async function preparePublication(client: PublicationClient, json: unknown, options: PublicationOptions): Promise<Publication> {
  const manifest = validateManifest(json);
  for (const a of [options.account, options.root, options.resolver, options.owner, ...(options.usdc ? [options.usdc] : [])]) {
    if (!isAddress(a) || BigInt(a) <= 0xffffn) throw new Error('Expected reviewed nonzero production addresses, never fixture addresses.');
  }
  if (normalize(manifest.name) !== manifest.name) throw new Error('Publishing name must be canonical.');
  if (manifest.chainId !== 11155111 || await client.getChainId() !== manifest.chainId) throw new Error('Wrong chain: Sepolia is required.');
  const plan = publicationPlan(manifest, options.resolver);
  const chainClient = { ...client, chain: { id: manifest.chainId } } as unknown as Parameters<typeof verifyManifest>[0];
  const protocol = await verifyManifest(chainClient, manifest, manifest.name);
  if ('giftbox' in manifest.contracts || manifest.name === 'gifts.web3mcp.eth') {
    if (!options.usdc || !same(manifest.contracts.usdc, options.usdc) || !manifest.contracts.giftbox) throw new Error('GiftBox needs a reviewed USDC address matching the manifest.');
    const address = manifest.contracts.giftbox as Address;
    const root = await client.readContract({ address, abi, functionName: 'root' });
    const token = await client.readContract({ address, abi, functionName: 'usdc' });
    if (!same(root, options.root) || !same(token, options.usdc)) throw new Error('GiftBox immutable root/usdc mismatch.');
    if (await client.readContract({ address: options.usdc, abi, functionName: 'decimals' }) !== 6) throw new Error('GiftBox requires a six-decimal USDC token.');
  }
  const auth = await authority(client, manifest.name, options);
  const watched = [...new Set([...Object.values(manifest.contracts), options.resolver, ...auth.registries])];
  const snapshots: Record<string, Hex> = {};
  for (const address of watched) snapshots[address] = await fingerprint(client, address as Address);
  const calls = plan.calls.map((c, i) => ({ to: c.to as Address, data: c.data, value: 0n,
    description: `Publish ${plan.records[i].key} for ${manifest.name}`, kind: 'call' as const,
    contract: 'resolver', method: 'setText', args: [
      { name: 'name', value: manifest.name }, { name: 'key', value: plan.records[i].key }, { name: 'value', value: plan.records[i].value },
    ] }));
  const simulation = await simulatePublication(client, options.account, calls);
  return { plan, options: { ...options }, protocol, ownerName: auth.ownerName, snapshots,
    prepared: { protocol: manifest.name, tool: 'publish_manifest', account: options.account,
      calls: calls.map((call, i) => ({ ...call, gas: simulation.gas[i] })), assetChanges: [] } };
}

/** Revalidate immediately before every wallet submission; any drift fails closed. */
export async function revalidatePublication(client: PublicationClient, original: Publication) {
  const fresh = await preparePublication(client, original.protocol.manifest, original.options);
  if (JSON.stringify(fresh.plan) !== JSON.stringify(original.plan) || JSON.stringify(fresh.snapshots) !== JSON.stringify(original.snapshots) || fresh.ownerName !== original.ownerName) {
    throw new Error('Publication target/ownership/code changed; prepare a new request after review.');
  }
  // Recheck the previously reviewed gas limits, not just newly estimated ones.
  await simulatePublication(client, original.options.account, original.prepared.calls);
  await assertUnchanged({ ...client, chain: { id: original.plan.chainId } } as unknown as Parameters<typeof assertUnchanged>[0], original.protocol);
}

export interface PublicationOutcome { status: 'pending' | 'rejected' | 'failed' | 'submitted'; hashes: readonly Hex[]; }
/** Independently bind each hash to signer, calldata and target, then verify both record bytes. */
export async function verifyPublication(client: PublicationClient, p: Publication, outcome: PublicationOutcome) {
  if (await client.getChainId() !== p.plan.chainId) throw new Error('Receipt RPC chain changed.');
  if (outcome.hashes.length > p.prepared.calls.length || new Set(outcome.hashes).size !== outcome.hashes.length) throw new Error('Unexpected transaction hash count or duplicates.');
  if (outcome.status === 'rejected' && outcome.hashes.length === 0) return { status: 'rejected', hashes: [] };
  const steps: { hash: Hex; status: string }[] = [];
  for (const [i, hash] of outcome.hashes.entries()) {
    const tx = await client.getTransaction({ hash });
    const expected = p.prepared.calls[i];
    if (tx.hash !== hash || !same(tx.from, p.options.account) || !same(tx.to, p.options.resolver) || tx.input !== expected.data || tx.value !== 0n || (tx.chainId !== undefined && tx.chainId !== p.plan.chainId)) throw new Error('Reported transaction does not match the approved publication.');
    const receipt = await client.getTransactionReceipt({ hash }).catch(() => undefined);
    if (receipt && receipt.transactionHash !== hash) throw new Error('Receipt hash does not match the publication.');
    steps.push({ hash, status: receipt?.status ?? 'unverified' });
  }
  if (steps.length !== p.prepared.calls.length || steps.some(s => s.status !== 'success')) {
    return { status: steps.some(s => s.status === 'success') ? 'partial' : steps.some(s => s.status === 'reverted') || outcome.status === 'failed' ? 'failed' : outcome.status === 'pending' ? 'pending' : 'unconfirmed', steps };
  }
  for (const record of p.plan.records) {
    const direct = await client.readContract({ address: p.options.resolver, abi, functionName: 'text', args: [namehash(p.plan.name), record.key] });
    const resolved = await client.getEnsText({ name: p.plan.name, key: record.key });
    if (direct !== record.value || resolved !== record.value) throw new Error('Record read-back mismatch; publication is not verified.');
  }
  const auth = await authority(client, p.plan.name, p.options);
  if (auth.ownerName !== p.ownerName) throw new Error('Ownership scope changed after publication.');
  return { status: 'confirmed', steps, digest: p.plan.digest, recordsVerified: true };
}
