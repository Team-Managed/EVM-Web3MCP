import { readFile } from 'node:fs/promises';
import {
  concatHex, encodeDeployData, getCreate2Address, keccak256, parseAbi, toHex,
  type Abi, type Address, type Hex, type PublicClient,
} from 'viem';
import type { PreparedWrite } from '@web3mcp/evm';
import { TRANSACTION_GAS_CAP } from './simulation.js';

export const DEPLOYMENT = {
  chainId: 11155111,
  factory: '0x4e59b44847b379578588920cA78FbF26c0B4956C',
  usdc: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  root: '0xB458D6a3a77919449d03e7A6903C26827c1eC43f',
  ethRegistry: '0xD4eBcbBdF463C9c45784603Db0dDD499BC44A8B4',
  // web3mcp.eth's owner deploys and owns GiftBox, so it can give GiftBox its primary name.
  account: '0x99230d725DaEFb3571917661755feBB309822ECb',
  salt: '0x8b4f7a949cac977df2f05b69a4c486d645a30e57166d88d616bc8545d12c653d',
  address: '0xdcF1c9809aA58C7C390753E43dE25Dd064F7eda8',
  initCodeHash: '0x0699dce7a9dd22adb2611a4a916e1dcc3ee7426f48c2a3e94e62d2d340f434cc',
  factoryHash: '0x2fa86add0aed31f33a762c9d88e807c475bd51d0f52bd0955754b2608f7e4989',
} as const;
interface Artifact {
  abi: Abi;
  bytecode: { object: Hex };
  deployedBytecode: { object: Hex; immutableReferences: Record<string, { start: number; length: number }[]> };
  metadata: string | { compiler: { version: string }; settings: { optimizer: { enabled: boolean; runs: number }; viaIR: boolean; evmVersion: string }; sources: Record<string, { keccak256: Hex }> };
}
export type DeploymentClient = Pick<PublicClient, 'getChainId' | 'getCode' | 'readContract' | 'getBalance' |
  'estimateFeesPerGas' | 'estimateGas' | 'getBlockNumber' | 'getTransactionCount' | 'request' | 'getTransaction' | 'getTransactionReceipt'>;
const abi = parseAbi([
  'function getSubregistry(string) view returns(address)', 'function decimals() view returns(uint8)',
  'function paused() view returns(bool)', 'function isBlacklisted(address) view returns(bool)',
  'function root() view returns(address)', 'function usdc() view returns(address)', 'function owner() view returns(address)',
]);
const same = (a: string | undefined | null, b: string) => a?.toLowerCase() === b.toLowerCase();

export function deriveDeployment(bytecode: Hex, contractAbi: Abi) {
  const initCode = encodeDeployData({ abi: contractAbi, bytecode, args: [DEPLOYMENT.account, DEPLOYMENT.usdc, DEPLOYMENT.root] });
  return { data: concatHex([DEPLOYMENT.salt, initCode]), initCodeHash: keccak256(initCode),
    address: getCreate2Address({ from: DEPLOYMENT.factory, salt: DEPLOYMENT.salt, bytecode: initCode }) };
}

export function assertReviewedDeployment(plan: ReturnType<typeof deriveDeployment>) {
  if (plan.initCodeHash !== DEPLOYMENT.initCodeHash || !same(plan.address, DEPLOYMENT.address)) {
    throw new Error('Artifact differs from the reviewed deployment. Stop and review a new hash/address.');
  }
}

