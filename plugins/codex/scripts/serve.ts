import { access } from 'node:fs/promises';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { LauncherConfigError, serverOptions } from './config.ts';

try {
  const options = await serverOptions(process.env);
  // Check before importing: static imports would fail before this diagnostic.
  for (const path of ['../../../packages/mcp/dist/server.js', '../../../packages/sdk/dist/index.js']) {
    await access(new URL(path, import.meta.url)).catch(() => {
      throw new LauncherConfigError('Web3MCP build missing. Run npm ci and npm run build at the repository root.');
    });
  }
  const { createServer } = await import('../../../packages/mcp/dist/server.js');
  await createServer(options).connect(new StdioServerTransport());
} catch (error) {
  // RPC errors can contain endpoint credentials; do not print arbitrary errors.
  console.error(error instanceof LauncherConfigError
    ? error.message
    : 'Web3MCP could not start. Run npm ci and npm run build at the repository root; check the launcher configuration.');
  process.exitCode = 1;
}
