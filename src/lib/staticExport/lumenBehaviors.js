/* lumenBehaviors.js — published-only behaviors for the Lumen template.
 * Built to public/assets/lumen.v1.js (scripts/buildAssets.js) and injected by
 * htmlGenerator.ts only when templateId === 'lumen'. Three behaviors, each a
 * no-op when its markup is absent, with an idempotent boot guard:
 *   1. EN·NL language toggle + geo default (data-en/data-nl swap)
 *   2. Category lightbox (data-lumen-* covers → modal)
 *   3. Reveal-on-scroll (motion-safe)
 * Selectors must match the Lumen published blocks EXACTLY (lm- prefix).
 */
(function () {
  if (window.__lumenBooted) return;
  window.__lumenBooted = true;

  /* ---------- 1. LANGUAGE TOGGLE (EN / NL) + GEO DEFAULT ---------- */
  (function () {
    var KEY = 'lumen.lang';
    var btns = Array.prototype.slice.call(document.querySelectorAll('.lm-lang button[data-lang]'));

    function readCookie(name) {
      var m = document.cookie.match('(?:^|; )' + name + '=([^;]*)');
      return m ? decodeURIComponent(m[1]) : '';
    }

    function apply(lang) {
      var l = lang === 'nl' ? 'nl' : 'en';
      document.querySelectorAll('[data-en]').forEach(function (el) {
        var v = el.getAttribute('data-' + l);
        if (v == null) v = el.getAttribute('data-en');
        if (v != null) el.innerHTML = v;
      });
      document.querySelectorAll('[data-en-ph]').forEach(function (el) {
        var v = el.getAttribute('data-' + l + '-ph');
        if (v == null) v = el.getAttribute('data-en-ph');
        if (v != null) el.setAttribute('placeholder', v);
      });
      document.documentElement.setAttribute('lang', l);
      btns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === l)); });
      try { localStorage.setItem(KEY, l); } catch (e) {}
      window.__lumenLang = l;
    }

    btns.forEach(function (b) {
      b.addEventListener('click', function () { apply(b.getAttribute('data-lang')); });
    });

    // Default-language order: localStorage override → geo cookie (NL) →
    // navigator.language (nl*) → EN.
    var initial = 'en';
    try {
      var saved = localStorage.getItem(KEY);
      if (saved === 'en' || saved === 'nl') {
        initial = saved;
      } else {
        var country = (readCookie('geo-country') || '').toUpperCase();
        var navLang = ((navigator.language || navigator.userLanguage || '') + '').toLowerCase();
        if (country === 'NL' || country === 'BE') initial = 'nl';
        else if (navLang.indexOf('nl') === 0) initial = 'nl';
      }
    } catch (e) {}
    apply(initial);
  })();

  /* ---------- 2. CATEGORY LIGHTBOX ---------- */
  (function () {
    var lb = document.getElementById('lm-lightbox');
    if (!lb) return;
    var cards = Array.prototype.slice.call(document.querySelectorAll('.lm-pf-card[data-lumen-gallery]'));
    if (!cards.length) return;

    var img = document.getElementById('lm-lb-img');
    var tag = document.getElementById('lm-lb-tag');
    var elGrp = document.getElementById('lm-lb-grp');
    var elCat = document.getElementById('lm-lb-cat');
    var elFig = document.getElementById('lm-lb-fig');
    var elI = document.getElementById('lm-lb-i');
    var elN = document.getElementById('lm-lb-n');
    var dots = document.getElementById('lm-lb-dots');
    var prev = document.getElementById('lm-lb-prev');
    var next = document.getElementById('lm-lb-next');
    var cur = null, idx = 0;

    function lang() { return window.__lumenLang === 'nl' ? 'nl' : 'en'; }

    function readCard(card) {
      var imgs = [];
      try { imgs = JSON.parse(card.getAttribute('data-lumen-images') || '[]'); } catch (e) { imgs = []; }
      return {
        id: card.getAttribute('data-lumen-gallery') || '',
        name: card.getAttribute('data-lumen-name') || '',
        nameNl: card.getAttribute('data-lumen-name-nl') || '',
        grp: card.getAttribute('data-lumen-group') || '',
        grpNl: card.getAttribute('data-lumen-group-nl') || '',
        fig: card.getAttribute('data-lumen-fig') || '',
        ratio: card.getAttribute('data-lumen-ratio') === 'port' ? 'port' : 'land',
        images: imgs
      };
    }

    function render() {
      if (!cur) return;
      var nl = lang() === 'nl';
      var n = Math.max(cur.images.length, 1);
      var src = cur.images[idx];
      img.className = 'lm-ph ' + cur.ratio;
      if (src) {
        img.innerHTML = '<img src="' + src + '" alt="" style="height:100%;width:auto;display:block" />';
      } else {
        img.innerHTML = '<span class="lm-ph__tag">' + (nl && cur.nameNl ? cur.nameNl : cur.name) + ' — ' + String(idx + 1) + '</span>';
      }
      if (tag) tag.textContent = (nl && cur.nameNl ? cur.nameNl : cur.name) + ' — ' + String(idx + 1);
      if (elGrp) elGrp.textContent = nl && cur.grpNl ? cur.grpNl : cur.grp;
      if (elCat) elCat.textContent = nl && cur.nameNl ? cur.nameNl : cur.name;
      if (elFig) elFig.innerHTML = '<span class="n">Fig. ' + (cur.fig || '—') + '.' + (idx + 1) + '</span>';
      if (elI) elI.textContent = String(idx + 1);
      if (elN) elN.textContent = String(n);
      if (dots) {
        var html = '';
        for (var k = 0; k < n; k++) html += '<span class="lm-lb-dot' + (k === idx ? ' on' : '') + '"></span>';
        dots.innerHTML = html;
      }
    }

    function open(card) { cur = readCard(card); idx = 0; render(); lb.classList.add('open'); document.body.style.overflow = 'hidden'; }
    function close() { lb.classList.remove('open'); document.body.style.overflow = ''; cur = null; }
    function step(d) { if (!cur) return; var n = Math.max(cur.images.length, 1); idx = (idx + d + n) % n; render(); }

    cards.forEach(function (c) { c.addEventListener('click', function () { open(c); }); });
    document.querySelectorAll('[data-lm-lb-close]').forEach(function (x) { x.addEventListener('click', close); });
    if (prev) prev.addEventListener('click', function () { step(-1); });
    if (next) next.addEventListener('click', function () { step(1); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
    });
  })();

  /* ---------- 3. REVEAL ON SCROLL (motion-safe) ---------- */
  (function () {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!('IntersectionObserver' in window)) return;
    var els = document.querySelectorAll('.lm-reveal');
    if (!els.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  })();
})();
