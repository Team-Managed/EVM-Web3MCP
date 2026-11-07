import { fileURLToPath } from 'node:url';
import type { ServerOptions } from '../../../packages/mcp/dist/server.js';

export class LauncherConfigError extends Error {
  override name = 'LauncherConfigError';
}

/** Fixture mode stays offline and deliberately ignores live-only settings. */
export async function serverOptions(env: NodeJS.ProcessEnv): Promise<ServerOptions> {
  const mode = env.WEB3MCP_MODE ?? 'fixture';
  if (mode === 'fixture') {
    return { manifestDir: fileURLToPath(new URL('../../../spec/fixtures/valid/', import.meta.url)) };
  }
  if (mode !== 'live') throw new LauncherConfigError('WEB3MCP_MODE must be fixture or live.');
  if (env.WEB3MCP_CHAIN && env.WEB3MCP_CHAIN !== 'sepolia') {
    throw new LauncherConfigError('Codex live mode supports Sepolia only. Unset WEB3MCP_CHAIN or set it to sepolia.');
  }
  const rpcUrl = env.WEB3MCP_RPC_URL || undefined;
  if (rpcUrl) {
    let url: URL;
    try { url = new URL(rpcUrl); } catch {
      throw new LauncherConfigError('WEB3MCP_RPC_URL must be an absolute HTTP or HTTPS URL.');
    }
    if (!['http:', 'https:'].includes(url.protocol) || !/^https?:\/\//i.test(rpcUrl) || rpcUrl.trim() !== rpcUrl) {
      throw new LauncherConfigError('WEB3MCP_RPC_URL must be an absolute HTTP or HTTPS URL without surrounding whitespace.');
    }
  }
  const { createPublicClient, http, isAddress } = await import('viem');
  const { sepolia } = await import('viem/chains');
  const account = env.WEB3MCP_ACCOUNT || undefined;
  if (account && !isAddress(account, { strict: false })) {
    const { normalize } = await import('viem/ens');
    try {
      if (!account.includes('.') || normalize(account) !== account) throw new Error();
    } catch {
      throw new LauncherConfigError('WEB3MCP_ACCOUNT must be a public wallet address or normalized ENS name.');
    }
  }
  return {
    client: createPublicClient({ chain: sepolia, transport: http(rpcUrl) }),
    account,
  };
}
