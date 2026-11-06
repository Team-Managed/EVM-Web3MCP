import { normalize, packetToBytes } from 'viem/ens';
import { encodeFunctionData, isAddress, keccak256, parseAbi, toBytes, toHex, zeroAddress } from 'viem';
import { DIGEST_KEY, MANIFEST_KEY, validateManifest } from '@web3mcp/evm';

/** Records and calldata only. Caller must independently establish resolver authority. */
export function publicationPlan(json: unknown, resolver: string) {
  const manifest = validateManifest(json);
  if (normalize(manifest.name) !== manifest.name || manifest.name.split('.').some(label => toBytes(label).length > 255)) {
    throw new Error('Expected a canonical ENS name with directly encodable DNS labels.');
  }
  if (!isAddress(resolver) || resolver === zeroAddress) throw new Error('Expected a nonzero resolver address.');
  for (const address of [resolver, ...Object.values(manifest.contracts)]) {
    // Reserve low addresses for fixtures/precompiles, never production publication.
    if (BigInt(address) <= 0xffffn) throw new Error('Synthetic fixture/precompile addresses cannot be published.');
  }
  const text = JSON.stringify(manifest);
  const digest = keccak256(toBytes(text));
  const records = [{ key: MANIFEST_KEY, value: text }, { key: DIGEST_KEY, value: digest }];
  const abi = parseAbi(['function setText(bytes name,string key,string value)']);
  return {
    name: manifest.name, chainId: manifest.chainId, digest, records,
    calls: records.map(r => ({ to: resolver, value: '0', data: encodeFunctionData({ abi, functionName: 'setText', args: [toHex(packetToBytes(manifest.name)), r.key, r.value] }) })),
  };
}
