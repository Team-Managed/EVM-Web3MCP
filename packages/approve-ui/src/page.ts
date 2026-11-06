import {
  BaseError,
  createPublicClient,
  createWalletClient,
  custom,
  formatEther,
  type Address,
  type Chain,
  type EIP1193Provider,
  type Hex,
} from 'viem';
import { mainnet, sepolia } from 'viem/chains';

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

interface Call {
  to: Address;
  data: Hex;
  value?: string;
  gas?: string;
  description: string;
  kind?: 'approve' | 'call';
  contract?: string;
  method?: string;
  args?: { name: string; value: string; address?: Address }[];
}

interface Approval {
  id: string;
  chainId: number;
  protocol: string;
  tool: string;
  account: Address;
  calls: Call[];
  assetChanges: { token: Address; symbol?: string; change: string }[];
  trust: { alias: string; address: Address; trust: string }[];
  status: 'pending' | 'submitted' | 'rejected' | 'failed';
  hashes: Hex[];
  error?: string;
}

type StepState = 'idle' | 'wallet' | 'confirming' | 'done' | 'failed';

const app = document.getElementById('app')!;
const id = location.pathname.split('/').pop()!;
let approval: Approval;
let connected: Address | undefined;
let message = '';
let busy = false;
let sent = false;
let steps: { state: StepState; hash?: Hex }[] = [];

// Builds elements with text nodes only, so manifest text can never become HTML.
function h(tag: string, props: Record<string, string> = {}, ...children: (Node | string | null | false | undefined)[]) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) el.setAttribute(key, value);
  for (const child of children) if (child) el.append(child);
  return el;
}

function button(label: string, onClick: () => void, kind = 'primary') {
  const el = h('button', { class: kind, type: 'button' }, label) as HTMLButtonElement;
  el.disabled = busy;
  el.onclick = onClick;
  return el;
}

const chainOf = (chainId: number): Chain | undefined => [sepolia, mainnet].find((c) => c.id === chainId);
const isRejection = (e: unknown) =>
  e instanceof BaseError ? !!e.walk((x) => (x as { code?: number }).code === 4001) : (e as { code?: number })?.code === 4001;
