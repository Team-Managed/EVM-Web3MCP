import {
  BaseError,
  encodeFunctionData,
  erc20Abi,
  formatUnits,
  getAddress,
  isAddress,
  parseAbiItem,
  parseUnits,
  type AbiFunction,
  type AbiParameter,
  type Address,
  type Hex,
} from 'viem';
import { normalize } from 'viem/ens';
import { parseDateInput, formatDateInput } from './date.js';
import type { ChainClient } from './client.js';
import { assertUnchanged, type Protocol } from './discover.js';
import type { ToolDeclaration } from './manifest.js';

export type ToolInput = Record<string, unknown>;

export class ToolError extends Error {
  override name = 'ToolError';
}

export interface PreparedCall {
  to: Address;
  data: Hex;
  value?: bigint;
  /** Gas limit to suggest to the wallet, for calls near the per-transaction cap. */
  gas?: bigint;
  /** Readable form, such as `usdc.approve(vault, 10 USDC)`. */
  description: string;
  /** The same step in parts, for the signing page. */
  kind?: 'approve' | 'call';
  contract?: string;
  method?: string;
  args?: ShownArg[];
}

/** An argument as a person reads it: `10 USDC`, `web3mcp.eth` with its resolved address, `you`. */
export interface ShownArg {
  name: string;
  value: string;
  address?: Address;
}

export interface AssetChange {
  token: Address;
  symbol?: string;
  /** Signed, human-readable amount, such as "-10.5". */
  change: string;
}

export interface PreparedWrite {
  protocol: string;
  tool: string;
  account: Address;
  calls: PreparedCall[];
  assetChanges: AssetChange[];
}

/** An address, or an ENS name resolved to one. */
export async function resolveAddress(client: ChainClient, value: string): Promise<Address> {
  if (isAddress(value, { strict: false })) return getAddress(value.toLowerCase());
  const resolved = await client.getEnsAddress({ name: normalize(value) }).catch(() => null);
  if (!resolved) throw new ToolError(`${value} isn't an address and doesn't resolve as an ENS name.`);
  return resolved;
}

/** Run a read tool. Returns a formatted amount when the tool declares `output`, otherwise JSON-safe data. */
export async function executeRead(
  client: ChainClient,
  protocol: Protocol,
  toolName: string,
  input: ToolInput,
  account?: Address,
): Promise<unknown> {
  const tool = findTool(protocol, toolName, 'read');
  const ctx = new Bindings(client, protocol, tool, input, account);
  const fn = toFunction(tool.call.function);
  const args = await ctx.args(tool.call.args, fn.inputs);
  // An eth_call, so a dryRun function runs for real on the node but nothing is sent or saved.
  const result = await client.readContract({
    address: protocol.contracts[tool.call.contract].address,
    abi: [fn],
    functionName: fn.name,
    args,
  });
  if (tool.output && typeof result === 'bigint') {
    const decimals = tool.output.decimals ?? (await ctx.decimals(tool.output.decimalsFrom!));
    return `${formatUnits(result, decimals)}${tool.output.symbol ? ` ${tool.output.symbol}` : ''}`;
  }
  return jsonSafe(result);
}

