// src/lib/staticExport/switcherBehaviors.v2.test.ts
// language-settings phase 5 — the LIVE switcher source (shipped as switcher.v2.js).
//
// The asset is a plain browser IIFE, not a module, so it is loaded as TEXT and
// evaluated with `window`/`document`/`location`/`navigator`/`localStorage`/
// `sessionStorage` passed in as FUNCTION PARAMETERS — they shadow the jsdom
// globals, which lets each case stub a different serving surface (host root,
// `/p/{slug}`, custom domain) without touching the real `location`.
//
// What this pins:
//  • basePath detection (the `/nl/p/{slug}` 404 bug) — hostname-gated;
//  • target-path building re-prepends the base path (pill clicks + geo redirect);
//  • `style: 'none'` ⇒ no pill AND no redirect;
//  • the once-per-session redirect guard survived the v2 rewrite;
//  • the v1 FREEZE: scripts/legacy/switcher.v1.src.js exists and nothing emits v1.

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

const ROOT = path.join(__dirname, '..', '..', '..'); // src/lib/staticExport → repo root
const SRC = readFileSync(
  path.join(ROOT, 'src', 'lib', 'staticExport', 'switcherBehaviors.js'),
  'utf8'
);

type Cfg = {
  locales: string[];
  defaultLocale: string;
  current: string;
  slug?: string;
  style?: string;
  /** phase 6: explicitly stamped by the /p/{slug} SSR renderer. */
  basePath?: string;
};

interface RunOpts {
  cfg: Cfg;
  pathname: string;
  hostname: string;
  search?: string;
  hash?: string;
  /** navigator.language for the geo/pref boot. */
  navLanguage?: string;
  /** localStorage['lessgo.lang'] seed. */
  saved?: string | null;
  /** sessionStorage redirect guard already set. */
  alreadyRedirected?: boolean;
}

interface RunResult {
  /** location.replace target (geo/pref boot), if any. */
  replaced: string | null;
  /** location.href assignment (pill click), if any. */
  href: string | null;
  /** Click a locale pill; returns the resulting href assignment. */
  clickLocale: (loc: string) => string | null;
  /** The rendered pill element, or null when none was rendered. */
  pill: HTMLElement | null;
}

function runSwitcher(opts: RunOpts): RunResult {
  document.body.innerHTML = '';
  document.cookie = 'geo-country=; expires=Thu, 01 Jan 1970 00:00:00 GMT';

  const state = { replaced: null as string | null, href: null as string | null };

  const location = {
    pathname: opts.pathname,
    hostname: opts.hostname,
    search: opts.search ?? '',
    hash: opts.hash ?? '',
    replace: (t: string) => {
      state.replaced = t;
    },
    set href(v: string) {
      state.href = v;
    },
    get href() {
      return state.href ?? '';
    },
  };

  const store = (seed: Record<string, string>) => {
    const m = new Map(Object.entries(seed));
    return {
      getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
      setItem: (k: string, v: string) => void m.set(k, v),
    };
  };

  const win: Record<string, any> = { __lessgoLocales: opts.cfg };

  const fn = new Function(
    'window',
    'document',
    'location',
    'navigator',
    'localStorage',
    'sessionStorage',
    SRC
  );
  fn(
    win,
    document,
    location,
    { language: opts.navLanguage ?? 'en-US' },
    store(opts.saved ? { 'lessgo.lang': opts.saved } : {}),
    store(opts.alreadyRedirected ? { 'lessgo.langRedirected': '1' } : {})
  );

  const pill = document.getElementById('lessgo-lang-switcher');
  return {
    replaced: state.replaced,
    href: state.href,
    pill,
    clickLocale: (loc: string) => {
      const btn = Array.from(pill?.querySelectorAll('button') ?? []).find(
        (b) => b.textContent === loc.toUpperCase()
      );
      if (!btn) throw new Error(`no pill button for "${loc}"`);
      state.href = null;
      btn.click();
      return state.href;
    },
  };
}

const CFG = (over: Partial<Cfg> = {}): Cfg => ({
  locales: ['en', 'nl'],
  defaultLocale: 'en',
  current: 'en',
  slug: 'gate',
  style: 'dropdown',
  ...over,
});