const messageOf = (e: unknown) => (e instanceof BaseError ? e.shortMessage : e instanceof Error ? e.message : String(e));
const short = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`;
const same = (a?: string, b?: string) => !!a && !!b && a.toLowerCase() === b.toLowerCase();

function amount(text: string) {
  const n = Math.abs(Number(text));
  return n >= 1 ? n.toLocaleString('en-US', { maximumFractionDigits: 4 }) : n.toLocaleString('en-US', { maximumSignificantDigits: 4 });
}

// "swapUsdcToEth" → "Swap USDC to ETH", with token symbols this request moves in capitals.
function words(name: string) {
  const symbols = new Set(['eth', ...approval.assetChanges.map((a) => a.symbol?.toLowerCase() ?? '')]);
  const text = name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .toLowerCase()
    .split(' ')
    .map((w) => (symbols.has(w) ? w.toUpperCase() : w))
    .join(' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function title() {
  const outs = approval.assetChanges.filter((a) => a.change.startsWith('-'));
  const ins = approval.assetChanges.filter((a) => !a.change.startsWith('-'));
  const of = (a: Approval['assetChanges'][number]) => `${amount(a.change)} ${a.symbol ?? short(a.token)}`;
  if (outs.length === 1 && ins.length === 1) return `Swap ${of(outs[0])} for ${of(ins[0])}`;
  const namespace = `${approval.protocol.split('.')[0].replaceAll('-', '_')}_`;
  const tool = approval.tool.replace(/^tx_/, '');
  return tool === approval.tool ? tool : words(tool.startsWith(namespace) ? tool.slice(namespace.length) : tool);
}

function stepTitle(call: Call) {
  if (call.kind === 'approve' && call.args) return `Allow ${call.args[0].value} to use ${call.args[1].value}`;
  return call.method ? words(call.method) : call.description;
}

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
  message = same(address, approval.account)
    ? ''
    : `Your agent checked this for ${short(approval.account)}, but your wallet is on ${short(address)}. Switch accounts in your wallet, then connect again.`;
  render();
}

function mark(i: number, state: StepState, hash?: Hex) {
  steps[i] = { state, hash: hash ?? steps[i].hash };
  render();
}

async function sign() {
  const chain = chainOf(approval.chainId);
  if (!chain || !window.ethereum || !connected) return;
  const wallet = createWalletClient({ account: connected, chain, transport: custom(window.ethereum) });
  const reader = createPublicClient({ chain, transport: custom(window.ethereum) });
  if ((await wallet.getChainId()) !== chain.id) await wallet.switchChain({ id: chain.id });
  const calls = approval.calls.map((c) => ({
    to: c.to,
    data: c.data,
    value: c.value ? BigInt(c.value) : undefined,
    gas: c.gas ? BigInt(c.gas) : undefined,
  }));

  // One prompt for all steps (EIP-5792), but only when the wallet can already batch: asking a plain MetaMask
  // account would push it to upgrade to a smart account first. Only a wallet that refuses the request itself
  // gets the fallback, so a batch that was sent is never sent twice.
  const atomic = await wallet
    .getCapabilities({ chainId: chain.id })
    .then((c) => c.atomic?.status)
    .catch(() => undefined);
  let batch: string | undefined;
  if (calls.length > 1 && atomic === 'supported') {
    calls.forEach((_, i) => mark(i, 'wallet'));
    try {
      batch = (await wallet.sendCalls({ calls: calls.map(({ gas, ...call }) => call) })).id;
    } catch (e) {
      if (isRejection(e)) throw e;
      calls.forEach((_, i) => mark(i, 'idle'));
    }
  }
  const hashes: Hex[] = [];
  if (batch) {
    sent = true;
    calls.forEach((_, i) => mark(i, 'confirming'));
    const result = await wallet.waitForCallsStatus({ id: batch, timeout: 300_000 });
    (result.receipts ?? []).forEach((r, i) => {
      hashes.push(r.transactionHash);
      mark(i, r.status === 'success' ? 'done' : 'failed', r.transactionHash);
    });
    if (result.status !== 'success') throw new Error(`The wallet reports the transaction failed. ${hashes.join(' ')}`);
  } else {
    // This wallet can't batch: send one step at a time and wait for each, so later steps see earlier ones.
    for (const [i, call] of calls.entries()) {
      mark(i, 'wallet');
      const hash = await wallet.sendTransaction(call);
      sent = true;
      hashes.push(hash);
      mark(i, 'confirming', hash);
      const receipt = await reader.waitForTransactionReceipt({ hash });
      mark(i, receipt.status === 'success' ? 'done' : 'failed');
      if (receipt.status !== 'success') throw new Error(`Step ${i + 1} reverted on chain.`);
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
    steps = steps.map((s) => (s.state === 'wallet' || s.state === 'confirming' ? { ...s, state: sent ? 'failed' : 'idle' } : s));
    if (action === sign && sent) await report({ status: 'failed', error: messageOf(e) });
    else if (action === sign && isRejection(e)) await report({ status: 'rejected' });
    else message = isRejection(e) ? 'You declined the wallet request.' : messageOf(e);
  }
  busy = false;
  render();
}

const STATUS: Record<StepState, string> = {
  idle: '',
  wallet: 'Confirm this in your wallet',
  confirming: 'Confirming on chain',
  done: 'Confirmed',
  failed: 'Failed',
};

function walletNode() {
  const signed = approval.status === 'submitted';
  const matches = same(connected, approval.account);
  const state = signed
    ? 'Signed'
    : !connected
      ? 'Not connected yet'
      : matches
        ? 'Connected'
        : `Connected as ${short(connected)}, a different wallet`;
  return h(
    'li',
    { class: `node start ${matches || signed ? 'ready' : ''}` },
    h('span', { class: 'marker', 'aria-hidden': 'true' }),
    h(
      'div',
      { class: 'body' },
      h('p', { class: 'step-title' }, 'Your wallet'),
      h('p', { class: 'mono' }, approval.account),
      h('p', { class: `muted ${connected && !matches ? 'attention' : ''}` }, state),
    ),
  );
}

function stepNode(call: Call, i: number, explorer?: string) {
  const { state, hash } = steps[i];
  const trust = approval.trust.find((t) => same(t.address, call.to));
  const value = call.value && BigInt(call.value) > 0n ? formatEther(BigInt(call.value)) : undefined;
  return h(
    'li',
    { class: `node step ${state}`, 'aria-current': state === 'wallet' || state === 'confirming' ? 'step' : 'false' },
    h('span', { class: 'marker', 'aria-hidden': 'true' }, state === 'done' ? '✓' : state === 'failed' ? '✕' : String(i + 1)),
    h(
      'div',
      { class: 'body' },
      h('p', { class: 'step-title' }, stepTitle(call)),
      h(
        'p',
        { class: 'where' },
        call.contract ? `on ${call.contract} ` : 'on ',
        h('a', { class: 'mono', href: `${explorer}/address/${call.to}`, target: '_blank', rel: 'noreferrer', title: call.to }, short(call.to)),
        trust &&
          h(
            'span',
            { class: `pill ${trust.trust}` },
            trust.trust === 'owner-verified' ? '✓ Confirmed by its ENS name' : `Listed by ${approval.protocol} only`,
          ),
      ),
      call.kind === 'approve' && h('p', { class: 'muted' }, 'An allowance only. No tokens move in this step.'),
      value && h('p', { class: 'sends' }, `Sends ${value} ETH from your wallet`),
      !!call.args?.length &&
        h(
          'dl',
          { class: 'args' },
          ...call.args.flatMap((a) => [
            h('dt', {}, words(a.name)),
            h('dd', {}, a.value, a.address && a.value !== a.address ? h('span', { class: 'mono addr' }, a.address) : null),
          ]),
        ),
      trust?.trust === 'name-only' &&
        h(
          'p',
          { class: 'callout' },
          `Only ${approval.protocol} vouches for this contract. Check that ${short(call.to)} is the ${call.contract ?? 'contract'} you expect before you sign.`,
        ),
      state !== 'idle' &&
        h(
          'p',
          { class: `status ${state}` },
          STATUS[state],
          hash && explorer ? h('a', { href: `${explorer}/tx/${hash}`, target: '_blank', rel: 'noreferrer' }, 'View transaction') : null,
        ),
    ),
  );
}

function resultNode() {
  return h(
    'li',
    { class: `node end ${approval.status === 'submitted' ? 'ready' : ''}` },
    h('span', { class: 'marker', 'aria-hidden': 'true' }),
    h(
      'div',
      { class: 'body' },
      h('p', { class: 'step-title' }, 'Your balance after'),
      approval.assetChanges.length > 0
        ? h(
            'ul',
            { class: 'changes' },
            ...approval.assetChanges.map((a) => {
              const out = a.change.startsWith('-');
              return h('li', { class: out ? 'out' : 'in', title: a.change }, `${out ? '−' : '+'}${amount(a.change)} ${a.symbol ?? short(a.token)}`);
            }),
          )
        : h('p', { class: 'muted' }, 'No token balances change.'),
      h('p', { class: 'muted small' }, 'Simulated just before this page opened. Final amounts can differ slightly.'),
    ),
  );
}

function footer() {
  if (approval.status === 'submitted') return h('p', { class: 'banner done', role: 'status' }, 'Signed and confirmed. You can go back to your agent.');
  if (approval.status === 'rejected') return h('p', { class: 'banner', role: 'status' }, 'You rejected this request. Nothing was sent.');
  if (approval.status === 'failed') return h('p', { class: 'banner failed', role: 'alert' }, `This didn't go through: ${approval.error ?? 'unknown error'}`);
  const matches = same(connected, approval.account);
  const count = approval.calls.length;
  const waiting = steps.some((s) => s.state === 'confirming') ? 'Confirming on chain…' : 'Waiting for your wallet…';
  return h(
    'div',
    { class: 'actions' },
    message && h('p', { class: 'callout', role: 'alert' }, message),
    h(
      'div',
      { class: 'buttons' },
      matches
        ? button(busy ? waiting : count > 1 ? `Sign ${count} transactions` : 'Sign transaction', () => act(sign))
        : button(busy ? 'Waiting for your wallet…' : 'Connect wallet', () => act(connect)),
      button('Reject', () => act(() => report({ status: 'rejected' })), 'secondary'),
    ),
  );
}

