#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createPublicClient as createArkivClient, createWalletClient as createArkivWallet, ExpirationTime, type CreateEntityParameters } from '@arkiv-network/sdk';
import { rabdi } from '@arkiv-network/sdk/chains';
import { and, eq } from '@arkiv-network/sdk/query';
import { DIGEST_KEY, discover, listing, LISTING, ManifestError, search, validateManifest } from '@web3mcp/evm';
import { createPublicClient, http, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet, sepolia } from 'viem/chains';

const USAGE = `Usage:
  web3mcp-publish validate <manifest.json>
  web3mcp-publish index <ens-name> --account <foundry-keystore-name>
  web3mcp-publish search <word>...`;
// Listings drop out of search unless the publisher runs index again within this time.
const LIFETIME_DAYS = 30;

const [command, arg, flag, keystore] = process.argv.slice(2);
const env = process.env;
const client = () => createPublicClient({ chain: env.WEB3MCP_CHAIN === 'mainnet' ? mainnet : sepolia, transport: http(env.WEB3MCP_RPC_URL || undefined) });
// Arkiv's testnet. An access key is optional; without one, requests use the rate-limited public endpoint.
const arkivChain = () => rabdi({ accessKey: env.WEB3MCP_ARKIV_KEY ?? '' });

try {
  if (command === 'validate' && arg) {
    const manifest = validateManifest(JSON.parse(await readFile(arg, 'utf8')));
    console.log(`✓ ${manifest.name}: ${manifest.tools.length} tools on chain ${manifest.chainId}`);
  } else if (command === 'index' && arg && flag === '--account' && keystore) {
    await index(arg, keystore);
  } else if (command === 'search' && arg) {
    // What an agent's search tool sees: listings on Arkiv that still match ENS.
    const ens = client();
    const found = await search(createArkivClient({ chain: arkivChain(), transport: http() }), ens, process.argv.slice(3), ens.chain.id);
    for (const r of found) console.log(`${r.ens}  matched ${r.matched.join(', ')}  listed by ${r.owner}\n  ${r.description}`);
    if (found.length === 0) console.log('No listed protocol matches.');
  } else {
    console.error(USAGE);
    process.exit(2);
  }
} catch (e) {
  // The Arkiv SDK reports "insufficient funds" and other RPC errors as a bare "Execution error"; the root cause says what to fix.
  let root: unknown = e;
  while (root instanceof Error && root.cause) root = root.cause;
  const details = (root as { details?: unknown }).details;
  console.error(e instanceof ManifestError ? e.message : e instanceof Error ? e.message : String(e));
  if (typeof details === 'string') console.error(`  ${details}`);
  process.exit(1);
}

/** List a published name on the Arkiv index, or keep its listing alive. Safe to run again at any time. */
async function index(name: string, keystore: string): Promise<void> {
  const ens = client();
  // ENS is the source of truth: list exactly what the name publishes, after the same checks a host runs.
  const protocol = await discover(ens, name);
  const digest = (await ens.getEnsText({ name: protocol.name, key: DIGEST_KEY }))?.toLowerCase() as Hex;

  const account = privateKeyToAccount(keystoreKey(keystore));
  const chain = arkivChain();
  const arkiv = createArkivClient({ chain, transport: http() });
  const wallet = createArkivWallet({ chain, transport: http(), account });

  // Only this wallet can change or extend its own listings; anyone else's listing of the name is theirs.
  const { entities } = await arkiv
    .select({ $key: true, digest: true })
    .where(and(eq('arkiv.schema', LISTING), eq('ens', protocol.name)))
    .ownedBy(account.address)
    .fetch();
  const current = entities.find((e) => (e.digest as { value?: unknown } | undefined)?.value === digest)?.$key;
  const expiration = ExpirationTime.fromDays(LIFETIME_DAYS);
  const entry = listing(protocol.manifest, digest);
  const creates: CreateEntityParameters[] = current ? [] : [{ schema: entry.schema, values: entry.values, expiration }];

  // One transaction: drop outdated listings, then extend the current one or write a new one.
  const result = await wallet.executeBatch({
    deletes: entities.filter((e) => e.$key !== current).map((e) => ({ entityKey: e.$key })),
    extensions: current ? [{ entityKey: current, expiration }] : [],
    creates,
  });

  const key = current ?? result.createdEntities[0];
  console.log(`✓ ${protocol.name} ${current ? 'listing extended' : 'listed'} on Arkiv by ${account.address}, for ${LIFETIME_DAYS} days.`);
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
