import { toHex, type Address, type Hex, type PublicClient } from 'viem';

export type SimulationClient = Pick<PublicClient, 'getBlockNumber' | 'getTransactionCount' | 'estimateFeesPerGas' | 'getBalance' | 'request'>;
export const TRANSACTION_GAS_CAP = 16_777_216n;
type Call = { to: Address; data: Hex; value?: bigint; gas?: bigint };

/** Simulate only the actual writes: no simulateCalls sentinel or asset probes. */
export async function simulatePublication(client: SimulationClient, account: Address, calls: readonly Call[]) {
  if (calls.length !== 2) throw new Error('Publication requires exactly two record writes.');
  const blockNumber = await client.getBlockNumber({ cacheTime: 0 });
  const [nonce, fees, balance] = await Promise.all([
    client.getTransactionCount({ address: account, blockNumber }),
    client.estimateFeesPerGas({ type: 'eip1559', chain: undefined }),
    client.getBalance({ address: account, blockNumber }),
  ]);
  const { maxFeePerGas, maxPriorityFeePerGas } = fees;
  if (maxFeePerGas === undefined || maxPriorityFeePerGas === undefined || maxFeePerGas <= 0n ||
      maxPriorityFeePerGas < 0n || maxPriorityFeePerGas > maxFeePerGas) throw new Error('Invalid publication fee estimate.');
  const initialGas = calls.map(c => c.gas ?? TRANSACTION_GAS_CAP);
  if (initialGas.some(gas => gas < 21_000n || gas > TRANSACTION_GAS_CAP)) throw new Error('Publication gas limit exceeds transaction bounds.');
  const maximumCost = initialGas.reduce((sum, gas, i) => sum + gas * maxFeePerGas + (calls[i].value ?? 0n), 0n);
  if (balance < maximumCost) throw new Error('Signer cannot fund the publication gas budget.');

  const run = async (gasLimits: readonly bigint[]) => {
    const transactions = calls.map((call, i) => ({ from: account, to: call.to, data: call.data,
      value: toHex(call.value ?? 0n), nonce: toHex(nonce + i), gas: toHex(gasLimits[i]),
      maxFeePerGas: toHex(maxFeePerGas), maxPriorityFeePerGas: toHex(maxPriorityFeePerGas) }));
    const result = await client.request({ method: 'eth_simulateV1', params: [
      { validation: true, blockStateCalls: [{ calls: transactions }] }, toHex(blockNumber),
    ] }) as unknown as { calls: { status?: string; gasUsed?: Hex }[] }[];
    if (result.length !== 1 || result[0].calls?.length !== calls.length || result[0].calls.some(c => c.status !== '0x1' || !c.gasUsed || !/^0x[0-9a-f]+$/i.test(c.gasUsed))) {
      throw new Error('Publication simulation failed. No approval request created.');
    }
    const used = result[0].calls.map(c => BigInt(c.gasUsed!));
    if (used.some((gas, i) => gas <= 0n || gas > gasLimits[i])) throw new Error('Invalid simulated gas usage.');
    return used;
  };
  const used = await run(initialGas);
  // Nodes can report less than 21k for an empty simulated call. Keep conservative
  // wallet limits and verify them with a second validated simulation.
  const gas = used.map((value, i) => {
    const margin = (value * 120n + 99n) / 100n;
    return calls[i].gas ?? (margin < 21_000n ? 21_000n : margin);
  });
  if (gas.some(value => value > TRANSACTION_GAS_CAP)) throw new Error('Publication needs more gas than the cap permits with a 20% margin.');
  // Confirm the exact limits suggested to the wallet also execute successfully.
  await run(gas);
  return { gas, blockNumber, maxFeePerGas, maxPriorityFeePerGas };
}
