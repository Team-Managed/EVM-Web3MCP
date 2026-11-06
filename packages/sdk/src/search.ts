import type { CreateEntityParameters, PublicArkivClient } from '@arkiv-network/sdk';
import { and, eq, exists, or } from '@arkiv-network/sdk/query';
import { bool, bytes, defineSchema, str, u64 } from '@arkiv-network/sdk/schema';
import { hexToString, stringToBytes, type Hex } from 'viem';
import { normalize } from 'viem/ens';
import type { ChainClient } from './client.js';
import { DIGEST_KEY } from './discover.js';
import type { Manifest } from './manifest.js';

/** The schema tag on every Web3MCP listing entity on Arkiv. */
export const LISTING = 'web3mcp.listing';
// An Arkiv entity holds at most 32 attributes: the schema tag, the four columns, and one per search term.
const MAX_TERMS = 27;
const MAX_QUERY_TERMS = 10;
// Listings checked against ENS per search. Spam beyond this can crowd real names out of a search, never into discover.
const MAX_CHECKED = 20;
const STOPWORDS = new Set(
  'to of in on at by as is it or be do my me we an the and for with from into that this are its your you when than more less below above about right now first set all any per how much has have was not can get'.split(' '),
);

/** A protocol found by search. Its description is the publisher's untrusted text. */
export interface SearchResult {
  ens: string;
  description: string;
  /** The search terms the listing matched. */
  matched: string[];
  /** The wallet that wrote the listing on Arkiv. */
  owner: Hex;
}

/** The part of an Arkiv public client that search uses. Tests pass a fake. */
export type ArkivReader = Pick<PublicArkivClient, 'select'>;

const words = (text: string) => text.split(/[^A-Za-z0-9]+/);

/** A word as the index stores it: lowercase letters and digits, with a plural "s" dropped so "swaps" finds "swap". */
function term(word: string): string | undefined {
  const w = word.toLowerCase();
  if (!/^[a-z0-9]{2,30}$/.test(w) || /^\d+$/.test(w) || STOPWORDS.has(w)) return undefined;
  return w.length > 4 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w;
}

const terms = (list: string[]) => [...new Set(list.map(term).filter((t): t is string => t !== undefined))];

/** The words a manifest is found by: its keywords first, then words from its tool names, contracts and descriptions. */
export function searchTerms(manifest: Manifest): string[] {
  const derived = [
    ...manifest.tools.flatMap((t) => words(t.name)),
    ...Object.keys(manifest.contracts).flatMap(words),
    ...manifest.tools.flatMap((t) => (t.kind === 'read' && t.output?.symbol ? words(t.output.symbol) : [])),
    ...words(manifest.description ?? ''),
    ...manifest.tools.flatMap((t) => words(t.description)),
  ].filter((w) => w.length >= 3);
  return terms([...(manifest.keywords ?? []), ...derived]).slice(0, MAX_TERMS);
}

/**
 * The Arkiv entity that lists a manifest for search, as its publisher writes it. Each search term is an
 * indexed attribute (`t.swap`), so Arkiv itself finds the listings that match a search.
 * `digest` is the name's org.web3mcp.digest record, so hosts can drop listings that no longer match ENS.
 */
export function listing(manifest: Manifest, digest: Hex): Pick<CreateEntityParameters, 'schema' | 'values'> & { terms: string[] } {
  const found = searchTerms(manifest);
  const flags = Object.fromEntries(found.map((t) => [`t.${t}`, true]));
  const schema = defineSchema(LISTING, {
    ens: str().indexed(),
    chainId: u64().indexed(),
    digest: str().indexed(),
    // Up to 200 characters, more than a str's 128 bytes.
    about: bytes(),
    ...Object.fromEntries(found.map((t) => [`t.${t}`, bool().indexed()])),
  });
  const about = manifest.description ?? `Tools: ${manifest.tools.map((t) => t.name).join(', ')}`.slice(0, 200);
  const values = { ens: manifest.name, chainId: u64(BigInt(manifest.chainId)), digest, about: stringToBytes(about), ...flags };
  return { schema, values, terms: found };
}

const value = (v: unknown, type: string): unknown => {
  const typed = v as { type?: unknown; value?: unknown } | undefined;
  return typed?.type === type ? typed.value : undefined;
};

/**
 * Find protocols on `chainId` by words for what the user wants to do. Arkiv returns the listings that share a
 * term, ranked here by how many they share. Anyone can write a listing, so only those whose digest still
 * matches the name's ENS record are kept; the agent must still discover a name before using it.
 */
export async function search(arkiv: ArkivReader, client: ChainClient, query: string[], chainId: number, limit = 5): Promise<SearchResult[]> {
  const wanted = terms(query.flatMap(words)).slice(0, MAX_QUERY_TERMS);
  if (wanted.length === 0) return [];
  const selection = { $owner: true, ens: true, digest: true, about: true, ...Object.fromEntries(wanted.map((t) => [`t.${t}`, true])) };
  const { entities } = await arkiv
    .select(selection)
    .where(and(eq('arkiv.schema', LISTING), eq('chainId', u64(BigInt(chainId))), or(...wanted.map((t) => exists(`t.${t}`)))))
    // shortcut: ranks the first 100 matches; page by $key once the index outgrows one page.
    .limit(100)
    .fetch();

  const candidates: (SearchResult & { digest: string })[] = [];
  for (const row of entities as Record<string, unknown>[]) {
    const ens = value(row.ens, 'str');
    const digest = value(row.digest, 'str');
    const about = value(row.about, 'bytes');
    if (typeof ens !== 'string' || typeof digest !== 'string') continue;
    let name: string;
    try {
      name = normalize(ens);
    } catch {
      continue;
    }
    // Anyone can write this text: one line, so the host's "untrusted" label stays next to all of it.
    const description = typeof about === 'string' ? hexToString(about as Hex).replace(/\s+/g, ' ').trim().slice(0, 200) : '';
    candidates.push({ ens: name, digest, description, owner: row.$owner as Hex, matched: wanted.filter((t) => row[`t.${t}`] !== undefined) });
  }
  candidates.sort((a, b) => b.matched.length - a.matched.length);

  const names = [...new Set(candidates.map((c) => c.ens))].slice(0, MAX_CHECKED);
  const published = new Map(
    await Promise.all(names.map(async (n) => [n, await client.getEnsText({ name: n, key: DIGEST_KEY }).catch(() => null)] as const)),
  );
  const results: SearchResult[] = [];
  for (const { digest, ...c } of candidates) {
    if (results.length === limit) break;
    if (results.some((r) => r.ens === c.ens) || published.get(c.ens)?.toLowerCase() !== digest.toLowerCase()) continue;
    results.push(c);
  }
  return results;
}
