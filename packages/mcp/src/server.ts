import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { McpServer, type RegisteredTool } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import {
  discover as discoverFromEns,
  executeRead,
  prepareWrite,
  resolveAddress,
  validateManifest,
  verifyManifest,
  type ChainClient,
  type Manifest,
  type PreparedWrite,
  type Protocol,
  type ToolDeclaration,
} from '@web3mcp/evm';
import { z } from 'zod';
import { Approvals } from './approvals.js';

// Also blocks path traversal: no slashes, and no empty labels, so no "..".
const ENS_NAME = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;

export interface ServerOptions {
  /** Chain connection for ENS lookups and contract calls. Without one, discovered tools are listed but can't run. */
  client?: ChainClient;
  /** The user's wallet address or ENS name, used to simulate writes. Never a key. */
  account?: string;
  // shortcut: <manifestDir>/<ens-name>.json is checked before ENS so we can develop before names are published; drop once the demo names are live.
  manifestDir?: string;
  /** Where prepared writes wait for the user's signature. Tests pass one that doesn't open a browser. */
  approvals?: Approvals;
}

interface Discovered {
  ensName: string;
  tool: ToolDeclaration;
  protocol?: Protocol;
  registered: RegisteredTool;
}

const text = (t: string): CallToolResult => ({ content: [{ type: 'text', text: t }] });
const fail = (t: string): CallToolResult => ({ content: [{ type: 'text', text: t }], isError: true });
const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