describe('switcher v2 — basePath detection + target building', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('blob served at the host ROOT: clicking nl goes to /nl (no base path)', () => {
    const r = runSwitcher({ cfg: CFG(), pathname: '/', hostname: 'gate.lessgo.site' });
    expect(r.clickLocale('nl')).toBe('/nl');
  });

  it('lessgo /p/{slug}: clicking nl goes to /p/{slug}/nl — NOT the old /nl/p/{slug} 404', () => {
    const r = runSwitcher({ cfg: CFG(), pathname: '/p/gate', hostname: 'lessgo.ai' });
    expect(r.clickLocale('nl')).toBe('/p/gate/nl');
    expect(r.clickLocale('nl')).not.toBe('/nl/p/gate');
  });

  it('lessgo /p/{slug}/nl/about: clicking en returns to /p/{slug}/about', () => {
    const r = runSwitcher({
      cfg: CFG({ current: 'nl' }),
      pathname: '/p/gate/nl/about',
      hostname: 'localhost',
    });
    expect(r.clickLocale('en')).toBe('/p/gate/about');
    // Clicking the CURRENT locale is a no-op (v1 behavior, preserved).
    expect(r.clickLocale('nl')).toBeNull();
  });

  it('host-root /nl/about: clicking en returns to /about', () => {
    const r = runSwitcher({
      cfg: CFG({ current: 'nl' }),
      pathname: '/nl/about',
      hostname: 'gate.lessgo.site',
    });
    expect(r.clickLocale('en')).toBe('/about');
  });

  it('custom domain (middleware rewrite ⇒ no /p prefix in the browser): stays root-relative', () => {
    const r = runSwitcher({ cfg: CFG(), pathname: '/about', hostname: 'example.com' });
    expect(r.clickLocale('nl')).toBe('/nl/about');
  });

  it('custom domain with a real page AT /p/{slug}: hostname gate ⇒ treated as a normal path', () => {
    const r = runSwitcher({ cfg: CFG(), pathname: '/p/gate', hostname: 'example.com' });
    // NOT a base path here — '/p/gate' is this site's own subpage.
    expect(r.clickLocale('nl')).toBe('/nl/p/gate');
  });

  it('preserves query + hash on a pill click', () => {
    const r = runSwitcher({
      cfg: CFG(),
      pathname: '/p/gate',
      hostname: 'lessgo.ai',
      search: '?a=1',
      hash: '#x',
    });
    expect(r.clickLocale('nl')).toBe('/p/gate/nl?a=1#x');
  });

  // ── phase 6: the SSR renderer STAMPS basePath (it knows its mount path) ──
  // The client's hostname heuristic does not know *.vercel.app, so preview-URL QA
  // on `…vercel.app/p/{slug}` would have rebuilt `/nl/p/{slug}` (a 404) — the whole
  // point of the stamp is that the server never has to be guessed at.
  it('STAMPED basePath wins on a preview host the hostname gate does not know', () => {
    const r = runSwitcher({
      cfg: CFG({ basePath: '/p/gate' }),
      pathname: '/p/gate',
      hostname: 'lessgo-ai-git-x.vercel.app',
    });
    expect(r.clickLocale('nl')).toBe('/p/gate/nl');
    expect(r.clickLocale('nl')).not.toBe('/nl/p/gate');
  });

  it('STAMPED empty basePath wins over detection (custom-domain rewrite onto /p/{slug})', () => {
    const r = runSwitcher({
      cfg: CFG({ basePath: '' }),
      pathname: '/p/gate',
      hostname: 'lessgo.ai',
    });
    // Detection alone would have said '/p/gate'; the stamp says host root.
    expect(r.clickLocale('nl')).toBe('/nl/p/gate');
  });

  it('the geo redirect uses the stamped base path too', () => {
    const r = runSwitcher({
      cfg: CFG({ basePath: '/p/gate' }),
      pathname: '/p/gate',
      hostname: 'lessgo-ai-git-x.vercel.app',
      navLanguage: 'nl-NL',
    });
    expect(r.replaced).toBe('/p/gate/nl');
  });

  it('an UNSTAMPED config still uses runtime detection (published blobs)', () => {
    const r = runSwitcher({ cfg: CFG(), pathname: '/p/gate', hostname: 'lessgo.ai' });
    expect(r.clickLocale('nl')).toBe('/p/gate/nl');
  });

  it('a config without a slug never claims a base path', () => {
    const r = runSwitcher({
      cfg: CFG({ slug: undefined }),
      pathname: '/p/gate',
      hostname: 'lessgo.ai',
    });
    expect(r.clickLocale('nl')).toBe('/nl/p/gate');
  });
});

