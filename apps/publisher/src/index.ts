#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { ManifestError, validateManifest } from '@web3mcp/evm';

const [command, file] = process.argv.slice(2);
if (command !== 'validate' || !file) {
  console.error('Usage: web3mcp-publish validate <manifest.json>');
  process.exit(2);
}

try {
  const manifest = validateManifest(JSON.parse(await readFile(file, 'utf8')));
  console.log(`✓ ${manifest.name}: ${manifest.tools.length} tools on chain ${manifest.chainId}`);
} catch (e) {
  console.error(e instanceof ManifestError ? e.message : String(e));
  process.exit(1);
}
