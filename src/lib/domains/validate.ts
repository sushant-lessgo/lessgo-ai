import { getDomain, parse as parseDomain } from 'tldts';
import { isLessgoAppHost } from './hosts';

const FQDN_REGEX = /^(?=.{1,253}$)(?!-)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

const RESERVED_SUFFIXES = ['vercel.app', 'now.sh', 'vercel-dns.com'];

export type DomainKind = 'apex' | 'subdomain';

export interface ValidatedDomain {
  input: string;
  registrable: string;
  kind: DomainKind;
}

export interface DomainValidationError {
  code:
    | 'empty'
    | 'too_long'
    | 'invalid_fqdn'
    | 'not_registrable'
    | 'reserved'
    | 'lessgo_app_host';
  message: string;
}

export function validateDomain(
  input: string
): { ok: true; value: ValidatedDomain } | { ok: false; error: DomainValidationError } {
  const raw = (input || '').trim().toLowerCase();
  if (!raw) return { ok: false, error: { code: 'empty', message: 'Domain is required' } };
  if (raw.length > 253) {
    return { ok: false, error: { code: 'too_long', message: 'Domain exceeds 253 chars' } };
  }
  if (!FQDN_REGEX.test(raw)) {
    return { ok: false, error: { code: 'invalid_fqdn', message: 'Not a valid domain name' } };
  }
  if (isLessgoAppHost(raw)) {
    return { ok: false, error: { code: 'lessgo_app_host', message: 'Cannot attach a Lessgo-owned domain' } };
  }
  if (RESERVED_SUFFIXES.some((s) => raw === s || raw.endsWith(`.${s}`))) {
    return { ok: false, error: { code: 'reserved', message: 'This domain is reserved' } };
  }
  const registrable = getDomain(raw);
  if (!registrable) {
    return { ok: false, error: { code: 'not_registrable', message: 'Not a registrable domain' } };
  }
  const parsed = parseDomain(raw);
  const kind: DomainKind = parsed.subdomain && parsed.subdomain.length > 0 ? 'subdomain' : 'apex';
  return { ok: true, value: { input: raw, registrable, kind } };
}

export function registrableApexOf(domain: string): string | null {
  return getDomain(domain.toLowerCase());
}