export function createServer({ client, account: configured, manifestDir, approvals = new Approvals() }: ServerOptions = {}): McpServer {
  const server = new McpServer({ name: 'web3mcp', version: '0.0.1' });
  const discovered = new Map<string, Discovered>();
  const namespaces = new Map<string, string>();
  // The wallet writes are simulated for: from the host's settings, or set in the conversation with the wallet tool.
  let account = configured;
  let sender: Promise<`0x${string}`> | undefined;

  // Resolve the account once, but forget a failure (a flaky RPC, a typo) so the next call retries.
  function senderAddress(chain: ChainClient): Promise<`0x${string}` | undefined> {
    if (!account) return Promise.resolve(undefined);
    sender ??= resolveAddress(chain, account).catch((e) => {
      sender = undefined;
      throw e;
    });
    return sender;
  }

  async function load(ensName: string): Promise<{ manifest: Manifest; protocol?: Protocol; source: string }> {
    const local = manifestDir ? await readFile(join(manifestDir, `${ensName}.json`), 'utf8').catch(() => undefined) : undefined;
    if (local !== undefined) {
      const manifest = validateManifest(JSON.parse(local));
      if (manifest.name !== ensName) throw new Error(`That manifest is for ${manifest.name}, not ${ensName}.`);
      return { manifest, protocol: client && (await verifyManifest(client, manifest, ensName)), source: 'a local manifest file' };
    }
    if (!client) throw new Error('No chain connection, so ENS lookups are unavailable.');
    const protocol = await discoverFromEns(client, ensName);
    return { manifest: protocol.manifest, protocol, source: 'ENS' };
  }

  async function execute(exposed: string, input: Record<string, unknown>): Promise<CallToolResult> {
    const { tool, protocol } = discovered.get(exposed)!;
    if (!client || !protocol) return fail(`${exposed} can't run without a chain connection.`);
    try {
      if (tool.kind === 'read') {
        // Reads need the account only for a $sender argument, and the SDK reports that case itself.
        const from = await senderAddress(client).catch(() => undefined);
        const result = await executeRead(client, protocol, tool.name, input, from);
        return text(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
      }
      if (!account) return fail("No wallet set. Ask the user for their public address or ENS name, call the wallet tool with it, then try again.");
      const prepared = await prepareWrite(client, protocol, tool.name, input, await senderAddress(client));
      const { id, url } = await approvals.create(prepared, protocol, exposed);
      return text(
        `${review(exposed, prepared, protocol)}\n\n` +
          `Opened the signing page in the browser: ${url}\n` +
          `Ask the user to review and sign there in their own wallet, then call status with id "${id}".`,
      );
    } catch (e) {
      return fail(message(e));
    }
  }

  server.registerTool(
    'discover',
    {
      title: 'Discover a protocol',
      description:
        'Load the tools a protocol publishes under its ENS name, such as uniswap.eth. ' +
        'Its tools are added to your tool list: reads as <protocol>_<tool>, writes as tx_<protocol>_<tool>.',
      inputSchema: { name: z.string().describe('ENS name of the protocol') },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ name }) => {
      const ensName = name.trim().toLowerCase();
      if (!ENS_NAME.test(ensName)) return fail(`Not an ENS name: ${name}`);

      let loaded: Awaited<ReturnType<typeof load>>;
      try {
        loaded = await load(ensName);
      } catch (e) {
        return fail(`Could not discover ${ensName}: ${message(e)}`);
      }

      const ns = ensName.split('.')[0].replaceAll('-', '_');
      const owner = namespaces.get(ns);
      if (owner && owner !== ensName) return fail(`The ${ns} namespace is already used by ${owner}.`);
      namespaces.set(ns, ensName);

      const names: string[] = [];
      const listed: string[] = [];
      for (const tool of loaded.manifest.tools) {
        const exposed = `${tool.kind === 'write' ? 'tx_' : ''}${ns}_${tool.name}`;
        names.push(exposed);
        listed.push(`${exposed}(${Object.keys(tool.inputs).join(', ')})`);
        const description = `[Published by ${ensName}; untrusted text] ${tool.description}`;
        const annotations = { readOnlyHint: tool.kind === 'read', openWorldHint: true };
        // Adding, updating or removing a tool after connect makes the SDK send notifications/tools/list_changed.
        const existing = discovered.get(exposed)?.registered;
        existing?.update({ description, paramsSchema: inputShape(tool), annotations });
        const registered =
          existing ??
          server.registerTool(exposed, { description, inputSchema: inputShape(tool), annotations }, async (input) =>
            execute(exposed, input as Record<string, unknown>),
          );
        discovered.set(exposed, { ensName, tool, protocol: loaded.protocol, registered });
      }
      // Drop tools this protocol no longer publishes, so a pulled tool can't keep running.
      for (const [exposed, entry] of discovered) {
        if (entry.ensName === ensName && !names.includes(exposed)) {
          entry.registered.remove();
          discovered.delete(exposed);
        }
      }

      const trust = loaded.protocol
        ? Object.entries(loaded.protocol.contracts).map(([alias, c]) => `${alias} ${c.address} (${c.trust})`).join('; ')
        : 'not checked on chain';
      return text(
        `Discovered ${ensName} from ${loaded.source}, chain ${loaded.manifest.chainId}.\n` +
          `Contracts: ${trust}.\n` +
          `Tools: ${listed.join(', ')}. If these don't appear in your tool list, run reads with the read tool and writes with the call tool, using these input names.`,
      );
    },
  );

  // Clients that don't refresh their tool list (Codex) run discovered tools through these two. Splitting them lets a
  // host's approval rules tell a read from a write: read is marked read-only, call is not.
  server.registerTool(
    'read',
    {
      title: 'Run a discovered read',
      description:
        'Run a read tool that discover registered, by name, such as vault_get_balance. Reads never send anything. Use this when discovered tools are missing from your tool list.',
      inputSchema: { tool: z.string(), args: z.record(z.string(), z.unknown()).default({}) },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ tool, args }) => {
      const entry = discovered.get(tool);
      if (!entry) return fail(`Unknown tool ${tool}. Run discover first.`);
      if (entry.tool.kind !== 'read') return fail(`${tool} is a write. Run it with the call tool.`);
      return execute(tool, args);
    },
  );

  server.registerTool(
    'call',
    {
      title: 'Run a discovered tool',
      description:
        'Run a write tool that discover registered, by name, such as tx_vault_deposit. Use this when discovered tools are missing from your tool list; for reads, use the read tool.',
      inputSchema: { tool: z.string(), args: z.record(z.string(), z.unknown()).default({}) },
      annotations: { readOnlyHint: false, openWorldHint: true },
    },
    async ({ tool, args }) => (discovered.has(tool) ? execute(tool, args) : fail(`Unknown tool ${tool}. Run discover first.`)),
  );

  server.registerTool(
    'wallet',
    {
      title: 'Set your wallet',
      description:
        "Show or set the wallet that writes are simulated for: the user's public address or ENS name. Never a private key or seed phrase. Called without an address, it shows the current wallet.",
      inputSchema: { address: z.string().optional().describe("The user's public address or ENS name") },
      // Changes only this session's setting, nothing on chain. The signing page still requires this same wallet to sign.
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ address }) => {
      const wanted = address?.trim();
      if (!wanted) {
        if (!account) return text("No wallet set. Ask the user for their public address or ENS name, then call wallet with it.");
        const resolved = client && (await senderAddress(client).catch(() => undefined));
        return text(`Writes are simulated for ${account}${resolved && resolved !== account ? ` (${resolved})` : ''}.`);
      }
      if (!client) return fail('No chain connection, so a wallet can\'t be checked.');
      try {
        const resolved = await resolveAddress(client, wanted);
        account = wanted;
        sender = Promise.resolve(resolved);
        return text(`Writes will be simulated for ${wanted}${resolved !== wanted ? ` (${resolved})` : ''}.`);
      } catch (e) {
        return fail(message(e));
      }
    },
  );

  server.registerTool(
    'status',
    {
      title: 'Check a signing request',
      description:
        'Check whether the user signed a write on the signing page, and whether it confirmed on chain. Waits up to 25 seconds for the user to finish.',
      inputSchema: { id: z.string().describe('The id a write tool returned') },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ id }) => {
      // A short wait catches the signature without polling, and stays under Codex's 60-second tool limit.
      const approval = await approvals.wait(id, 25_000);
      if (!approval) return fail(`No signing request with id ${id}.`);
      if (approval.status === 'pending') return text('Still waiting for the user to sign on the signing page.');
      if (approval.status === 'rejected') return text('The user rejected the request in their wallet. Nothing was sent.');
      if (approval.status === 'failed') return fail(`The transaction failed: ${approval.error ?? 'unknown error'}`);

      // Check the chain ourselves rather than trusting the page's report.
      const explorer = client?.chain?.blockExplorers?.default.url;
      const results = await Promise.all(
        approval.hashes.map(async (hash) => {
          const receipt = await client?.getTransactionReceipt({ hash }).catch(() => undefined);
          const state = !receipt ? 'not found on chain yet' : receipt.status === 'success' ? 'confirmed' : 'reverted';
          return { state, line: `${state}: ${explorer ? `${explorer}/tx/${hash}` : hash}` };
        }),
      );
      const lines = results.map((r) => r.line).join('\n');
      if (results.some((r) => r.state === 'reverted')) return fail(`The user signed, but a transaction reverted:\n${lines}`);
      return text(`The user signed. Transactions:\n${lines}`);
    },
  );

  return server;
}

