import { getAddress, keccak256, parseAbiItem, toBytes, toFunctionSelector, type AbiFunction, type Address, type Hex } from 'viem';
import { normalize } from 'viem/ens';
import type { ChainClient } from './client.js';
import { validateManifest, type Manifest } from './manifest.js';

export const MANIFEST_KEY = 'org.web3mcp.manifest';
export const DIGEST_KEY = 'org.web3mcp.digest';
// Where common proxies keep their implementation address: EIP-1967, OpenZeppelin's older slot (used by Circle's USDC), EIP-1822.
const IMPLEMENTATION_SLOTS: Hex[] = [
  '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc',
  keccak256(toBytes('org.zeppelinos.proxy.implementation')),
  keccak256(toBytes('PROXIABLE')),
];
// EIP-1167 minimal proxies carry the implementation address inside their code.
const MINIMAL_PROXY = /^0x363d3d373d3d3d363d73([0-9a-f]{40})5af43d82803e903d91602b57fd5bf3$/;

/** owner-verified: the contract's primary name is the publishing name or a subname of it. name-only: only the name vouches for it. */
export type Trust = 'owner-verified' | 'name-only';

export interface ContractInfo {
  address: Address;
  trust: Trust;
  /** Hash of the deployed code (and proxy implementation), re-checked before every write. */
  fingerprint: Hex;
}

export interface Protocol {
  name: string;
  manifest: Manifest;
  contracts: Record<string, ContractInfo>;
}

export class DiscoveryError extends Error {
  override name = 'DiscoveryError';
}

/** Read a protocol's manifest from its ENS text records, then check its contracts on chain. */
export async function discover(client: ChainClient, name: string): Promise<Protocol> {
  const ensName = normalize(name);
  const [text, digest] = await Promise.all([
    client.getEnsText({ name: ensName, key: MANIFEST_KEY }),
    client.getEnsText({ name: ensName, key: DIGEST_KEY }),
  ]);
  if (!text) throw new DiscoveryError(`${ensName} has no Web3MCP manifest in its ${MANIFEST_KEY} record.`);
  if (digest?.toLowerCase() !== keccak256(toBytes(text))) {
    throw new DiscoveryError(`${ensName}: the manifest doesn't match its ${DIGEST_KEY} record.`);
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new DiscoveryError(`${ensName}: the manifest record isn't valid JSON.`);
  }
  return verifyManifest(client, validateManifest(json), ensName);
}

/** Check a validated manifest against the chain: contracts exist, declared functions exist, trust per contract. */
export async function verifyManifest(client: ChainClient, manifest: Manifest, name: string): Promise<Protocol> {
  const ensName = normalize(name);
  if (manifest.name !== ensName) throw new DiscoveryError(`The manifest is for ${manifest.name}, not ${ensName}.`);
  if (client.chain && client.chain.id !== manifest.chainId) {
    throw new DiscoveryError(`${ensName} is on chain ${manifest.chainId}, but this host is connected to chain ${client.chain.id}.`);
  }

  const needed = selectorsByContract(manifest);
  const contracts: Record<string, ContractInfo> = {};
  await Promise.all(
    Object.entries(manifest.contracts).map(async ([alias, raw]) => {
      const address = getAddress(raw.toLowerCase());
      const { code, fingerprint } = await readCode(client, address);
      if (!code) throw new DiscoveryError(`${alias}: there is no contract at ${address}.`);
      for (const selector of needed.get(alias) ?? []) {
        if (!code.includes(selector.slice(2))) {
          throw new DiscoveryError(`${alias}: ${address} has no function with selector ${selector} that the manifest declares.`);
        }
      }
      // ENS only returns a primary name whose address record points back to this contract, so a protocol
      // with several contracts verifies the extra ones through subnames, such as quoter.uniswap.eth.
      const primary = await client.getEnsName({ address }).catch(() => null);
      const ownerVerified = primary === ensName || !!primary?.endsWith(`.${ensName}`);
      contracts[alias] = { address, trust: ownerVerified ? 'owner-verified' : 'name-only', fingerprint };
    }),
  );
  return { name: ensName, manifest, contracts };
}

/** Throw if any contract's code changed since discovery, such as a proxy upgrade. */
export async function assertUnchanged(client: ChainClient, protocol: Protocol): Promise<void> {
  await Promise.all(
    Object.entries(protocol.contracts).map(async ([alias, info]) => {
      const { fingerprint } = await readCode(client, info.address);
      if (fingerprint !== info.fingerprint) {
        throw new DiscoveryError(`${alias} at ${info.address} changed since discovery. Run discover again and re-review.`);
      }
    }),
  );
}

// Lowercase hex of the contract's code plus its proxy implementation's code, so selector checks see both.
export async function readCode(client: ChainClient, address: Address): Promise<{ code: string | undefined; fingerprint: Hex }> {
  const code = (await client.getCode({ address }))?.toLowerCase();
  if (!code || code === '0x') return { code: undefined, fingerprint: '0x' };
  const implementation = await implementationOf(client, address, code);
  const implCode = implementation ? ((await client.getCode({ address: implementation })) ?? '0x').toLowerCase() : '0x';
  const all = `${code}${implCode.slice(2)}` as Hex;
  return { code: all, fingerprint: keccak256(all) };
}

async function implementationOf(client: ChainClient, address: Address, code: string): Promise<Address | undefined> {
  const minimal = MINIMAL_PROXY.exec(code);
  if (minimal) return getAddress(`0x${minimal[1]}`);
  const slots = await Promise.all(IMPLEMENTATION_SLOTS.map((slot) => client.getStorageAt({ address, slot })));
  const value = slots.find((s) => s && BigInt(s) !== 0n);
  return value ? getAddress(`0x${value.slice(-40)}`) : undefined;
}

function selectorsByContract(manifest: Manifest): Map<string, Set<Hex>> {
  const needed = new Map<string, Set<Hex>>();
  const add = (alias: string, signature: string) => {
    const set = needed.get(alias) ?? new Set<Hex>();
    set.add(toFunctionSelector(parseAbiItem(signature) as AbiFunction));
    needed.set(alias, set);
  };
  for (const tool of manifest.tools) {
    if (tool.kind === 'read') {
      add(tool.call.contract, tool.call.function);
      if (tool.output?.decimalsFrom) add(tool.output.decimalsFrom, 'function decimals() view returns (uint8)');
      continue;
    }
    for (const step of tool.steps) {
      if ('call' in step) add(step.call.contract, step.call.function);
      else add(step.approve.token, 'function approve(address spender, uint256 amount) returns (bool)');
    }
  }
  return needed;
}
