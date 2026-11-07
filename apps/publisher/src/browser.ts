import { existsSync } from 'node:fs';
import { Approvals } from '@web3mcp/mcp/approvals';
import { custom, http, type Chain, type Hex } from 'viem';

type Forward = (args: { method: string; params?: unknown }) => Promise<unknown>;

// The plugin's bundle of this CLI sits in skills/web3mcp-build/scripts/, beside the MCP server's copy of the signing page.
const pluginPage = new URL('../../../server/approve/', import.meta.url);

/**
 * A transport that signs in the publisher's browser wallet. Every request goes to the chain's RPC, except
 * eth_sendTransaction: that opens the local signing page, and returns the hash once the wallet has sent it.
 * The Arkiv SDK runs unchanged around it, estimating gas before and waiting for the receipt after.
 */
export function browserTransport(
  chain: Chain,
  page: { protocol: string; title: string; description: string },
  approvals = localApprovals(),
  forward: Forward = http()({ chain }).request as Forward,
) {
  // For the wallet to add the network. The public RPC: an access key in the URL's path stays on this machine.
  const rpc = new URL(chain.rpcUrls.default.http[0]).origin;
  const { id, name, nativeCurrency, blockExplorers } = chain;
  const walletChain = { id, name, nativeCurrency, blockExplorers, rpcUrls: { default: { http: [rpc] } } };

  return custom(
    {
      async request({ method, params }) {
        if (method !== 'eth_sendTransaction') return forward({ method, params });
        const [tx] = params as [{ from: Hex; to: Hex; data: Hex; gas?: Hex; value?: Hex }];
        const request = await approvals.request({
          chainId: id,
          chain: walletChain,
          title: page.title,
          protocol: page.protocol,
          tool: 'index',
          account: tx.from,
          calls: [{ to: tx.to, data: tx.data, gas: decimal(tx.gas), value: decimal(tx.value), description: page.description, contract: 'Arkiv' }],
          assetChanges: [],
          trust: [],
        });
        console.log(`Sign it in your browser wallet: ${request.url}`);
        let approval = await approvals.wait(request.id, 60_000);
        while (approval?.status === 'pending') approval = await approvals.wait(request.id, 60_000);
        approvals.close();
        if (approval?.status === 'submitted') return approval.hashes[0];
        throw new Error(approval?.status === 'rejected' ? 'You rejected it in your wallet. Nothing was sent.' : `It wasn't sent: ${approval?.error ?? 'unknown error'}`);
      },
    },
    // A retry would open the signing page again.
    { retryCount: 0 },
  );
}

/** The local signing page, served from the plugin's copy when this CLI runs from the plugin's bundle. */
export function localApprovals(beforeSign?: (id: string) => Promise<void>) {
  return new Approvals(undefined, existsSync(pluginPage) ? pluginPage : undefined, beforeSign);
}

const decimal = (hex?: Hex) => (hex ? BigInt(hex).toString() : undefined);
