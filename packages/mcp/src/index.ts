#!/usr/bin/env node
import { createPublicClient as createArkivClient } from '@arkiv-network/sdk';
import { rabdi } from '@arkiv-network/sdk/chains';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createPublicClient, http } from 'viem';
import { mainnet, sepolia } from 'viem/chains';
import { createServer } from './server.js';

const env = process.env;
const chain = env.WEB3MCP_CHAIN === 'mainnet' ? mainnet : sepolia;
// An empty RPC URL falls back to the chain's public default.
const client = createPublicClient({ chain, transport: http(env.WEB3MCP_RPC_URL || undefined) });

await createServer({
  client,
  account: env.WEB3MCP_ACCOUNT || undefined,
  manifestDir: env.WEB3MCP_MANIFEST_DIR || undefined,
  // Arkiv's testnet. An access key is optional; without one, search uses the rate-limited public endpoint.
  arkiv: createArkivClient({ chain: rabdi({ accessKey: env.WEB3MCP_ARKIV_KEY ?? '' }), transport: http() }),
}).connect(new StdioServerTransport());