/** Build a write tool's calls, skip approvals that already exist, and simulate them together. Never signs. */
export async function prepareWrite(
  client: ChainClient,
  protocol: Protocol,
  toolName: string,
  input: ToolInput,
  account: Address | undefined,
): Promise<PreparedWrite> {
  if (!account) throw new ToolError('Writes need your wallet address to simulate. Set WEB3MCP_ACCOUNT to an address or ENS name.');
  const tool = findTool(protocol, toolName, 'write');
  await assertUnchanged(client, protocol);

  const ctx = new Bindings(client, protocol, tool, input, account);
  // Public RPCs spread requests across nodes, and a node one block behind rejects the newest block number
  // ("block not found"). Reading and simulating two blocks back keeps every node in agreement.
  const blockNumber = (await client.getBlockNumber({ cacheTime: 0 })) - 2n;
  const calls: PreparedCall[] = [];
  for (const step of tool.steps) {
    if ('approve' in step) {
      const token = protocol.contracts[step.approve.token].address;
      const spender = protocol.contracts[step.approve.spender].address;
      const amount = (await ctx.bind(step.approve.amount, { type: 'uint256' })) as bigint;
      const allowance = await client.readContract({
        address: token,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [account, spender],
        blockNumber,
      });
      if (allowance >= amount) continue;
      const args = [
        { name: 'spender', value: step.approve.spender, address: spender },
        { name: 'amount', ...(await ctx.show(step.approve.amount, amount)) },
      ];
      calls.push({
        to: token,
        data: encodeFunctionData({ abi: erc20Abi, functionName: 'approve', args: [spender, amount] }),
        description: `${step.approve.token}.approve(${args.map((a) => a.value).join(', ')})`,
        kind: 'approve',
        contract: step.approve.token,
        method: 'approve',
        args,
      });
      continue;
    }
    const fn = toFunction(step.call.function);
    const values = await ctx.args(step.call.args, fn.inputs);
    const value = step.call.value ? ((await ctx.bind(step.call.value, { type: 'uint256' })) as bigint) : undefined;
    const args = await Promise.all(
      step.call.args.map(async (b, i) => ({ name: fn.inputs[i].name || `arg${i + 1}`, ...(await ctx.show(b, values[i])) })),
    );
    calls.push({
      to: protocol.contracts[step.call.contract].address,
      data: encodeFunctionData({ abi: [fn], functionName: fn.name, args: values }),
      value,
      description: `${step.call.contract}.${fn.name}(${args.map((a) => a.value).join(', ')})`,
      kind: 'call',
      contract: step.call.contract,
      method: fn.name,
      args,
    });
  }

  const simulation = await client.simulateCalls({
    account,
    calls: calls.map(({ to, data, value }) => ({ to, data, value })),
    traceAssetChanges: true,
    blockNumber,
  });
  const failed = simulation.results.findIndex((r) => r.status !== 'success');
  if (failed >= 0) {
    const error = simulation.results[failed].error;
    // The contract's own revert reason when it gave one, without viem's debug details.
    const reverted = error instanceof BaseError ? (error.walk((e) => !!(e as { reason?: string }).reason) as { reason?: string } | null) : null;
    const reason = reverted?.reason ?? error?.message ?? 'reverted';
    throw new ToolError(`Simulation failed at step ${failed + 1} (${calls[failed].description}): ${reason}`);
  }
  const assetChanges = simulation.assetChanges
    .filter((c) => c.value.diff !== 0n)
    .map((c) => ({ token: c.token.address, symbol: c.token.symbol, change: formatUnits(c.value.diff, c.token.decimals ?? 18) }));
  return { protocol: protocol.name, tool: tool.name, account, calls, assetChanges };
}

function findTool<K extends ToolDeclaration['kind']>(protocol: Protocol, name: string, kind: K): Extract<ToolDeclaration, { kind: K }> {
  const tool = protocol.manifest.tools.find((t) => t.name === name);
  if (!tool) throw new ToolError(`${protocol.name} has no tool named ${name}.`);
  if (tool.kind !== kind) throw new ToolError(`${name} is a ${tool.kind} tool.`);
  return tool as Extract<ToolDeclaration, { kind: K }>;
}

function toFunction(signature: string): AbiFunction {
  return parseAbiItem(signature) as AbiFunction;
}

/** Turns manifest bindings into ABI values. Resolves each input once per call. */
class Bindings {
  private resolved = new Map<string, Promise<unknown>>();
  private decimalsCache = new Map<string, Promise<number>>();

  constructor(
    private client: ChainClient,
    private protocol: Protocol,
    private tool: ToolDeclaration,
    private input: ToolInput,
    private account: Address | undefined,
  ) {}

  args(bindings: string[], params: readonly AbiParameter[]): Promise<unknown[]> {
    return Promise.all(bindings.map((b, i) => this.bind(b, params[i])));
  }

