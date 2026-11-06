import { BaseError, createPublicClient, createWalletClient, custom, type Address, type EIP1193Provider, type Hex } from 'viem';
import { mainnet, sepolia } from 'viem/chains';

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

interface Approval {
  id: string;
  chainId: number;
  protocol: string;
  tool: string;
  account: Address;
  calls: { to: Address; data: Hex; value?: string; description: string }[];
  assetChanges: { token: Address; symbol?: string; change: string }[];
  trust: { alias: string; address: Address; trust: string }[];
  status: 'pending' | 'submitted' | 'rejected' | 'failed';
  hashes: Hex[];
  error?: string;
}

const app = document.getElementById('app')!;
const id = location.pathname.split('/').pop()!;
let approval: Approval;
let connected: Address | undefined;
let message = '';
let busy = false;
let sent = false;

// Builds elements with text nodes only, so manifest text can never become HTML.
function h(tag: string, props: Record<string, string> = {}, ...children: (Node | string | null | false | undefined)[]) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) el.setAttribute(key, value);
  for (const child of children) if (child) el.append(child);
  return el;
}

function button(label: string, onClick: () => void, kind = 'primary') {
  const el = h('button', { class: kind }, label) as HTMLButtonElement;
  el.disabled = busy;
  el.onclick = onClick;
  return el;
}

const chainOf = (chainId: number) => [sepolia, mainnet].find((c) => c.id === chainId);
const isRejection = (e: unknown) =>
  e instanceof BaseError ? !!e.walk((x) => (x as { code?: number }).code === 4001) : (e as { code?: number })?.code === 4001;
const messageOf = (e: unknown) => (e instanceof BaseError ? e.shortMessage : e instanceof Error ? e.message : String(e));