export async function loadReviewedArtifact() {
  const artifact = JSON.parse(await readFile(new URL('../../../contracts/out/GiftBox.sol/GiftBox.json', import.meta.url), 'utf8')) as Artifact;
  const metadata = typeof artifact.metadata === 'string' ? JSON.parse(artifact.metadata) : artifact.metadata;
  if (metadata.compiler.version !== '0.8.28+commit.7893614a' || metadata.settings.optimizer.enabled !== true ||
      metadata.settings.optimizer.runs !== 200 || metadata.settings.viaIR !== true || metadata.settings.evmVersion !== 'cancun') {
    throw new Error('Unexpected GiftBox compiler settings.');
  }
  const source = await readFile(new URL('../../../contracts/src/GiftBox.sol', import.meta.url));
  if (keccak256(source) !== metadata.sources['src/GiftBox.sol'].keccak256) throw new Error('Artifact is stale relative to GiftBox.sol.');
  const plan = deriveDeployment(artifact.bytecode.object, artifact.abi);
  assertReviewedDeployment(plan);
  return { artifact, ...plan };
}

async function deployedCode(client: DeploymentClient, address: Address) {
  const value = await client.getCode({ address });
  if (!value || value === '0x') throw new Error(`Missing dependency bytecode at ${address}.`);
  return value;
}

/** Read-only preflight; never opens a page or sends a transaction. */
export async function prepareDeployment(client: DeploymentClient, reviewedGasLimit?: bigint) {
  const plan = await loadReviewedArtifact();
  if (await client.getChainId() !== DEPLOYMENT.chainId) throw new Error('Wrong chain; only Sepolia is permitted.');
  if (keccak256(await deployedCode(client, DEPLOYMENT.factory)) !== DEPLOYMENT.factoryHash) throw new Error('CREATE2 factory bytecode mismatch.');
  const occupied = await client.getCode({ address: plan.address });
  if (occupied && occupied !== '0x') throw new Error('Predicted address already has code. Verify it; never deploy again.');
  await deployedCode(client, DEPLOYMENT.root);
  await deployedCode(client, DEPLOYMENT.usdc);
  const registry = await client.readContract({ address: DEPLOYMENT.root, abi, functionName: 'getSubregistry', args: ['eth'] });
  if (!same(registry, DEPLOYMENT.ethRegistry)) throw new Error('ENS .eth subregistry changed from the reviewed dependency.');
  await deployedCode(client, registry);
  const decimals = await client.readContract({ address: DEPLOYMENT.usdc, abi, functionName: 'decimals' });
  const paused = await client.readContract({ address: DEPLOYMENT.usdc, abi, functionName: 'paused' });
  if (decimals !== 6 || paused) throw new Error('USDC is incompatible or paused.');
  for (const address of [DEPLOYMENT.account, plan.address]) {
    if (await client.readContract({ address: DEPLOYMENT.usdc, abi, functionName: 'isBlacklisted', args: [address] })) throw new Error('Deployment wallet or GiftBox address is blacklisted.');
  }
  const fees = await client.estimateFeesPerGas({ chain: undefined, type: 'eip1559' });
  const { maxFeePerGas, maxPriorityFeePerGas } = fees;
  if (maxFeePerGas === undefined || maxPriorityFeePerGas === undefined || maxFeePerGas <= 0n || maxPriorityFeePerGas > maxFeePerGas) throw new Error('Invalid fee estimate.');
  const estimate = await client.estimateGas({ account: DEPLOYMENT.account, to: DEPLOYMENT.factory, data: plan.data, value: 0n, maxFeePerGas, maxPriorityFeePerGas });
  const suggested = (estimate * 120n + 99n) / 100n;
  const gas = reviewedGasLimit ?? suggested;
  if (gas < suggested || gas >= TRANSACTION_GAS_CAP || gas <= 0n) throw new Error('Deployment exceeds the cap or reviewed gas margin. Prepare a new review.');
  const balance = await client.getBalance({ address: DEPLOYMENT.account });
  if (balance < gas * maxFeePerGas) throw new Error('Insufficient wallet balance for the gas budget.');
  // Two blocks back, like the SDK: load-balanced public RPCs answer "block not found" for the newest block.
  const blockNumber = (await client.getBlockNumber({ cacheTime: 0 })) - 2n;
  const nonce = await client.getTransactionCount({ address: DEPLOYMENT.account, blockNumber });
  const simulation = await client.request({ method: 'eth_simulateV1', params: [{ validation: true, blockStateCalls: [{ calls: [{
    from: DEPLOYMENT.account, to: DEPLOYMENT.factory, data: plan.data, value: '0x0', nonce: toHex(nonce), gas: toHex(gas),
    maxFeePerGas: toHex(maxFeePerGas), maxPriorityFeePerGas: toHex(maxPriorityFeePerGas),
  }] }] }, toHex(blockNumber)] }) as unknown as { calls: { status: string; returnData: Hex }[] }[];
  if (simulation.length !== 1 || simulation[0].calls.length !== 1 || simulation[0].calls[0].status !== '0x1' ||
      !same(simulation[0].calls[0].returnData, plan.address)) throw new Error('CREATE2 deployment simulation failed.');
  const prepared: PreparedWrite = { protocol: 'GiftBox deployment (not ENS-published)', tool: 'deploy_giftbox', account: DEPLOYMENT.account,
    calls: [{ to: DEPLOYMENT.factory, value: 0n, data: plan.data, gas,
      description: `Deploy GiftBox at ${plan.address} through the CREATE2 factory`, kind: 'call', contract: 'create2_factory',
      args: [{ name: 'owner', value: DEPLOYMENT.account }, { name: 'USDC', value: DEPLOYMENT.usdc }, { name: 'ENS root', value: DEPLOYMENT.root },
        { name: 'salt', value: DEPLOYMENT.salt }, { name: 'init-code hash', value: plan.initCodeHash }] }], assetChanges: [] };
  return { ...plan, estimate, gas, balance, maxFeePerGas, prepared };
}

