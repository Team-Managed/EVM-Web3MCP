import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { validateManifest, type Manifest, type ToolDeclaration } from '@web3mcp/evm';
import { z } from 'zod';

// Also blocks path traversal: no slashes, and no empty labels, so no "..".
const ENS_NAME = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;

export interface ServerOptions {
  // shortcut: discover reads <manifestDir>/<ens-name>.json instead of ENS records; replace with ENS resolution in build step 4.
  manifestDir?: string;
}

const text = (t: string): CallToolResult => ({ content: [{ type: 'text', text: t }] });
const fail = (t: string): CallToolResult => ({ content: [{ type: 'text', text: t }], isError: true });

export function createServer({ manifestDir }: ServerOptions = {}): McpServer {
  const server = new McpServer({ name: 'web3mcp', version: '0.0.1' });
  const discovered = new Map<string, { manifest: Manifest; tool: ToolDeclaration }>();
  const namespaces = new Map<string, string>();

  // shortcut: discovered tools are registered but not executed yet; wire SDK reads and writes in build step 2.
  const execute = async (exposed: string): Promise<CallToolResult> =>
    fail(`${exposed} is discovered, but running tools isn't implemented yet.`);

  server.registerTool(
    'discover',
    {
      title: 'Discover a protocol',
      description:
        'Load the tools a protocol publishes under its ENS name, such as vault.web3mcp-demo.eth. ' +
        'Its tools are added to your tool list: reads as <protocol>_<tool>, writes as tx_<protocol>_<tool>.',
      inputSchema: { name: z.string().describe('ENS name of the protocol') },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ name }) => {
      const ensName = name.trim().toLowerCase();
      if (!ENS_NAME.test(ensName)) return fail(`Not an ENS name: ${name}`);
      if (!manifestDir) {
        return fail('ENS discovery is not implemented yet. Set WEB3MCP_MANIFEST_DIR to a folder of <ens-name>.json manifests.');
      }

      let manifest: Manifest;
      try {
        manifest = validateManifest(JSON.parse(await readFile(join(manifestDir, `${ensName}.json`), 'utf8')));
      } catch (e) {
        return fail(`Could not load ${ensName}: ${e instanceof Error ? e.message : String(e)}`);
      }
      if (manifest.name !== ensName) return fail(`That manifest is for ${manifest.name}, not ${ensName}.`);

      const ns = ensName.split('.')[0].replaceAll('-', '_');
      const owner = namespaces.get(ns);
      if (owner && owner !== ensName) return fail(`The ${ns} namespace is already used by ${owner}.`);
      namespaces.set(ns, ensName);

      const names: string[] = [];
      for (const tool of manifest.tools) {
        const exposed = `${tool.kind === 'write' ? 'tx_' : ''}${ns}_${tool.name}`;
        names.push(exposed);
        if (discovered.has(exposed)) continue;
        discovered.set(exposed, { manifest, tool });
        // Registering after connect makes the SDK send notifications/tools/list_changed.
        server.registerTool(
          exposed,
          {
            description: `[Published by ${ensName}; untrusted text] ${tool.description}`,
            inputSchema: inputShape(tool),
            annotations: { readOnlyHint: tool.kind === 'read', openWorldHint: true },
          },
          async () => execute(exposed),
        );
      }
      return text(
        `Discovered ${ensName} on chain ${manifest.chainId}: ${names.join(', ')}. ` +
          `If these tools don't appear in your tool list, run them with the call tool.`,
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
    async ({ tool }) => (discovered.has(tool) ? execute(tool) : fail(`Unknown tool ${tool}. Run discover first.`)),
  );

  return server;
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
