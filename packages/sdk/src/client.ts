import type { PublicClient } from 'viem';

/** The parts of a viem PublicClient the SDK uses. Tests pass a fake with the same shape. */
export type ChainClient = Pick<
  PublicClient,
  | 'chain'
  | 'getBlockNumber'
  | 'getEnsText'
  | 'getEnsName'
  | 'getEnsAddress'
  | 'getCode'
  | 'getStorageAt'
  | 'readContract'
  | 'simulateCalls'
  | 'getTransactionReceipt'
>;
