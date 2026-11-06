import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { PreparedWrite, Protocol } from '@web3mcp/evm';

export type ApprovalStatus = 'pending' | 'submitted' | 'rejected' | 'failed';

/** A prepared write waiting for the user to sign it in their own wallet, on the local signing page. */
export interface Approval {
  id: string;
  chainId: number;
  protocol: string;
  tool: string;
  account: `0x${string}`;
  calls: { to: `0x${string}`; data: `0x${string}`; value?: string; description: string }[];
  assetChanges: PreparedWrite['assetChanges'];
  trust: { alias: string; address: string; trust: string }[];
  status: ApprovalStatus;
  hashes: `0x${string}`[];
  error?: string;
}

const HASH = /^0x[0-9a-fA-F]{64}$/;
const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Web3MCP · Sign</title>
<link rel="stylesheet" href="/page.css">
</head>
<body><main id="app"><p>Loading…</p></main><script type="module" src="/page.js"></script></body>
</html>`;

/**
 * Serves the signing page on 127.0.0.1 only. The agent never signs: it creates an approval, the user's wallet
 * signs it in the browser, and the page reports the transaction hashes back here.
 */
export class Approvals {
  private approvals = new Map<string, Approval>();
  private waiters = new Map<string, Set<() => void>>();
  private origin?: Promise<string>;
  private server?: Server;

  constructor(
    private open: (url: string) => void = openInBrowser,
    private assets = new URL('./approve/', import.meta.url),
  ) {}

  async create(prepared: PreparedWrite, protocol: Protocol, tool: string): Promise<{ id: string; url: string }> {
    const id = randomBytes(16).toString('hex');
    this.approvals.set(id, {
      id,
      chainId: protocol.manifest.chainId,
      protocol: protocol.name,
      tool,
      account: prepared.account,
      calls: prepared.calls.map((c) => ({ to: c.to, data: c.data, value: c.value?.toString(), description: c.description })),
      assetChanges: prepared.assetChanges,
      trust: Object.entries(protocol.contracts).map(([alias, c]) => ({ alias, address: c.address, trust: c.trust })),
      status: 'pending',
      hashes: [],
    });
    const url = `${await this.start()}/approve/${id}`;
    this.open(url);
    return { id, url };
  }

  get(id: string): Approval | undefined {
    return this.approvals.get(id);
  }

  /** Resolve once the approval leaves `pending`, or after `ms`, whichever comes first. */
  async wait(id: string, ms: number): Promise<Approval | undefined> {
    const approval = this.approvals.get(id);
    if (!approval || approval.status !== 'pending') return approval;
    await new Promise<void>((resolve) => {
      const set = this.waiters.get(id) ?? new Set();
      const done = () => {
        clearTimeout(timer);
        set.delete(done);
        resolve();
      };
      const timer = setTimeout(done, ms);
      set.add(done);
      this.waiters.set(id, set);
    });
    return this.approvals.get(id);
  }

  close(): void {
    this.server?.close();
  }

  private start(): Promise<string> {
    this.origin ??= new Promise((resolve, reject) => {
      const server = createServer((req, res) => this.handle(req, res).catch(() => send(res, 500, 'text/plain', 'Error')));
      server.on('error', reject);
      server.listen(0, '127.0.0.1', () => {
        const { port } = server.address() as { port: number };
        resolve(`http://127.0.0.1:${port}`);
      });
      server.unref(); // never keep the MCP server process alive on its own
      this.server = server;
    });
    return this.origin;
  }

  private async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const origin = await this.origin!;
    // Only answer requests addressed to this exact host and port, which blocks DNS rebinding attacks.
    if (req.headers.host !== new URL(origin).host) return send(res, 403, 'text/plain', 'Forbidden');
    const path = new URL(req.url ?? '/', origin).pathname;

    if (req.method === 'GET' && /^\/approve\/[0-9a-f]{32}$/.test(path)) return send(res, 200, 'text/html', PAGE);
    if (req.method === 'GET' && (path === '/page.js' || path === '/page.css')) {
      const type = path.endsWith('.js') ? 'text/javascript' : 'text/css';
      return send(res, 200, type, await readFile(new URL(`.${path}`, this.assets)));
    }

    const match = /^\/api\/approvals\/([0-9a-f]{32})$/.exec(path);
    const approval = match && this.approvals.get(match[1]);
    if (!approval) return send(res, 404, 'text/plain', 'Not found');
    if (req.method === 'GET') return send(res, 200, 'application/json', JSON.stringify(approval));

    // Writes must come from our own page: other websites can't send this Origin header.
    if (req.method !== 'POST' || req.headers.origin !== origin) return send(res, 403, 'text/plain', 'Forbidden');
    if (approval.status !== 'pending') return send(res, 409, 'text/plain', 'Already settled');
    const body = JSON.parse(await readBody(req)) as { status?: string; hashes?: unknown; error?: unknown };
    if (body.status === 'submitted') {
      const hashes = Array.isArray(body.hashes) ? body.hashes : [];
      if (hashes.length === 0 || !hashes.every((h) => typeof h === 'string' && HASH.test(h))) {
        return send(res, 400, 'text/plain', 'Bad transaction hashes');
      }
      approval.hashes = hashes as `0x${string}`[];
    } else if (body.status !== 'rejected' && body.status !== 'failed') {
      return send(res, 400, 'text/plain', 'Bad status');
    }
    approval.status = body.status;
    if (typeof body.error === 'string') approval.error = body.error.slice(0, 500);
    for (const done of this.waiters.get(approval.id) ?? []) done();
    return send(res, 200, 'application/json', JSON.stringify(approval));
  }
}

function send(res: ServerResponse, status: number, type: string, body: string | Buffer): void {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' }).end(body);
}

async function readBody(req: IncomingMessage): Promise<string> {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 10_000) throw new Error('Body too large');
  }
  return body;
}

function openInBrowser(url: string): void {
  const [command, args] =
    process.platform === 'darwin'
      ? ['open', [url]]
      : process.platform === 'win32'
        ? ['cmd', ['/c', 'start', '', url]]
        : ['xdg-open', [url]];
  // If no browser can be opened, the tool result still shows the URL to click.
  spawn(command, args, { stdio: 'ignore', detached: true }).on('error', () => {}).unref();
}
