import { concat, encodeFunctionData, keccak256, namehash, parseAbi, stringToBytes, toBytes, toFunctionSelector, toHex, type Hex } from 'viem';
import { DIGEST_KEY, MANIFEST_KEY } from '@web3mcp/evm';

const setTextAbi = {
  // ENS v1's PublicResolver keys records by namehash.
  v1: parseAbi(['function setText(bytes32 node, string key, string value)']),
  // ENSv2's PermissionedResolver keys them by the DNS-encoded name.
  v2: parseAbi(['function setText(bytes name, string key, string value)']),
};
const multicallAbi = parseAbi(['function multicall(bytes[] data) returns (bytes[])']);

export type ResolverVersion = keyof typeof setTextAbi;

/** Selectors that tell the two resolvers apart in their code. */
export const SET_TEXT_SELECTORS = {
  v1: toFunctionSelector(setTextAbi.v1[0]),
  v2: toFunctionSelector(setTextAbi.v2[0]),
};

/** The two text records that publish a manifest: compact JSON, and keccak256 of exactly those bytes. */
export function manifestRecords(manifestJson: unknown): { value: string; digest: Hex } {
  const value = JSON.stringify(manifestJson);
  return { value, digest: keccak256(toBytes(value)) };
}

/** One resolver call that sets both records, so a host never reads a manifest without its matching digest. */
export function publishCalldata(name: string, records: { value: string; digest: Hex }, version: ResolverVersion): Hex {
  const set = (key: string, text: string) =>
    version === 'v1'
      ? encodeFunctionData({ abi: setTextAbi.v1, functionName: 'setText', args: [namehash(name), key, text] })
      : encodeFunctionData({ abi: setTextAbi.v2, functionName: 'setText', args: [dnsEncode(name), key, text] });
  return encodeFunctionData({ abi: multicallAbi, functionName: 'multicall', args: [[set(MANIFEST_KEY, records.value), set(DIGEST_KEY, records.digest)]] });
}

/** DNS wire format: each label prefixed by its length, then a zero byte. */
export function dnsEncode(name: string): Hex {
  const labels = name.split('.').map((label) => {
    const bytes = stringToBytes(label);
    if (bytes.length === 0 || bytes.length > 255) throw new Error(`Can't DNS-encode the label "${label}".`);
    return concat([new Uint8Array([bytes.length]), bytes]);
  });
  return toHex(concat([...labels, new Uint8Array([0])]));
}
