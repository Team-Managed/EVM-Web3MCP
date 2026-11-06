import { request } from 'node:http';

/** A raw HTTP request, so tests can set Host and Origin the way a browser or an attacker would. */
export function send(
  url: string,
  { method = 'GET', host, origin, body }: { method?: string; host?: string; origin?: string; body?: unknown } = {},
): Promise<{ status: number; body: string }> {
  const target = new URL(url);
  return new Promise((resolve, reject) => {
    const req = request(
      target,
      {
        method,
        headers: {
          host: host ?? target.host,
          ...(origin ? { origin } : {}),
          ...(body ? { 'content-type': 'application/json' } : {}),
        },
      },
      (res) => {
        let text = '';
        res.on('data', (chunk) => (text += chunk));
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body: text }));
      },
    );
    req.on('error', reject);
    req.end(body ? JSON.stringify(body) : undefined);
  });
}
