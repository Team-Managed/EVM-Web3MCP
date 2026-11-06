#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { ManifestError, validateManifest } from '@web3mcp/evm';
import { createPublicClient, http, getAddress, isAddress, type Address } from 'viem';
import { createInterface } from 'node:readline/promises';
import { sepolia } from 'viem/chains';
import { giftBoxManifest } from './giftbox.js';
import { preparePublication } from './publication.js';
import { runPublication } from './session.js';

const [command, file, ...options] = process.argv.slice(2);
if (!['validate', 'publish', 'giftbox'].includes(command) || !file) {
  console.error('Usage: web3mcp-publish validate <manifest.json> | giftbox <deployed-address> <usdc-address> | publish <manifest.json> [--dry-run] --account <address> --root <registry> --resolver <resolver> --owner <expected owner> [--usdc <reviewed token>]');
  process.exit(2);
}

try {
  if (command === 'giftbox') {
    if (options.length !== 1) throw new Error('giftbox requires deployed GiftBox and USDC addresses.');
    console.log(JSON.stringify(giftBoxManifest(file, options[0]), null, 2));
    process.exit(0);
  }
  const manifest = validateManifest(JSON.parse(await readFile(file, 'utf8')));
  if (command === 'validate') {
    if (options.length) throw new Error('Unexpected validate arguments.');
    console.log(`✓ ${manifest.name}: ${manifest.tools.length} tools on chain ${manifest.chainId}`);
  } else {
    const values = new Map<string, Address>();
    let dryRun = false;
    for (let i = 0; i < options.length; ++i) {
      const flag = options[i];
      if (flag === '--dry-run' && !dryRun) { dryRun = true; continue; }
      if (!['--account', '--root', '--resolver', '--owner', '--usdc'].includes(flag) || values.has(flag) || !isAddress(options[i + 1] ?? '')) throw new Error('Invalid or duplicate publishing option.');
      values.set(flag, getAddress(options[++i]));
    }
    for (const flag of ['--account', '--root', '--resolver', '--owner']) if (!values.has(flag)) throw new Error(`Missing ${flag}.`);
    if (!dryRun && !process.stdin.isTTY) throw new Error('Live publication needs an interactive terminal confirmation; use --dry-run for automation.');
    const client = createPublicClient({ chain: sepolia, transport: http(process.env.WEB3MCP_RPC_URL || undefined) });
    const publication = await preparePublication(client, manifest, { account: values.get('--account')!, root: values.get('--root')!,
      resolver: values.get('--resolver')!, owner: values.get('--owner')!, usdc: values.get('--usdc') });
    console.log(JSON.stringify({ ...publication.plan, signer: publication.options.account,
      owner: publication.options.owner, ownerScope: publication.ownerName, preparedOnly: true, permissionsVerified: true, simulated: true }, null, 2));
    if (!dryRun) {
      const result = await runPublication(client, publication, { confirm: async () => {
        const terminal = createInterface({ input: process.stdin, output: process.stdout });
        try { return (await terminal.question(`Create a local signing request for these TWO resolver writes on Sepolia as ${publication.options.account}? Type publish to continue: `)).trim() === 'publish'; }
        finally { terminal.close(); }
      }, onCreated: ({ id, url }) => console.log(`Local wallet review: ${url}\nRequest ID: ${id}. Only you may connect and sign.`) });
      console.log(JSON.stringify(result, null, 2));
      if (result.status !== 'confirmed' && result.status !== 'cancelled' && result.status !== 'rejected') process.exitCode = 1;
    }
  }
} catch (e) {
  // RPC exceptions can embed credential-bearing URLs; only show our offline validation diagnostics.
  console.error(e instanceof ManifestError ? e.message : command === 'publish'
    ? 'Publication checks or verification failed. Check options, Sepolia RPC, contract configuration, resolver compatibility and signer permissions. If a wallet request was already opened, inspect its hashes and wallet history before any retry; this error does not prove nothing was sent.'
    : String(e));
  process.exit(1);
}
