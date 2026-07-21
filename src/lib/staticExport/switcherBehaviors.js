/* switcherBehaviors.js — shared, TEMPLATE-AGNOSTIC published locale switcher.
 * Built to public/assets/switcher.v2.js (scripts/buildAssets.js) and injected by
 * htmlGenerator.ts ONLY when a project declares >1 locale (multi-locale). It renders
 * its OWN minimal floating pill — it does NOT depend on any template markup (per D2:
 * templates stay untouched). Reads window.__lessgoLocales = { locales, defaultLocale,
 * current, slug, style, basePath? } stamped inline just before this tag.
 *
 * ⚠️ IMMUTABLE-ASSET CONTRACT (scripts/buildAssets.js:10-29): published blobs hardcode
 * an asset filename. `switcher.v1.js` is FROZEN at scripts/legacy/switcher.v1.src.js and
 * still serves every page published before language-settings. THIS file ships as
 * switcher.v2.js — any further SEMANTIC change here needs a switcher.v3.js, never an
 * in-place edit under the v2 name.
 *
 * v2 adds (language-settings phase 5):
 *  • basePath awareness. v1 assumed the site is served at the HOST ROOT, so on the
 *    `/p/{slug}` preview path it read `p` as the locale segment and built `/nl/p/{slug}`
 *    → 404 (and the geo redirect did the same on first paint). v2 derives a `basePath`
 *    from `cfg.slug` at runtime — ONE stamped config serves every surface (blob at host
 *    root, custom domain via middleware rewrite, and the direct /p/{slug} path) — then
 *    does all locale segment work relative to it and re-prepends it on every built URL.
 *    HOSTNAME-GATED: the `/p/{slug}` shape only counts as a base path on a lessgo host,
 *    so a custom-domain site that happens to own a page literally at `/p/{slug}` is not
 *    misread (middleware rewrites are internal — the browser pathname on the custom-domain
 *    SSR fallback carries no `/p` prefix).
 *    phase 6: an explicitly STAMPED `cfg.basePath` (emitted by the `/p/{slug}` SSR
 *    renderer, which knows its mount path for certain) always wins over the hostname
 *    heuristic — that is what makes preview hosts (*.vercel.app) correct without
 *    widening the host regex. Blobs stamp no basePath ⇒ detection, exactly as before.
 *  • `style: 'none'` ⇒ NO pill AND NO geo redirect ("None" means no automatic locale
 *    behavior at all). Defense in depth: the generator already omits the whole block.
 *    Absent style ⇒ 'dropdown' ⇒ exactly v1 behavior.
 *
 * Boot: localStorage['lessgo.lang'] -> geo-country cookie -> navigator.language. If the
 * resolved locale exists in the list AND differs from this doc's `current`, redirect
 * (location.replace) to the sibling locale path (swap the path PREFIX, preserve the
 * subpage path + query + hash). Redirect-loop guarded: only redirect to a locale in the
 * list, only once per session. Crawler-safe: every locale doc ships reciprocal hreflang
 * + self-canonical (D3), so the geo redirect can't create duplicate-URL competition.
 */
