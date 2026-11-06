import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
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

// Also blocks path traversal: no slashes, and no empty labels, so no "..".
const ENS_NAME = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;

export interface ServerOptions {
  /** Chain connection for ENS lookups and contract calls. Without one, discovered tools are listed but can't run. */
  client?: ChainClient;
  /** The user's wallet address or ENS name, used to simulate writes. Never a key. */
  account?: string;
  // shortcut: <manifestDir>/<ens-name>.json is checked before ENS so we can develop before names are published; drop once the demo names are live.
  manifestDir?: string;
}

interface Discovered {
  tool: ToolDeclaration;
  protocol?: Protocol;
}

const text = (t: string): CallToolResult => ({ content: [{ type: 'text', text: t }] });
const fail = (t: string): CallToolResult => ({ content: [{ type: 'text', text: t }], isError: true });
const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

export function createServer({ client, account, manifestDir }: ServerOptions = {}): McpServer {
  const server = new McpServer({ name: 'web3mcp', version: '0.0.1' });
  const discovered = new Map<string, Discovered>();
  const namespaces = new Map<string, string>();
  let sender: Promise<`0x${string}`> | undefined;

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
      if (account) sender ??= resolveAddress(client, account);
      const from = await sender;
      if (tool.kind === 'read') {
        const result = await executeRead(client, protocol, tool.name, input, from);
        return text(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
      }
      return text(review(exposed, await prepareWrite(client, protocol, tool.name, input, from), protocol));
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
      for (const tool of loaded.manifest.tools) {
        const exposed = `${tool.kind === 'write' ? 'tx_' : ''}${ns}_${tool.name}`;
        names.push(exposed);
        const known = discovered.has(exposed);
        discovered.set(exposed, { tool, protocol: loaded.protocol });
        if (known) continue;
        // Registering after connect makes the SDK send notifications/tools/list_changed.
        server.registerTool(
          exposed,
          {
            description: `[Published by ${ensName}; untrusted text] ${tool.description}`,
            inputSchema: inputShape(tool),
            annotations: { readOnlyHint: tool.kind === 'read', openWorldHint: true },
          },
          async (input) => execute(exposed, input as Record<string, unknown>),
        );
      }

      const trust = loaded.protocol
        ? Object.entries(loaded.protocol.contracts).map(([alias, c]) => `${alias} ${c.address} (${c.trust})`).join('; ')
        : 'not checked on chain';
      return text(
        `Discovered ${ensName} from ${loaded.source}, chain ${loaded.manifest.chainId}.\n` +
          `Contracts: ${trust}.\n` +
          `Tools: ${names.join(', ')}. If these don't appear in your tool list, run them with the call tool.`,
      );
    },
  );

  server.registerTool(
    'call',
    {
      title: 'Run a discovered tool',
      description:
        'Run a tool that discover registered, by name, such as vault_get_balance. Use this when discovered tools are missing from your tool list.',
      inputSchema: { tool: z.string(), args: z.record(z.string(), z.unknown()).default({}) },
      annotations: { readOnlyHint: false, openWorldHint: true },
    },
    async ({ tool, args }) => (discovered.has(tool) ? execute(tool, args) : fail(`Unknown tool ${tool}. Run discover first.`)),
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
    // shortcut: nothing is sent yet; hand prepared calls to the local signing page (packages/approve-ui) next.
    'Not sent: signing in your wallet arrives with the local signing page, the next build step.',
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
