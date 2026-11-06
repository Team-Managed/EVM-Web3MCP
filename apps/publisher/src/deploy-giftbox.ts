#!/usr/bin/env node
import { createInterface } from 'node:readline/promises';
import { createPublicClient, http, isHash, keccak256, type Hex } from 'viem';
import { sepolia } from 'viem/chains';
import { Approvals } from '@web3mcp/mcp/approvals';
import { DEPLOYMENT, prepareDeployment, verifyDeployment } from './deployment.js';
import { messageOf } from './message.js';

// Default is read-only. Only the user's --open command and typed confirmation
// may create a local request; the browser wallet is the sole broadcaster.
const args = process.argv.slice(2);
try {
  if (!(args.length === 0 || args.length === 1 && args[0] === '--open' || args.length === 2 && args[0] === '--verify' && isHash(args[1]))) {
    throw new Error('Usage: deploy-giftbox [--open | --verify <transaction hash>]');
  }
  if (args[0] === '--open' && !process.stdin.isTTY) throw new Error('--open requires an interactive terminal; default preparation is read-only.');
  const client = createPublicClient({ chain: sepolia, transport: http(process.env.WEB3MCP_RPC_URL || undefined) });
  if (args[0] === '--verify') {
    console.log(JSON.stringify(await verifyDeployment(client, args[1] as Hex), null, 2));
  } else {
    const plan = await prepareDeployment(client);
    console.log(JSON.stringify({ chainId: DEPLOYMENT.chainId, from: DEPLOYMENT.account, to: DEPLOYMENT.factory, value: '0',
      predictedAddress: plan.address, salt: DEPLOYMENT.salt, initCodeHash: plan.initCodeHash,
      usdc: DEPLOYMENT.usdc, root: DEPLOYMENT.root, gasEstimate: String(plan.estimate), gasLimit: String(plan.gas),
      walletBalanceWei: String(plan.balance), maxFeePerGasWei: String(plan.maxFeePerGas), simulation: 'success',
      calldataHash: keccak256(plan.data), calldataBytes: (plan.data.length - 2) / 2, signingRequestCreated: false }, null, 2));
    if (args[0] === '--open') {
      const terminal = createInterface({ input: process.stdin, output: process.stdout });
      let answer: string;
      try { answer = await terminal.question('Type deploy GiftBox to open ONE local review request. Nothing is sent until you sign in MetaMask: '); }
      finally { terminal.close(); }
      if (answer.trim() !== 'deploy GiftBox') { console.log('Cancelled; no request created.'); process.exit(0); }
      await prepareDeployment(client, plan.gas);
      const deadline = Date.now() + 600_000;
      const approvals = new Approvals(undefined, undefined, async () => {
        if (Date.now() >= deadline) throw new Error('Deployment request expired.');
        await prepareDeployment(client, plan.gas);
        if (Date.now() >= deadline) throw new Error('Deployment request expired during checks.');
      });
      try {
        const request = await approvals.createRequest(plan.prepared, { name: plan.prepared.protocol, chainId: DEPLOYMENT.chainId,
          contracts: [{ alias: 'create2_factory', address: DEPLOYMENT.factory, trust: 'name-only' }] }, 'deploy_giftbox');
        console.log(`Local review: ${request.url}\nRequest ID: ${request.id}\nConnect your expected MetaMask account on Sepolia; review the factory, zero value, data and gas before manually signing.`);
        let outcome = approvals.get(request.id)!;
        while (outcome.status === 'pending' && Date.now() < deadline) {
          outcome = (await approvals.wait(request.id, Math.min(25_000, Math.max(1, deadline - Date.now()))))!;
        }
        console.log(JSON.stringify({ requestId: request.id, status: outcome.status, hashes: outcome.hashes }));
        if (outcome.hashes.length === 1) console.log(JSON.stringify(await verifyDeployment(client, outcome.hashes[0]), null, 2));
        else if (outcome.status === 'pending') console.log('Timed out; inspect wallet history for any in-flight submission. Do not automatically retry.');
      } finally { approvals.close(); }
    }
  }
} catch (e) {
  console.error(messageOf(e));
  process.exitCode = 1;
}