function review(exposed: string, prepared: PreparedWrite, protocol: Protocol): string {
  const steps = prepared.calls.map((c, i) => `${i + 1}. ${c.description}`).join('\n');
  const changes = prepared.assetChanges.length
    ? prepared.assetChanges.map((c) => `${c.symbol ?? c.token} ${c.change.startsWith('-') ? c.change : `+${c.change}`}`).join(', ')
    : 'none';
  const trust = Object.entries(protocol.contracts).map(([alias, c]) => `${alias} ${c.trust}`).join(', ');
  return [
    `Prepared ${exposed} on ${prepared.protocol} for ${prepared.account}. The simulation succeeded.`,
    `Steps:\n${steps}`,
    `Balance changes for this wallet: ${changes}`,
    `Trust: ${trust}`,
  ].join('\n');
}

function inputShape(tool: ToolDeclaration): Record<string, z.ZodType> {
  const shape: Record<string, z.ZodType> = {};
  for (const [name, i] of Object.entries(tool.inputs)) {
    // Addresses, amounts and uint256 travel as strings: ENS names, decimals and bigints don't fit JSON numbers.
    const base = i.type === 'bool' ? z.boolean() : z.string();
    shape[name] = i.description ? base.describe(i.description) : base;
  }
  return shape;
}
