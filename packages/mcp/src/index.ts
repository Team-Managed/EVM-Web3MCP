#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';

await createServer({ manifestDir: process.env.WEB3MCP_MANIFEST_DIR }).connect(new StdioServerTransport());