/** Compare runtime with immutable slots masked, then check both actual getters. */
export function matchesRuntime(actual: Hex, artifact: Artifact): boolean {
  const expected = Buffer.from(artifact.deployedBytecode.object.slice(2), 'hex');
  const found = Buffer.from(actual.slice(2), 'hex');
  if (expected.length !== found.length) return false;
  const refs = Object.values(artifact.deployedBytecode.immutableReferences).flat();
  if (!refs.length) return false;
  for (const { start, length } of refs) {
    if (length !== 32 || start < 0 || start + length > expected.length) return false;
    expected.fill(0, start, start + length); found.fill(0, start, start + length);
  }
  return expected.equals(found);
}

export async function verifyDeployment(client: DeploymentClient, hash: Hex) {
  const plan = await loadReviewedArtifact();
  if (await client.getChainId() !== DEPLOYMENT.chainId) throw new Error('Wrong verification chain.');
  const [tx, receipt] = await Promise.all([client.getTransaction({ hash }), client.getTransactionReceipt({ hash })]);
  if (tx.hash !== hash || receipt.transactionHash !== hash || receipt.status !== 'success' ||
      !same(tx.from, DEPLOYMENT.account) || !same(tx.to, DEPLOYMENT.factory) || tx.input !== plan.data || tx.value !== 0n ||
      (tx.chainId !== undefined && tx.chainId !== DEPLOYMENT.chainId)) throw new Error('Receipt/transaction does not match the reviewed deployment.');
  const runtime = await deployedCode(client, plan.address);
  if (!matchesRuntime(runtime, plan.artifact)) throw new Error('Deployed runtime differs from the reviewed artifact.');
  const root = await client.readContract({ address: plan.address, abi, functionName: 'root' });
  const token = await client.readContract({ address: plan.address, abi, functionName: 'usdc' });
  const owner = await client.readContract({ address: plan.address, abi, functionName: 'owner' });
  if (!same(root, DEPLOYMENT.root) || !same(token, DEPLOYMENT.usdc) || !same(owner, DEPLOYMENT.account)) throw new Error('Deployed constructor getters mismatch.');
  return { status: 'confirmed', hash, address: plan.address, blockNumber: receipt.blockNumber.toString(),
    runtimeHash: keccak256(runtime), owner, usdc: token, root, gasUsed: receipt.gasUsed.toString() };
}