async function report(body: object) {
  const res = await fetch(`/api/approvals/${id}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.ok) approval = await res.json();
}

async function connect() {
  if (!window.ethereum) {
    message = 'No browser wallet found. Install MetaMask or Rabby, then reload this page.';
    return render();
  }
  const [address] = await createWalletClient({ transport: custom(window.ethereum) }).requestAddresses();
  connected = address;
  message =
    address.toLowerCase() === approval.account.toLowerCase()
      ? ''
      : `This request was checked for ${approval.account}. Switch your wallet to that account and connect again.`;
  render();
}

async function sign() {
  const chain = chainOf(approval.chainId);
  if (!chain || !window.ethereum || !connected) return;
  const wallet = createWalletClient({ account: connected, chain, transport: custom(window.ethereum) });
  const reader = createPublicClient({ chain, transport: custom(window.ethereum) });
  if ((await wallet.getChainId()) !== chain.id) await wallet.switchChain({ id: chain.id });
  const calls = approval.calls.map((c) => ({ to: c.to, data: c.data, value: c.value ? BigInt(c.value) : undefined }));

  // Ask for one prompt for all steps (EIP-5792). Only a wallet that refuses the request itself gets the fallback,
  // so a batch that was sent is never sent twice.
  let batch: string | undefined;
  try {
    batch = (await wallet.sendCalls({ calls })).id;
  } catch (e) {
    if (isRejection(e)) throw e;
  }
  const hashes: Hex[] = [];
  if (batch) {
    sent = true;
    const result = await wallet.waitForCallsStatus({ id: batch, timeout: 300_000 });
    hashes.push(...(result.receipts ?? []).map((r) => r.transactionHash));
    if (result.status !== 'success') throw new Error(`The wallet reports the transaction failed. ${hashes.join(' ')}`);
  } else {
    // This wallet can't batch: send one step at a time and wait for each, so later steps see earlier ones.
    for (const call of calls) {
      const hash = await wallet.sendTransaction(call);
      sent = true;
      hashes.push(hash);
      const receipt = await reader.waitForTransactionReceipt({ hash });
      if (receipt.status !== 'success') throw new Error(`Step ${hashes.length} reverted: ${hash}`);
    }
  }
  await report({ status: 'submitted', hashes });
}

async function act(action: () => Promise<void>) {
  busy = true;
  render();
  try {
    await action();
  } catch (e) {
    // Declining the connection prompt, or an error before anything was sent, can be retried.
    // Declining the transaction rejects the request; a failure after sending ends it.
    if (action === sign && sent) await report({ status: 'failed', error: messageOf(e) });
    else if (action === sign && isRejection(e)) await report({ status: 'rejected' });
    else message = isRejection(e) ? 'You declined the wallet request.' : messageOf(e);
  }
  busy = false;
  render();
}

function render() {
  const chain = chainOf(approval.chainId);
  const explorer = chain?.blockExplorers?.default.url;
  const nameOnly = approval.trust.filter((t) => t.trust !== 'owner-verified').map((t) => t.alias);
  const matches = connected?.toLowerCase() === approval.account.toLowerCase();

  const actions =
    approval.status === 'pending'
      ? h(
          'div',
          { class: 'actions' },
          matches ? button(busy ? 'Waiting for your wallet…' : 'Sign in wallet', () => act(sign)) : button('Connect wallet', () => act(connect)),
          button('Reject', () => act(() => report({ status: 'rejected' })), 'secondary'),
        )
      : approval.status === 'submitted'
        ? h(
            'div',
            { class: 'done' },
            h('p', {}, '✓ Signed and confirmed. You can go back to your agent.'),
            h('ul', {}, ...approval.hashes.map((hash) => h('li', {}, h('a', { href: `${explorer}/tx/${hash}`, target: '_blank', rel: 'noreferrer' }, hash)))),
          )
        : h('p', { class: 'warn' }, approval.status === 'rejected' ? 'You rejected this request. Nothing was sent.' : `Failed: ${approval.error ?? 'unknown error'}`);

  app.replaceChildren(
    h(
      'header',
      {},
      h('p', { class: 'eyebrow' }, 'Web3MCP · Review and sign'),
      h('h1', {}, approval.tool),
      h('p', { class: 'muted' }, `${approval.protocol} on ${chain?.name ?? `chain ${approval.chainId}`}`),
    ),
    h(
      'section',
      {},
      h('h2', {}, 'Contracts'),
      h(
        'ul',
        { class: 'contracts' },
        ...approval.trust.map((t) =>
          h(
            'li',
            {},
            h('span', { class: `badge ${t.trust}` }, t.trust === 'owner-verified' ? '✓ owner-verified' : '⚠ name-only'),
            h('span', {}, t.alias),
            h('code', {}, t.address),
          ),
        ),
      ),
      nameOnly.length > 0 &&
        h('p', { class: 'warn' }, `Only ${approval.protocol} vouches for ${nameOnly.join(', ')}. The contract owners haven't confirmed it.`),
    ),
    h('section', {}, h('h2', {}, 'Steps'), h('ol', {}, ...approval.calls.map((c) => h('li', {}, h('code', {}, c.description))))),
    h(
      'section',
      {},
      h('h2', {}, 'Your balance changes (simulated)'),
      approval.assetChanges.length > 0
        ? h(
            'ul',
            { class: 'changes' },
            ...approval.assetChanges.map((a) =>
              h('li', { class: a.change.startsWith('-') ? 'out' : 'in' }, `${a.change.startsWith('-') ? a.change : `+${a.change}`} ${a.symbol ?? a.token}`),
            ),
          )
        : h('p', { class: 'muted' }, 'No token balance changes.'),
    ),
    h('section', {}, h('h2', {}, 'Wallet'), h('p', {}, 'Checked for ', h('code', {}, approval.account))),
    approval.status === 'pending' && message ? h('p', { class: 'warn' }, message) : '',
    actions,
  );
}

fetch(`/api/approvals/${id}`)
  .then(async (res) => {
    if (!res.ok) throw new Error('This signing request no longer exists. Ask your agent to prepare it again.');
    approval = await res.json();
    render();
  })
  .catch((e) => app.replaceChildren(h('p', { class: 'warn' }, messageOf(e))));
