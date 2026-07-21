/* switcherBehaviors.js — shared, TEMPLATE-AGNOSTIC published locale switcher.
 * Built to public/assets/switcher.v1.js (scripts/buildAssets.js) and injected by
 * htmlGenerator.ts ONLY when a project declares >1 locale (multi-locale). It renders
 * its OWN minimal floating pill — it does NOT depend on any template markup (per D2:
 * templates stay untouched). Reads window.__lessgoLocales = { locales, defaultLocale,
 * current } stamped inline just before this tag.
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

  var locales = cfg.locales;
  var def = cfg.defaultLocale;
  var current = cfg.current;
  var LS_KEY = 'lessgo.lang';
  var SESS_KEY = 'lessgo.langRedirected';

  function readCookie(name) {
    var m = document.cookie.match('(?:^|; )' + name + '=([^;]*)');
    return m ? decodeURIComponent(m[1]) : '';
  }

  // Split a served pathname into [nonDefaultLocalePrefix | null, barePath].
  // Only treats the FIRST segment as a locale when it is a declared non-default
  // locale (so '/about' stays bare and '/nl/about' -> ['nl','/about']).
  function segAt(pathname) {
    var m = pathname.match(/^\/([^\/]+)(\/.*)?$/);
    if (m && locales.indexOf(m[1]) !== -1 && m[1] !== def) {
      return [m[1], m[2] || '/'];
    }
    return [null, pathname];
  }

  function buildPath(loc, barePath) {
    var bp = barePath || '/';
    if (loc === def) return bp;
    return bp === '/' ? '/' + loc : '/' + loc + bp;
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