(function () {
  if (window.__lessgoSwitcherBooted) return;
  window.__lessgoSwitcherBooted = true;

  var cfg = window.__lessgoLocales;
  if (!cfg || !cfg.locales || cfg.locales.length < 2) return;
  // switcherStyle 'none' = no widget AND no automatic redirect.
  if (cfg.style === 'none') return;

  var locales = cfg.locales;
  var def = cfg.defaultLocale;
  var current = cfg.current;
  var LS_KEY = 'lessgo.lang';
  var SESS_KEY = 'lessgo.langRedirected';

  // ---- basePath: '' at host root, '/p/{slug}' on the lessgo preview path ----
  var basePath = (function () {
    // STAMPED wins (language-settings phase 6): the `/p/{slug}` SSR renderer knows
    // its own mount path with certainty and stamps `cfg.basePath`, so no hostname
    // guess is needed there — this is what makes preview deployments
    // (*.vercel.app/p/{slug}, outside the host regex below) build correct targets.
    // Runtime detection stays as the fallback for docs that stamp no basePath.
    if (typeof cfg.basePath === 'string') return cfg.basePath;
    var slug = cfg.slug;
    if (!slug) return '';
    var host = location.hostname || '';
    var onLessgo = /(^|\.)lessgo\.(ai|site)$/.test(host) || host === 'localhost';
    if (!onLessgo) return '';
    var pfx = '/p/' + slug;
    var p = location.pathname || '/';
    return p === pfx || p.indexOf(pfx + '/') === 0 ? pfx : '';
  })();

  /** Strip the base path off a served pathname (always leading-slash'd). */
  function relPath(pathname) {
    var p = pathname || '/';
    if (basePath && (p === basePath || p.indexOf(basePath + '/') === 0)) {
      p = p.slice(basePath.length);
    }
    return p || '/';
  }

  function readCookie(name) {
    var m = document.cookie.match('(?:^|; )' + name + '=([^;]*)');
    return m ? decodeURIComponent(m[1]) : '';
  }

  // Split a served pathname into [nonDefaultLocalePrefix | null, barePath].
  // Only treats the FIRST segment AFTER the base path as a locale when it is a
  // declared non-default locale (so '/about' stays bare and '/nl/about' ->
  // ['nl','/about'], and on '/p/slug/nl/about' -> ['nl','/about']).
  function segAt(pathname) {
    var rel = relPath(pathname);
    var m = rel.match(/^\/([^\/]+)(\/.*)?$/);
    if (m && locales.indexOf(m[1]) !== -1 && m[1] !== def) {
      return [m[1], m[2] || '/'];
    }
    return [null, rel];
  }

  // Build a SERVED path (base path re-prepended) for `loc` + a bare subpage path.
  function buildPath(loc, barePath) {
    var bp = barePath || '/';
    var rel = loc === def ? bp : bp === '/' ? '/' + loc : '/' + loc + bp;
    if (!basePath) return rel;
    return rel === '/' ? basePath : basePath + rel;
  }

  function isKnown(loc) {
    return !!loc && locales.indexOf(loc) !== -1;
  }

  // ---- Resolve preferred locale: localStorage -> geo cookie -> navigator ----
  function resolvePreferred() {
    try {
      var saved = localStorage.getItem(LS_KEY);
      if (isKnown(saved)) return saved;
    } catch (e) {}
    // geo-country cookie (middleware-stamped). Heuristic: lowercase the ISO
    // country and accept it only if it happens to name a declared locale
    // (e.g. NL->nl, DE->de). Imperfect by design — navigator.language is the
    // reliable fallback below.
    var country = (readCookie('geo-country') || '').toLowerCase();
    if (isKnown(country)) return country;
    var nav = ((navigator.language || navigator.userLanguage || '') + '').toLowerCase();
    var base = nav.split('-')[0];
    if (isKnown(base)) return base;
    return null;
  }

  // ---- First-visit geo/pref redirect (loop-guarded) ----
  (function () {
    var already = false;
    try { already = sessionStorage.getItem(SESS_KEY) === '1'; } catch (e) {}
    if (already) return;

    var pref = resolvePreferred();
    if (!pref || pref === current) return;

    try { sessionStorage.setItem(SESS_KEY, '1'); } catch (e) {}
    var bare = segAt(location.pathname)[1];
    var target = buildPath(pref, bare) + location.search + location.hash;
    location.replace(target);
  })();

  // ---- Floating pill UI ----
  function renderPill() {
    if (document.getElementById('lessgo-lang-switcher')) return;
    var bar = document.createElement('div');
    bar.id = 'lessgo-lang-switcher';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'Language');
    bar.style.cssText =
      'position:fixed;bottom:16px;right:16px;z-index:2147483000;display:flex;gap:2px;' +
      'background:rgba(17,17,17,.86);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);' +
      'border-radius:999px;padding:3px;box-shadow:0 2px 12px rgba(0,0,0,.28);' +
      'font:600 12px/1 system-ui,-apple-system,Segoe UI,Roboto,sans-serif';

    locales.forEach(function (loc) {
      var on = loc === current;
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = loc.toUpperCase();
      b.setAttribute('aria-pressed', String(on));
      b.style.cssText =
        'border:0;cursor:pointer;padding:6px 11px;border-radius:999px;letter-spacing:.03em;' +
        'color:' + (on ? '#111' : '#fff') + ';background:' + (on ? '#fff' : 'transparent') + ';font:inherit';
      b.addEventListener('click', function () {
        try { localStorage.setItem(LS_KEY, loc); } catch (e) {}
        if (loc === current) return;
        var bare = segAt(location.pathname)[1];
        location.href = buildPath(loc, bare) + location.search + location.hash;
      });
      bar.appendChild(b);
    });

    document.body.appendChild(bar);
  }

  if (document.body) {
    renderPill();
  } else {
    document.addEventListener('DOMContentLoaded', renderPill);
  }
})();
