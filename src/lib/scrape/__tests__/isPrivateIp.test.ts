// SSRF guard: the IP classifier must reject every loopback / private /
// link-local / ULA address (v4 + v6) and accept public addresses. This is the
// core of the scrape route's SSRF defense (see fetchSite.ts).

import { isPrivateIp } from '@/lib/scrape/ssrfGuard';

describe('isPrivateIp', () => {
  it('rejects IPv4 loopback / private / link-local ranges', () => {
    for (const ip of [
      '127.0.0.1',
      '10.0.0.5',
      '172.16.0.1',
      '172.31.255.255',
      '192.168.1.1',
      '169.254.169.254', // cloud metadata
      '100.64.0.1', // CGNAT
      '0.0.0.0',
      '224.0.0.1', // multicast
    ]) {
      expect(isPrivateIp(ip)).toBe(true);
    }
  });

  it('rejects IPv6 loopback / ULA / link-local / mapped', () => {
    for (const ip of ['::1', '::', 'fc00::1', 'fd12:3456::1', 'fe80::1', '::ffff:127.0.0.1']) {
      expect(isPrivateIp(ip)).toBe(true);
    }
  });

  it('accepts public addresses', () => {
    for (const ip of ['8.8.8.8', '1.1.1.1', '172.15.0.1', '172.32.0.1', '2606:4700:4700::1111']) {
      expect(isPrivateIp(ip)).toBe(false);
    }
  });
});
