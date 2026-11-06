import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { serverOptions } from '../scripts/config.ts';

const launcher = fileURLToPath(new URL('../scripts/serve.ts', import.meta.url));

test('default and explicit fixture options stay offline despite live settings', async () => {
  const defaults = await serverOptions({});
  assert.deepEqual(await serverOptions({
    WEB3MCP_MODE: 'fixture', WEB3MCP_RPC_URL: 'invalid', WEB3MCP_ACCOUNT: 'invalid',
    WEB3MCP_CHAIN: 'mainnet', WEB3MCP_MANIFEST_DIR: 'ignored',
  }), defaults);
  assert.deepEqual(Object.keys(defaults), ['manifestDir']);
  assert.equal(defaults.manifestDir, fileURLToPath(new URL('../../../spec/fixtures/valid/', import.meta.url)));
});

test('invalid modes and live configuration fail clearly without echoing values', async () => {
  for (const mode of ['', 'LIVE', 'unknown']) {
    await assert.rejects(serverOptions({ WEB3MCP_MODE: mode }), /WEB3MCP_MODE must be fixture or live/);
  }
  await assert.rejects(serverOptions({ WEB3MCP_MODE: 'live', WEB3MCP_CHAIN: 'mainnet' }), /Sepolia only/);
  for (const url of ['invalid', 'ws://localhost', 'https:example.com', ' https://example.com']) {
    await assert.rejects(serverOptions({ WEB3MCP_MODE: 'live', WEB3MCP_RPC_URL: url }), /WEB3MCP_RPC_URL must/);
  }
  await assert.rejects(serverOptions({ WEB3MCP_MODE: 'live', WEB3MCP_ACCOUNT: 'invalid' }), /public wallet address or normalized ENS name/);
  const result = spawnSync(process.execPath, [launcher], {
    env: { ...process.env, WEB3MCP_MODE: 'unknown-sensitive-value' }, encoding: 'utf8',
  });
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /WEB3MCP_MODE must be fixture or live/);
  assert.doesNotMatch(result.stderr, /unknown-sensitive-value/);
});

test('live options use Sepolia defaults, preserve optional account, and omit manifestDir', async () => {
  for (const account of [undefined, '', 'example.eth', '0x00000000000000000000000000000000000000aa']) {
    const options = await serverOptions({ WEB3MCP_MODE: 'live', WEB3MCP_ACCOUNT: account, WEB3MCP_RPC_URL: '' });
    assert.equal(options.client?.chain?.id, 11155111);
    assert.equal(options.account, account || undefined);
    assert.equal('manifestDir' in options, false);
    assert.equal(typeof options.client?.simulateCalls, 'function');
  }
});

test('live stdio uses supplied RPC and never falls back to an existing fixture', async () => {
  const methods: string[] = [];
  const rpc = createServer(async (request, response) => {
    let body = '';
    for await (const chunk of request) body += chunk;
    const payload = JSON.parse(body);
    methods.push(payload.method);
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify({ jsonrpc: '2.0', id: payload.id,
      error: { code: -32601, message: 'Controlled RPC rejection' } }));
  });
  await new Promise<void>((resolve) => rpc.listen(0, '127.0.0.1', resolve));
  const address = rpc.address();
  assert.ok(address && typeof address !== 'string');
  const client = new Client({ name: 'live-wiring-check', version: '0.0.1' });
  const transport = new StdioClientTransport({
    command: process.execPath, args: [launcher],
    env: { ...process.env, WEB3MCP_MODE: 'live', WEB3MCP_CHAIN: 'sepolia',
      WEB3MCP_ACCOUNT: '', WEB3MCP_RPC_URL: `http://127.0.0.1:${address.port}`,
      WEB3MCP_MANIFEST_DIR: fileURLToPath(new URL('../../../spec/fixtures/valid/', import.meta.url)) } as Record<string, string>,
  });
  try {
    await client.connect(transport);
    const result = await client.callTool({ name: 'discover', arguments: { name: 'vault.web3mcp-demo.eth' } });
    assert.equal(result.isError, true);
    assert.ok(methods.includes('eth_call'), 'ENS must query the controlled RPC');
    assert.deepEqual((await client.listTools()).tools.map((tool) => tool.name).sort(), ['call', 'discover', 'read', 'status', 'wallet']);
  } finally {
    await client.close();
    await new Promise<void>((resolve, reject) => rpc.close((error) => error ? reject(error) : resolve()));
  }
});
