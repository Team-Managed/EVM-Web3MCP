import { access } from 'node:fs/promises';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { fileURLToPath } from 'node:url';
import { createServer } from '../../../packages/mcp/dist/server.js';

// shortcut: deliberately selects fixtures; replace when live ENS discovery is implemented.
const entry = new URL('../../../packages/mcp/dist/server.js', import.meta.url);
try {
  await access(entry);
} catch {
  throw new Error('Web3MCP build missing. Run npm ci and npm run build at the repository root.');
}
const manifestDir = fileURLToPath(new URL('../../../spec/fixtures/valid/', import.meta.url));
await createServer({ manifestDir }).connect(new StdioServerTransport());