function details(explorer?: string) {
  return h(
    'details',
    { class: 'tech' },
    h('summary', {}, 'Technical details'),
    h('p', { class: 'muted' }, `Chain ${approval.chainId}. Request ${approval.id}. Tool ${approval.tool}.`),
    ...approval.calls.map((c, i) =>
      h(
        'div',
        { class: 'raw' },
        h('p', {}, `Step ${i + 1}: `, h('code', {}, c.description)),
        h('p', {}, 'To ', h('a', { class: 'mono', href: `${explorer}/address/${c.to}`, target: '_blank', rel: 'noreferrer' }, c.to)),
        c.value && h('p', {}, `Value ${c.value} wei`),
        c.gas && h('p', {}, `Gas limit ${c.gas}`),
        h('pre', {}, c.data),
      ),
    ),
  );
}

function render() {
  const chain = chainOf(approval.chainId);
  const explorer = chain?.blockExplorers?.default.url;
  app.replaceChildren(
    h(
      'header',
      {},
      h('p', { class: 'from' }, 'Your agent prepared this on ', h('strong', {}, approval.protocol)),
      h('h1', {}, title()),
      h('p', { class: 'muted' }, `${chain?.name ?? `Chain ${approval.chainId}`}. Nothing happens until you sign in your own wallet.`),
    ),
    h(
      'section',
      { 'aria-labelledby': 'flow-title' },
      h('h2', { id: 'flow-title' }, 'What happens when you sign'),
      h('ol', { class: 'flow' }, walletNode(), ...approval.calls.map((c, i) => stepNode(c, i, explorer)), resultNode()),
    ),
    footer(),
    details(explorer),
  );
}

fetch(`/api/approvals/${id}`)
  .then(async (res) => {
    if (!res.ok) throw new Error('This signing request no longer exists. Ask your agent to prepare it again.');
    approval = await res.json();
    const signed = approval.status === 'submitted' && approval.hashes.length === approval.calls.length;
    steps = approval.calls.map((_, i) => (signed ? { state: 'done', hash: approval.hashes[i] } : { state: 'idle' }));
    render();
  })
  .catch((e) => app.replaceChildren(h('p', { class: 'banner failed' }, messageOf(e))));
