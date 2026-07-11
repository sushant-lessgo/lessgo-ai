import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  isApexProdHost,
  isAppProdHost,
  isAppPath,
  getApexToAppRedirect,
} from './appSplit';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('isApexProdHost / isAppProdHost', () => {
  it('matches exact apex hosts, port-stripped and case-insensitive', () => {
    expect(isApexProdHost('lessgo.ai')).toBe(true);
    expect(isApexProdHost('www.lessgo.ai')).toBe(true);
    expect(isApexProdHost('LESSGO.AI:443')).toBe(true);
  });

  it('does not treat localhost or vercel previews as apex', () => {
    expect(isApexProdHost('localhost:3000')).toBe(false);
    expect(isApexProdHost('lessgo-ai.vercel.app')).toBe(false);
    expect(isApexProdHost('app.lessgo.ai')).toBe(false);
    expect(isApexProdHost(null)).toBe(false);
  });

  it('matches only the exact app host', () => {
    expect(isAppProdHost('app.lessgo.ai')).toBe(true);
    expect(isAppProdHost('APP.LESSGO.AI:443')).toBe(true);
    expect(isAppProdHost('lessgo.ai')).toBe(false);
    expect(isAppProdHost('localhost:3000')).toBe(false);
    expect(isAppProdHost('lessgo-ai.vercel.app')).toBe(false);
  });
});

describe('isAppPath', () => {
  it('is true for app prefixes (exact and nested)', () => {
    expect(isAppPath('/dashboard')).toBe(true);
    expect(isAppPath('/edit/abc')).toBe(true);
    expect(isAppPath('/t/xyz')).toBe(true);
    expect(isAppPath('/sign-in')).toBe(true);
    expect(isAppPath('/sign-up/continue')).toBe(true);
  });

  it('is false for apex marketing paths', () => {
    expect(isAppPath('/')).toBe(false);
    expect(isAppPath('/privacy')).toBe(false);
    expect(isAppPath('/blog')).toBe(false);
    expect(isAppPath('/pricing')).toBe(false);
    expect(isAppPath('/p/foo')).toBe(false);
  });

  it('does not match a prefix as a substring of a longer segment', () => {
    expect(isAppPath('/edited')).toBe(false);
    expect(isAppPath('/terms')).toBe(false);
  });
});

describe('getApexToAppRedirect', () => {
  it('returns null when NEXT_PUBLIC_DASHBOARD_URL is unset', () => {
    vi.stubEnv('NEXT_PUBLIC_DASHBOARD_URL', '');
    expect(getApexToAppRedirect('lessgo.ai', '/dashboard')).toBe(null);
  });

  describe('with dashboard url set', () => {
    const set = () =>
      vi.stubEnv('NEXT_PUBLIC_DASHBOARD_URL', 'https://app.lessgo.ai');

    it('returns null for localhost', () => {
      set();
      expect(getApexToAppRedirect('localhost:3000', '/dashboard')).toBe(null);
    });

    it('returns null for apex marketing paths', () => {
      set();
      expect(getApexToAppRedirect('lessgo.ai', '/')).toBe(null);
      expect(getApexToAppRedirect('lessgo.ai', '/privacy')).toBe(null);
      expect(getApexToAppRedirect('lessgo.ai', '/blog')).toBe(null);
      expect(getApexToAppRedirect('lessgo.ai', '/pricing')).toBe(null);
    });

    it('returns app-host target for app paths on both apex hosts', () => {
      set();
      expect(getApexToAppRedirect('lessgo.ai', '/dashboard')).toBe(
        'https://app.lessgo.ai/dashboard',
      );
      expect(getApexToAppRedirect('lessgo.ai', '/edit/abc')).toBe(
        'https://app.lessgo.ai/edit/abc',
      );
      expect(getApexToAppRedirect('lessgo.ai', '/t/xyz')).toBe(
        'https://app.lessgo.ai/t/xyz',
      );
      expect(getApexToAppRedirect('lessgo.ai', '/sign-in')).toBe(
        'https://app.lessgo.ai/sign-in',
      );
      expect(getApexToAppRedirect('www.lessgo.ai', '/dashboard')).toBe(
        'https://app.lessgo.ai/dashboard',
      );
    });

    it('preserves the query string', () => {
      set();
      expect(
        getApexToAppRedirect('lessgo.ai', '/dashboard?tab=billing&x=1'),
      ).toBe('https://app.lessgo.ai/dashboard?tab=billing&x=1');
    });

    it('strips a trailing slash from the configured origin', () => {
      vi.stubEnv('NEXT_PUBLIC_DASHBOARD_URL', 'https://app.lessgo.ai/');
      expect(getApexToAppRedirect('lessgo.ai', '/dashboard')).toBe(
        'https://app.lessgo.ai/dashboard',
      );
    });
  });
});
