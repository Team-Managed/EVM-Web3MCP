#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createPublicClient as createArkivClient, createWalletClient as createArkivWallet, ExpirationTime } from '@arkiv-network/sdk';
import { rabdi } from '@arkiv-network/sdk/chains';
import { and, eq } from '@arkiv-network/sdk/query';
import { createPublicClient, getAddress, http, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet, sepolia } from 'viem/chains';
import { DIGEST_KEY, discover, listing, LISTING, readCode, search, validateManifest, verifyManifest, type Protocol } from '@web3mcp/evm';
import { browserTransport } from './browser.js';
import { manifestRecords, publishCalldata, SET_TEXT_SELECTORS } from './records.js';
import { refreshBatch } from './refresh.js';

const USAGE = `Usage:
  web3mcp-publish validate <manifest.json>       check the format, offline
  web3mcp-publish check <manifest.json>          also check it against the chain, and print the ENS records to publish
  web3mcp-publish check <ens-name>               discover a published name, as an agent's host would
  web3mcp-publish index <ens-name> --account <foundry-keystore>
  web3mcp-publish index <ens-name> --browser <your-address>
                                                 list a published name on the Arkiv search index, or refresh its listing,
                                                 signed with a Foundry keystore or in your browser wallet
  web3mcp-publish search <word>...               search the Arkiv index, as an agent's search tool does

WEB3MCP_RPC_URL sets the RPC (default: the chain's public one). WEB3MCP_CHAIN=mainnet checks a name on mainnet (default: sepolia).
WEB3MCP_ARKIV_KEY is an optional Arkiv access key; without one, Arkiv requests use its rate-limited public endpoint.`;
// Listings drop out of search unless the publisher runs index again within this time.
const LIFETIME_DAYS = 30;

const env = process.env;
const [command, target, flag, signer] = process.argv.slice(2);
if (!target || !['validate', 'check', 'index', 'search'].includes(command) || (command === 'index' && (!['--account', '--browser'].includes(flag) || !signer))) {
  console.error(USAGE);
  process.exit(2);
}

try {
  if (command === 'index') {
    await index(target, flag, signer);
  } else if (command === 'search') {
    const ens = client(env.WEB3MCP_CHAIN === 'mainnet' ? mainnet : sepolia);
    const found = await search(createArkivClient({ chain: arkivChain(), transport: http() }), ens, process.argv.slice(3), ens.chain.id);
    for (const r of found) console.log(`${r.ens}  matched ${r.matched.join(', ')}  listed by ${r.owner}\n  ${r.description}`);
    if (found.length === 0) console.log('No listed protocol matches.');
  } else if (command === 'check' && !target.endsWith('.json')) {
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
  // The Arkiv SDK reports "insufficient funds" and other RPC errors as a bare "Execution error"; the root cause says what to fix.
  let root: unknown = e;
  while (root instanceof Error && root.cause) root = root.cause;
  const details = (root as { details?: unknown }).details;
  if (root !== e && typeof details === 'string') console.error(`  ${details}`);
  process.exit(1);
}

function client(chain: typeof mainnet | typeof sepolia) {
  return createPublicClient({ chain, transport: http(env.WEB3MCP_RPC_URL || undefined) });
}

// Arkiv's Rabdi testnet.
function arkivChain() {
  return rabdi({ accessKey: env.WEB3MCP_ARKIV_KEY ?? '' });
}

function printTrust(protocol: Protocol) {
  for (const [alias, c] of Object.entries(protocol.contracts)) {
    const note = c.trust === 'name-only' ? `: no primary name points back to ${protocol.name} or a subname` : '';
    console.log(`  ${alias} ${c.address} ${c.trust}${note}`);
  }
}

/** List a published name on the Arkiv index, or keep its listing alive. Safe to run again at any time. */
async function index(name: string, flag: string, signer: string): Promise<void> {
  // A browser wallet signs on the local signing page, so only its address is needed here.
  const browser = flag === '--browser' ? getAddress(signer) : undefined;
  const ens = client(env.WEB3MCP_CHAIN === 'mainnet' ? mainnet : sepolia);
  // ENS is the source of truth: list exactly what the name publishes, after the same checks a host runs.
  const protocol = await discover(ens, name);
  const digest = (await ens.getEnsText({ name: protocol.name, key: DIGEST_KEY }))?.toLowerCase() as Hex;

  const account = browser ?? privateKeyToAccount(keystoreKey(signer));
  const owner = typeof account === 'string' ? account : account.address;
  const chain = arkivChain();
  const arkiv = createArkivClient({ chain, transport: http() });

  // Only this wallet can change or extend its own listings; anyone else's listing of the name is theirs.
  const { entities } = await arkiv
    .select({ $key: true, digest: true })
    .where(and(eq('arkiv.schema', LISTING), eq('ens', protocol.name)))
    .ownedBy(owner)
    .fetch();
  const expiration = ExpirationTime.fromDays(LIFETIME_DAYS);
  const entry = listing(protocol.manifest, digest);
  // One transaction: drop outdated listings, then extend the current one or write a new one.
  const { current, batch } = refreshBatch(entities, digest, { schema: entry.schema, values: entry.values, expiration }, expiration);

  const old = batch.deletes.length ? `, and delete ${batch.deletes.length} outdated listing${batch.deletes.length > 1 ? 's' : ''}` : '';
  const page = {
    protocol: protocol.name,
    title: `${current ? 'Keep' : 'List'} ${protocol.name} in Web3MCP search`,
    description: `${current ? 'Extend its search listing' : 'Write its search listing'} on Arkiv for ${LIFETIME_DAYS} days${old}`,
  };
  const wallet = createArkivWallet({ chain, transport: browser ? browserTransport(chain, page) : http(), account });
  const result = await wallet.executeBatch(batch);

  const key = current ?? result.createdEntities[0];
  console.log(`✓ ${protocol.name} ${current ? 'listing extended' : 'listed'} on Arkiv by ${owner}, for ${LIFETIME_DAYS} days.`);
  console.log(`  Entity: ${key}`);
  console.log(`  Search terms: ${entry.terms.join(', ')}`);
  console.log(`  Transaction: ${chain.blockExplorers.default.url}/tx/${result.txHash}`);
}

/** Foundry decrypts the keystore with its own password prompt, so no private key is ever kept in the environment. */
function keystoreKey(name: string): Hex {
  let out: string;
  try {
    out = execFileSync('cast', ['wallet', 'decrypt-keystore', name], { stdio: ['inherit', 'pipe', 'inherit'], encoding: 'utf8' });
  } catch {
    throw new Error(`Could not decrypt the Foundry keystore "${name}". Is Foundry installed, and does cast wallet list show it?`);
  }
  const key = /0x[0-9a-fA-F]{64}/.exec(out)?.[0];
  if (!key) throw new Error(`cast returned no key for the keystore "${name}".`);
  return key as Hex;
}
