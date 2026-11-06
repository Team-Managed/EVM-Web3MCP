import { Approvals } from '@web3mcp/mcp/approvals';
import { revalidatePublication, verifyPublication, type Publication, type PublicationClient } from './publication.js';

export interface PublicationSessionOptions {
  /** Independent CLI confirmation, in addition to all browser-wallet confirmations. */
  confirm: () => Promise<boolean>;
  onCreated?: (request: { id: string; url: string }) => void;
  timeoutMs?: number;
  approvals?: (beforeSign: () => Promise<void>) => Approvals;
}

/** Only invoked after a user explicitly requests live publication; never used by --dry-run. */
export async function runPublication(client: PublicationClient, publication: Publication, options: PublicationSessionOptions) {
  if (!await options.confirm()) return { status: 'cancelled', requestCreated: false };
  await revalidatePublication(client, publication);
  const deadline = Date.now() + (options.timeoutMs ?? 600_000);
  const beforeSign = async () => {
    if (Date.now() >= deadline) throw new Error('Request expired.');
    await revalidatePublication(client, publication);
    if (Date.now() >= deadline) throw new Error('Request expired during validation.');
  };
  const approvals = options.approvals?.(beforeSign) ?? new Approvals(undefined, undefined, beforeSign);
  try {
    const reviewProtocol = { ...publication.protocol, contracts: { ...publication.protocol.contracts,
      resolver: { address: publication.options.resolver, trust: 'name-only' as const, fingerprint: publication.snapshots[publication.options.resolver] } } };
    const request = await approvals.create(publication.prepared, reviewProtocol, 'publish_manifest', { sequential: true });
    options.onCreated?.(request);
    let outcome = approvals.get(request.id)!;
    while (outcome.status === 'pending' && Date.now() < deadline) {
      outcome = (await approvals.wait(request.id, Math.min(25_000, Math.max(1, deadline - Date.now()))))!;
    }
    const result = await verifyPublication(client, publication, outcome);
    return { ...result, requestId: request.id, requestStatus: outcome.status,
      ...(outcome.status === 'pending' ? { warning: 'Timed out. An in-flight wallet prompt may still submit; check wallet history before any new request.' } : {}) };
  } finally {
    approvals.close();
  }
}
