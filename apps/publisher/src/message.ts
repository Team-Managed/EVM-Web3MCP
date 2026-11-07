import { BaseError } from 'viem';

/** viem's short message leaves out the RPC URL, which can carry an API key. */
export const messageOf = (e: unknown) => (e instanceof BaseError ? e.shortMessage : e instanceof Error ? e.message : String(e));