describe('switcher v2 — geo/preference boot redirect', () => {
  it('redirects into the base path (not /nl/p/{slug}) when the visitor prefers nl', () => {
    const r = runSwitcher({
      cfg: CFG(),
      pathname: '/p/gate',
      hostname: 'lessgo.ai',
      navLanguage: 'nl-NL',
    });
    expect(r.replaced).toBe('/p/gate/nl');
  });

  it('redirects at the host root to /nl', () => {
    const r = runSwitcher({
      cfg: CFG(),
      pathname: '/',
      hostname: 'gate.lessgo.site',
      navLanguage: 'nl',
    });
    expect(r.replaced).toBe('/nl');
  });

  it('does not redirect when the preferred locale is already current', () => {
    const r = runSwitcher({
      cfg: CFG({ current: 'nl' }),
      pathname: '/p/gate/nl',
      hostname: 'lessgo.ai',
      navLanguage: 'nl',
    });
    expect(r.replaced).toBeNull();
  });

  it('honors the once-per-session guard', () => {
    const r = runSwitcher({
      cfg: CFG(),
      pathname: '/p/gate',
      hostname: 'lessgo.ai',
      navLanguage: 'nl',
      alreadyRedirected: true,
    });
    expect(r.replaced).toBeNull();
  });

  it('localStorage preference wins over navigator', () => {
    const r = runSwitcher({
      cfg: CFG(),
      pathname: '/p/gate',
      hostname: 'lessgo.ai',
      navLanguage: 'nl',
      saved: 'en',
    });
    expect(r.replaced).toBeNull();
  });
});

describe("switcher v2 — switcherStyle 'none'", () => {
  it('renders NO pill and fires NO redirect (defense in depth for the generator gate)', () => {
    const r = runSwitcher({
      cfg: CFG({ style: 'none' }),
      pathname: '/p/gate',
      hostname: 'lessgo.ai',
      navLanguage: 'nl-NL',
    });
    expect(r.pill).toBeNull();
    expect(r.replaced).toBeNull();
  });

  it("style 'dropdown' (and an absent style) still render the pill", () => {
    expect(
      runSwitcher({ cfg: CFG(), pathname: '/', hostname: 'gate.lessgo.site' }).pill
    ).not.toBeNull();
    expect(
      runSwitcher({
        cfg: CFG({ style: undefined }),
        pathname: '/',
        hostname: 'gate.lessgo.site',
      }).pill
    ).not.toBeNull();
  });

  it('a single-locale config never boots (unchanged v1 guard)', () => {
    const r = runSwitcher({
      cfg: CFG({ locales: ['en'] }),
      pathname: '/',
      hostname: 'gate.lessgo.site',
      navLanguage: 'nl',
    });
    expect(r.pill).toBeNull();
    expect(r.replaced).toBeNull();
  });
});

describe('switcher v1 FREEZE (immutable-asset contract)', () => {
  it('scripts/legacy/switcher.v1.src.js exists — old blobs keep their original bytes', () => {
    expect(existsSync(path.join(ROOT, 'scripts', 'legacy', 'switcher.v1.src.js'))).toBe(true);
  });

  it('the generator no longer emits switcher.v1.js', () => {
    const gen = readFileSync(
      path.join(ROOT, 'src', 'lib', 'staticExport', 'htmlGenerator.ts'),
      'utf8'
    );
    expect(gen).not.toMatch(/assets\/switcher\.v1\.js/);
    expect(gen).toMatch(/assets\/switcher\.v2\.js/);
  });
});
