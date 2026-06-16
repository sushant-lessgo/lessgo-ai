// Pure SSRF address helpers — no 'server-only', so they're unit-testable.
// Used by fetchSite.ts (the actual fetcher) to validate every resolved IP.

import net from 'node:net';

/** Strip IPv6 brackets that URL.hostname keeps (e.g. "[::1]"). */
export function bareHost(hostname: string): string {
  return hostname.replace(/^\[|\]$/g, '').toLowerCase();
}

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return true; // malformed -> treat as unsafe
  }
  const [a, b] = parts;
  if (a === 0 || a === 127) return true; // this-host / loopback
  if (a === 10) return true; // private
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  if (a === 169 && b === 254) return true; // link-local / cloud metadata
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a >= 224) return true; // multicast / reserved
  return false;
}

/** True for loopback / private / link-local / ULA / unspecified IPs (v4 + v6). */
export function isPrivateIp(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) return isPrivateIpv4(ip);
  if (family === 6) {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '::') return true;
    // IPv4-mapped (::ffff:a.b.c.d) — validate the embedded v4 address.
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateIpv4(mapped[1]);
    const head = lower.split(':')[0];
    const block = parseInt(head || '0', 16);
    // fc00::/7 (ULA) -> fc/fd ; fe80::/10 (link-local)
    if ((block & 0xfe00) === 0xfc00) return true;
    if ((block & 0xffc0) === 0xfe80) return true;
    return false;
  }
  return false;
}
