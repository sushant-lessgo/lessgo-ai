import { Resolver } from 'dns/promises';
import { registrableApexOf } from './validate';

const PUBLIC_DNS_SERVERS = ['8.8.8.8', '1.1.1.1'];
const LOOKUP_TIMEOUT_MS = 5000;

export function ownershipTxtHost(domain: string): string | null {
  const apex = registrableApexOf(domain);
  if (!apex) return null;
  return `_lessgo-verify.${apex}`;
}

export function ownershipTxtValue(token: string): string {
  return `lessgo-verify=${token}`;
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('dns_timeout')), ms)),
  ]);
}

async function lookupTxtOnce(host: string): Promise<string[][]> {
  const resolver = new Resolver();
  resolver.setServers(PUBLIC_DNS_SERVERS);
  return await withTimeout(resolver.resolveTxt(host), LOOKUP_TIMEOUT_MS);
}

/**
 * Returns true if the expected TXT value is present at the ownership host.
 * Silently retries once on transient DNS errors.
 */
export async function verifyOwnershipTxt(
  domain: string,
  token: string
): Promise<{ ok: boolean; error?: string; foundValues?: string[] }> {
  const host = ownershipTxtHost(domain);
  if (!host) return { ok: false, error: 'invalid_domain' };
  const expected = ownershipTxtValue(token);

  let records: string[][] = [];
  try {
    records = await lookupTxtOnce(host);
  } catch (e: any) {
    const code = e?.code || e?.message || 'unknown';
    if (code === 'ENOTFOUND' || code === 'ETIMEOUT' || code === 'dns_timeout') {
      try {
        records = await lookupTxtOnce(host);
      } catch (e2: any) {
        return { ok: false, error: e2?.code || e2?.message || 'dns_error' };
      }
    } else {
      return { ok: false, error: code };
    }
  }

  const found = records.map((chunks) => chunks.join(''));
  const ok = found.some((v) => v === expected);
  return ok ? { ok: true, foundValues: found } : { ok: false, error: 'txt_mismatch', foundValues: found };
}
