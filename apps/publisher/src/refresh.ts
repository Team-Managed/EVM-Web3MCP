import type { CreateEntityParameters, Expiry } from '@arkiv-network/sdk';
import type { Hex } from 'viem';

/**
 * The one batch that refreshes a publisher's listing of a name, given the listings its wallet owns:
 * extend the one for the current digest, or write `create` if there is none, and delete every other.
 */
export function refreshBatch(owned: readonly { $key: Hex; digest?: unknown }[], digest: Hex, create: CreateEntityParameters, expiration: Expiry) {
  const current = owned.find((e) => (e.digest as { value?: unknown } | undefined)?.value === digest)?.$key;
  const creates: CreateEntityParameters[] = current ? [] : [create];
  return {
    current,
    batch: {
      deletes: owned.filter((e) => e.$key !== current).map((e) => ({ entityKey: e.$key })),
      extensions: current ? [{ entityKey: current, expiration }] : [],
      creates,
    },
  };
}
