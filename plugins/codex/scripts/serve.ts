import { access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// shortcut: deliberately selects fixtures; replace when live ENS discovery is implemented.
const entry = new URL('../../../packages/mcp/dist/index.js', import.meta.url);
try {
  await access(entry);
} catch {
  throw new Error('Web3MCP build missing. Run npm ci and npm run build at the repository root.');
}
process.env.WEB3MCP_MANIFEST_DIR = fileURLToPath(
  new URL('../../../spec/fixtures/valid/', import.meta.url),
);
await import(entry.href);
