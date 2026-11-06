import { parseAbiItem, type Abi } from 'viem';
import { z } from 'zod';

const identifier = z.string().regex(/^[a-z][a-z0-9_]{0,31}$/, 'expected a lowercase identifier of up to 32 characters');
const address = z.string().regex(/^0x[0-9a-fA-F]{40}$/, 'expected a 0x-prefixed address');
const binding = z.string().min(1).max(100);

const input = z.strictObject({
  type: z.enum(['address', 'amount', 'ether', 'uint256', 'bool', 'bytes32', 'string', 'date']),
  description: z.string().max(200).optional(),
  // An amount is a human decimal, scaled by this contract's decimals(). An ether input is one in ETH (18 decimals).
  token: identifier.optional(),
});

const call = z.strictObject({
  contract: identifier,
  function: z.string().max(300),
  args: z.array(binding).max(8).default([]),
  value: binding.optional(),
});

const step = z.union([
  z.strictObject({ call }),
  z.strictObject({ approve: z.strictObject({ token: identifier, spender: identifier, amount: binding }) }),
]);

const common = {
  name: identifier,
  description: z.string().min(1).max(500),
  inputs: z.record(identifier, input).default({}),
};

// Formats a read's numeric result, such as "10.5 USDC": with a contract's decimals(), or a fixed count such as 18 for ETH.
const output = z
  .strictObject({
    decimalsFrom: identifier.optional(),
    decimals: z.number().int().min(0).max(36).optional(),
    symbol: z.string().max(12).optional(),
  })
  .refine((o) => (o.decimalsFrom === undefined) !== (o.decimals === undefined), 'set exactly one of decimalsFrom or decimals');

const tool = z.discriminatedUnion('kind', [
  // dryRun: the function changes state when sent, like Uniswap's Quoter, so it may only ever run as an eth_call.
  z.strictObject({ ...common, kind: z.literal('read'), call, output: output.optional(), dryRun: z.boolean().optional() }),
  z.strictObject({ ...common, kind: z.literal('write'), steps: z.array(step).min(1).max(4) }),
]);

const manifestSchema = z.strictObject({
  web3mcp: z.literal('0.1-evm'),
  chainId: z.number().int().positive(),
  name: z.string().regex(/^[a-z0-9-]+(\.[a-z0-9-]+)+$/, 'expected a normalized ENS name'),
  contracts: z.record(identifier, address),
  tools: z.array(tool).min(1).max(32),
});

export type Manifest = z.infer<typeof manifestSchema>;
export type ToolDeclaration = Manifest['tools'][number];

export class ManifestError extends Error {
  constructor(readonly issues: string[]) {
    super(`Invalid Web3MCP manifest:\n- ${issues.join('\n- ')}`);
    this.name = 'ManifestError';
  }
}

/** Parse untrusted manifest JSON. Throws ManifestError listing every problem found. */
export function validateManifest(json: unknown): Manifest {
  const parsed = manifestSchema.safeParse(json);
  if (!parsed.success) {
    throw new ManifestError(parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`));
  }
  const issues = checkReferences(parsed.data);
  if (issues.length > 0) throw new ManifestError(issues);
  return parsed.data;
}

function checkReferences(m: Manifest): string[] {
  const issues: string[] = [];
  const names = new Set<string>();
  // The signing page shows the user's own address as "you", so no contract may take that name.
  if ('you' in m.contracts) issues.push('contracts.you: "you" is reserved for the user\'s own wallet');

  for (const t of m.tools) {
    const at = `tools.${t.name}`;
    if (names.has(t.name)) issues.push(`${at}: duplicate tool name`);
    names.add(t.name);

    const checkAlias = (alias: string, where: string) => {
      if (!(alias in m.contracts)) issues.push(`${where}: unknown contract "${alias}"`);
    };
    const checkBinding = (b: string, where: string) => {
      if (!b.startsWith('$')) return; // literals are parsed against the ABI type at execution
      const [root, key] = b.slice(1).split('.', 2);
      if (root === 'sender' && key === undefined) return;
      if (root === 'input' && key !== undefined && key in t.inputs) return;
      if (root === 'contracts' && key !== undefined && key in m.contracts) return;
      issues.push(`${where}: unknown binding "${b}"`);
    };

    for (const [name, i] of Object.entries(t.inputs)) {
      if (i.type === 'amount' && !i.token) issues.push(`${at}.inputs.${name}: an amount needs a token`);
      if (i.token) checkAlias(i.token, `${at}.inputs.${name}`);
    }

    const calls = t.kind === 'read' ? [t.call] : t.steps.flatMap((s) => ('call' in s ? [s.call] : []));
    if (t.kind === 'read' && t.output?.decimalsFrom) checkAlias(t.output.decimalsFrom, `${at}.output`);
    if (t.kind === 'write') {
      for (const s of t.steps) {
        if (!('approve' in s)) continue;
        checkAlias(s.approve.token, `${at}.approve`);
        checkAlias(s.approve.spender, `${at}.approve`);
        checkBinding(s.approve.amount, `${at}.approve`);
        // An approval moves no tokens, so the simulation can't expose a wrong unit: the amount shown as
        // "N <token>" must be scaled by the token being approved, or be a literal in its base units.
        const [root, key] = s.approve.amount.slice(1).split('.', 2);
        const input = root === 'input' ? t.inputs[key] : undefined;
        if (s.approve.amount.startsWith('$') && (input?.type !== 'amount' || input.token !== s.approve.token)) {
          issues.push(`${at}.approve: the amount must be a literal or an amount input in ${s.approve.token}`);
        }
      }
    }

    for (const c of calls) {
      checkAlias(c.contract, at);
      let item: Abi[number];
      try {
        item = parseAbiItem(c.function) as Abi[number];
      } catch {
        issues.push(`${at}: cannot parse function "${c.function}"`);
        continue;
      }
      if (item.type !== 'function') {
        issues.push(`${at}: "${c.function}" is not a function`);
        continue;
      }
      const readOnly = item.stateMutability === 'view' || item.stateMutability === 'pure';
      // Without dryRun, a write declared as a read by mistake would "succeed" while nothing happened.
      const dryRun = t.kind === 'read' && t.dryRun && item.stateMutability === 'nonpayable';
      if (t.kind === 'read' && !readOnly && !dryRun) {
        issues.push(`${at}: read tools may only call view or pure functions, or non-payable ones with "dryRun": true`);
      }
      if (t.kind === 'write' && readOnly) issues.push(`${at}: write steps must call state-changing functions`);
      if (c.value !== undefined && item.stateMutability !== 'payable') issues.push(`${at}: value sent to non-payable ${item.name}`);
      if (c.args.length !== item.inputs.length) {
        issues.push(`${at}: ${item.name} takes ${item.inputs.length} arguments, got ${c.args.length}`);
      }
      c.args.forEach((a) => checkBinding(a, at));
      if (c.value !== undefined) checkBinding(c.value, at);
    }
  }
  return issues;
}
