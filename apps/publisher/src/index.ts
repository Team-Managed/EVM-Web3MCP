#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { createPublicClient, http } from 'viem';
import { mainnet, sepolia } from 'viem/chains';
import { DIGEST_KEY, discover, readCode, validateManifest, verifyManifest, type Protocol } from '@web3mcp/evm';
import { manifestRecords, publishCalldata, SET_TEXT_SELECTORS } from './records.js';

const USAGE = `Usage:
  web3mcp-publish validate <manifest.json>       check the format, offline
  web3mcp-publish check <manifest.json>          also check it against the chain, and print the ENS records to publish
  web3mcp-publish check <ens-name>               discover a published name, as an agent's host would

WEB3MCP_RPC_URL sets the RPC (default: the chain's public one). WEB3MCP_CHAIN=mainnet checks a name on mainnet (default: sepolia).`;

const env = process.env;
const [command, target] = process.argv.slice(2);
if (!target || (command !== 'validate' && command !== 'check')) {
  console.error(USAGE);
  process.exit(2);
}

try {
  if (command === 'check' && !target.endsWith('.json')) {
    const chain = env.WEB3MCP_CHAIN === 'mainnet' ? mainnet : sepolia;
    const protocol = await discover(client(chain), target);
    console.log(`✓ ${protocol.name} is published on ${chain.name}: ${protocol.manifest.tools.length} tools, digest matches.`);
    printTrust(protocol);
  } else {
    const json: unknown = JSON.parse(await readFile(target, 'utf8'));
    const manifest = validateManifest(json);
    console.log(`✓ ${manifest.name}: ${manifest.tools.length} tools on chain ${manifest.chainId}`);
    if (command === 'check') {
      // A host reads ENS and the contracts through one client, so the contracts must be on an ENS chain.
      const chain = [mainnet, sepolia].find((c) => c.id === manifest.chainId);
      if (!chain) throw new Error(`Chain ${manifest.chainId} isn't supported yet: deploy on Ethereum mainnet (1) or Sepolia (11155111).`);
      const publicClient = client(chain);
      printTrust(await verifyManifest(publicClient, manifest, manifest.name));

      const { value, digest } = manifestRecords(json);
      const live = await publicClient.getEnsText({ name: manifest.name, key: DIGEST_KEY }).catch(() => null);
      if (live?.toLowerCase() === digest) {
        console.log(`\nENS already has this exact manifest. Nothing to publish.`);
        process.exit(0);
      }
      console.log(`\nOn ENS now: ${live ? `a different manifest (digest ${live})` : 'no manifest'}`);
      console.log(`\nSet both text records on ${manifest.name} in one transaction:`);
      const bytes = Buffer.byteLength(value);
      // AgentSwap's first 2.8 KB publication took 10.7M gas, and a transaction may use at most 16,777,216.
      if (bytes > 4000) console.log(`Warning: at ${bytes} bytes, the first publication may not fit in one transaction's gas. Shorten descriptions or drop tools.`);
      console.log(`org.web3mcp.manifest (${bytes} bytes):\n${value}`);
      console.log(`org.web3mcp.digest:\n${digest}`);
      const resolver = await publicClient.getEnsResolver({ name: manifest.name }).catch(() => undefined);
      if (!resolver || BigInt(resolver) === 0n) {
        console.log(`\n${manifest.name} has no resolver yet. Register it, or create the subname, in the ENS app first.`);
      } else {
        const { code } = await readCode(publicClient, resolver);
        const version = (['v2', 'v1'] as const).find((v) => code?.includes(SET_TEXT_SELECTORS[v].slice(2)));
        if (!version) {
          console.log(`\nThe resolver ${resolver} has no setText this tool knows. Set the two records in the ENS app.`);
        } else {
          const calldata = publishCalldata(manifest.name, { value, digest }, version);
          console.log(`\nOr send both in one call from the name's owner (ENS ${version} resolver ${resolver}):`);
          // A private RPC URL usually holds an API key: let the shell fill it in rather than print it into a transcript.
          const rpc = env.WEB3MCP_RPC_URL ? '"$WEB3MCP_RPC_URL"' : chain.rpcUrls.default.http[0];
          console.log(`cast send ${resolver} --data ${calldata} --rpc-url ${rpc} --account <your-keystore>`);
        }
      }
    }
  }
} catch (e) {
  console.error(`✗ ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
}

function client(chain: typeof mainnet | typeof sepolia) {
  return createPublicClient({ chain, transport: http(env.WEB3MCP_RPC_URL || undefined) });
}

function printTrust(protocol: Protocol) {
  for (const [alias, c] of Object.entries(protocol.contracts)) {
    const note = c.trust === 'name-only' ? `: no primary name points back to ${protocol.name} or a subname` : '';
    console.log(`  ${alias} ${c.address} ${c.trust}${note}`);
  }
}