  async bind(binding: string, param: { type: string }): Promise<unknown> {
    if (!binding.startsWith('$')) return literal(binding, param.type);
    const [root, key] = binding.slice(1).split('.', 2);
    if (root === 'sender') {
      if (!this.account) throw new ToolError('This tool needs your wallet address. Set WEB3MCP_ACCOUNT.');
      return this.account;
    }
    if (root === 'contracts') return this.protocol.contracts[key].address;
    if (!this.resolved.has(key)) this.resolved.set(key, this.resolveInput(key));
    return this.resolved.get(key);
  }

  /** How a bound value reads to a person: an input as they typed it, with its token or resolved address. */
  async show(binding: string, value: unknown): Promise<Omit<ShownArg, 'name'>> {
    const address = typeof value === 'string' && isAddress(value) ? (value as Address) : undefined;
    const alias = address && Object.entries(this.protocol.contracts).find(([, c]) => c.address === address)?.[0];
    if (alias) return { value: alias, address };
    if (binding === '$sender') return { value: 'you', address };
    const [root, key] = binding.slice(1).split('.', 2);
    if (!binding.startsWith('$') || root !== 'input') return { value: address ?? String(value), address };
    const declared = this.tool.inputs[key];
    const text = String(this.input[key]).trim();
    if (declared.type === 'amount') return { value: `${text} ${declared.token!.toUpperCase()}` };
    if (declared.type === 'ether') return { value: `${text} ETH` };
    if (declared.type === 'date') return { value: formatDateInput(value as bigint) };
    return { value: address && text.toLowerCase() !== address.toLowerCase() ? text : (address ?? text), address };
  }

  decimals(alias: string): Promise<number> {
    if (!this.decimalsCache.has(alias)) {
      this.decimalsCache.set(
        alias,
        this.client
          .readContract({ address: this.protocol.contracts[alias].address, abi: erc20Abi, functionName: 'decimals' })
          .then(Number),
      );
    }
    return this.decimalsCache.get(alias)!;
  }

  private async resolveInput(name: string): Promise<unknown> {
    const declared = this.tool.inputs[name];
    const raw = this.input[name];
    if (raw === undefined || raw === null || raw === '') throw new ToolError(`Missing input "${name}".`);
    const text = String(raw).trim();
    switch (declared.type) {
      case 'date':
        try { return parseDateInput(text); }
        catch { throw new ToolError(`"${name}" must be a valid ISO date or date-time with explicit timezone within uint64 Unix seconds.`); }
      case 'address':
        return resolveAddress(this.client, text);
      case 'amount':
      case 'ether': {
        if (!/^\d+(\.\d+)?$/.test(text)) throw new ToolError(`"${name}" must be a plain decimal amount, such as 10.5.`);
        const decimals = declared.type === 'ether' ? 18 : await this.decimals(declared.token!);
        // parseUnits would silently round extra digits, so 0.0000001 USDC would become 0.
        if ((text.split('.')[1]?.length ?? 0) > decimals) {
          throw new ToolError(`"${name}" has more decimal places than ${declared.token ?? 'ETH'} supports (${decimals}).`);
        }
        return parseUnits(text, decimals);
      }
      case 'uint256':
        if (!/^\d+$/.test(text)) throw new ToolError(`"${name}" must be a whole number.`);
        return BigInt(text);
      case 'bool':
        if (text !== 'true' && text !== 'false') throw new ToolError(`"${name}" must be true or false.`);
        return text === 'true';
      case 'bytes32':
        if (!/^0x[0-9a-fA-F]{64}$/.test(text)) throw new ToolError(`"${name}" must be 32 bytes of hex.`);
        return text;
      case 'string':
        return text;
    }
  }
}

function literal(raw: string, type: string): unknown {
  if (/^u?int\d*$/.test(type)) return BigInt(raw);
  if (type === 'bool') return raw === 'true';
  if (type === 'address') return getAddress(raw.toLowerCase());
  return raw;
}

function jsonSafe(value: unknown): unknown {
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.map(jsonSafe);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, jsonSafe(v)]));
  return value;
}
