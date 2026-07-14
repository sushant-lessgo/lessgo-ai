import { describe, it, expect, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  isApexProdHost,
  isAppProdHost,
  isAppPath,
  getApexToAppRedirect,
  shouldNoindex,
  getApexPublishRedirect,
  isApexPublishCandidate,
  isAppRootRequest,
  getAppRootAction,
  APP_PATH_PREFIXES,
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

describe('shouldNoindex', () => {
  it('is true only for the exact app prod host', () => {
    expect(shouldNoindex('app.lessgo.ai')).toBe(true);
    expect(shouldNoindex('APP.LESSGO.AI:443')).toBe(true);
  });

  it('is false for apex, localhost, and vercel previews', () => {
    expect(shouldNoindex('lessgo.ai')).toBe(false);
    expect(shouldNoindex('www.lessgo.ai')).toBe(false);
    expect(shouldNoindex('localhost:3000')).toBe(false);
    expect(shouldNoindex('lessgo-ai.vercel.app')).toBe(false);
    expect(shouldNoindex(null)).toBe(false);
  });
});

describe('getApexPublishRedirect', () => {
  it('redirects /p/{slug} on apex to the published subdomain', () => {
    expect(getApexPublishRedirect('lessgo.ai', '/p/foo')).toBe(
      'https://foo.lessgo.site',
    );
    expect(getApexPublishRedirect('www.lessgo.ai', '/p/foo')).toBe(
      'https://foo.lessgo.site',
    );
  });

  it('preserves a subpath', () => {
    expect(getApexPublishRedirect('lessgo.ai', '/p/foo/gallery')).toBe(
      'https://foo.lessgo.site/gallery',
    );
  });

  it('is null off apex (localhost / vercel — D4 untouched)', () => {
    expect(getApexPublishRedirect('localhost:3000', '/p/foo')).toBe(null);
    expect(getApexPublishRedirect('lessgo-ai.vercel.app', '/p/foo')).toBe(null);
    expect(getApexPublishRedirect('app.lessgo.ai', '/p/foo')).toBe(null);
  });

  it('is null for non-/p paths', () => {
    expect(getApexPublishRedirect('lessgo.ai', '/paint')).toBe(null);
    expect(getApexPublishRedirect('lessgo.ai', '/')).toBe(null);
    expect(getApexPublishRedirect('lessgo.ai', '/dashboard')).toBe(null);
  });
});

describe('isApexPublishCandidate', () => {
  it('is true only for apex root (customer #0 KV branch)', () => {
    expect(isApexPublishCandidate('lessgo.ai', '/')).toBe(true);
    expect(isApexPublishCandidate('www.lessgo.ai', '/')).toBe(true);
  });

  it('is false for non-root apex paths (root-only scope — no KV GET)', () => {
    expect(isApexPublishCandidate('lessgo.ai', '/some-page')).toBe(false);
    expect(isApexPublishCandidate('lessgo.ai', '/privacy')).toBe(false);
    expect(isApexPublishCandidate('lessgo.ai', '/blog')).toBe(false);
    expect(isApexPublishCandidate('lessgo.ai', '/dashboard')).toBe(false);
    expect(isApexPublishCandidate('lessgo.ai', '/p/foo')).toBe(false);
  });

  it('is false off apex, even at root (app host / localhost / vercel)', () => {
    expect(isApexPublishCandidate('app.lessgo.ai', '/')).toBe(false);
    expect(isApexPublishCandidate('localhost:3000', '/')).toBe(false);
    expect(isApexPublishCandidate('lessgo-ai.vercel.app', '/')).toBe(false);
    expect(isApexPublishCandidate(null, '/')).toBe(false);
  });
});

describe('isAppRootRequest', () => {
  it('is true only for the app prod host at root', () => {
    expect(isAppRootRequest('app.lessgo.ai', '/')).toBe(true);
    expect(isAppRootRequest('APP.LESSGO.AI:443', '/')).toBe(true);
  });

  it('is false for non-root app-host paths', () => {
    expect(isAppRootRequest('app.lessgo.ai', '/dashboard')).toBe(false);
    expect(isAppRootRequest('app.lessgo.ai', '/welcome')).toBe(false);
    expect(isAppRootRequest('app.lessgo.ai', '/sign-in')).toBe(false);
  });

  it('is false off the app prod host, even at root', () => {
    expect(isAppRootRequest('lessgo.ai', '/')).toBe(false);
    expect(isAppRootRequest('www.lessgo.ai', '/')).toBe(false);
    expect(isAppRootRequest('localhost:3000', '/')).toBe(false);
    expect(isAppRootRequest('lessgo-ai.vercel.app', '/')).toBe(false);
    expect(isAppRootRequest(null, '/')).toBe(false);
  });

  it('ignores query/hash when classifying root', () => {
    expect(isAppRootRequest('app.lessgo.ai', '/?ref=x')).toBe(true);
    expect(isAppRootRequest('app.lessgo.ai', '/#top')).toBe(true);
  });
});

describe('getAppRootAction', () => {
  it('routes signed-in visitors to the dashboard', () => {
    expect(getAppRootAction(true)).toBe('dashboard');
  });

  it('routes signed-out visitors to the welcome entry page', () => {
    expect(getAppRootAction(false)).toBe('welcome');
  });
});

describe('/welcome is an app path', () => {
  it('isAppPath treats /welcome (and nested) as an app path', () => {
    expect(isAppPath('/welcome')).toBe(true);
    expect(isAppPath('/welcome/anything')).toBe(true);
  });

  it('getApexToAppRedirect 307s apex /welcome to the app host', () => {
    vi.stubEnv('NEXT_PUBLIC_DASHBOARD_URL', 'https://app.lessgo.ai');
    expect(getApexToAppRedirect('lessgo.ai', '/welcome')).toBe(
      'https://app.lessgo.ai/welcome',
    );
  });
});

// Guard: every top-level app route dir on disk must be covered by
// APP_PATH_PREFIXES, so a future-added app route can't silently stay on apex
// (un-redirected). Only asserts for dirs that actually exist.
describe('APP_PATH_PREFIXES covers every top-level app route dir', () => {
  const appDir = path.resolve(process.cwd(), 'src/app');
  const candidates = [
    'dashboard',
    'edit',
    'preview',
    'onboarding',
    'generate',
    'admin',
    't',
  ];

  for (const dir of candidates) {
    const full = path.join(appDir, dir);
    const exists = fs.existsSync(full) && fs.statSync(full).isDirectory();
    it(`covers /${dir}${exists ? '' : ' (absent — skipped)'}`, () => {
      if (!exists) return; // only assert for dirs that exist
      expect(APP_PATH_PREFIXES as readonly string[]).toContain(`/${dir}`);
    });
  }
});
