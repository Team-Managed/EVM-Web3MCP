/** Strict ISO input, interpreted at whole-second precision; never local time. */
export function parseDateInput(text: string): bigint {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?(Z|[+-]\d{2}:\d{2}))?$/.exec(text);
  const fail = () => { throw new Error('Expected a valid ISO date (YYYY-MM-DD) or date-time with explicit timezone, within uint64 Unix seconds.'); };
  if (!m || text !== text.trim()) return fail();
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const [hour, minute, second] = [Number(m[4] ?? 0), Number(m[5] ?? 0), Number(m[6] ?? 0)];
  if (year < 1 || month < 1 || month > 12 || day < 1 || hour > 23 || minute > 59 || second > 59) return fail();
  const d = new Date(0);
  d.setUTCFullYear(year, month - 1, day);
  d.setUTCHours(hour, minute, second, 0);
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return fail();
  let offset = 0;
  const zone = m[8];
  if (zone && zone !== 'Z') {
    const h = Number(zone.slice(1, 3)), min = Number(zone.slice(4, 6));
    if (h > 14 || min > 59 || (h === 14 && min !== 0) || zone === '-00:00') return fail();
    offset = (h * 60 + min) * 60 * (zone[0] === '+' ? 1 : -1);
  }
  const seconds = BigInt(d.getTime() / 1000 - offset);
  if (seconds < 0n || seconds > (1n << 64n) - 1n) return fail();
  return seconds;
}

export function formatDateInput(seconds: bigint): string {
  return `${new Date(Number(seconds) * 1000).toISOString().replace('.000Z', 'Z')} (UTC)`;
}
