/* workBehaviors.js — published-only behaviors for the WORK SKELETON (skin ids in
 * src/modules/skeletons/ids.ts, e.g. atelier2). Built to public/assets/work.v1.js
 * (scripts/buildAssets.js) and injected by htmlGenerator.ts only when
 * templateId ∈ skeletonBackedTemplateIds.
 *
 * Vanilla, framework-free, server-injected script tag — NEVER imported by a
 * renderer. All hooks are namespaced `data-wk-*` / `.wk-*`. Idempotent boot guard;
 * EACH behavior is independently guarded so a page missing a section never errors.
 *
 * Behaviors (D1 / phase 5):
 *   1. HERO SLIDER — ported from atelierSliderBehaviors.js (autoplay crossfade,
 *      prev/next arrows, injected dots, visibilitychange pause, reduced-motion).
 *      Degrades to the static first (.is-active) slide with no JS; bails when a
 *      hero ships < 2 slides (the single-portrait pilot state — no-op, matching the
 *      editor `.tsx` effect exactly → honest edit==published parity).
 *   2. FIXED / STICKY HEADER — a header opts in via
 *      `[data-wk-header][data-wk-header-mode="fixed"]`; JS toggles `is-scrolled` on
 *      scroll for the shadow/compaction. No-op (static header) when the attribute is
 *      absent — which is the phase-5 pilot markup; the mode attribute is emitted by
 *      the header wrapper in phase 6, where the editor mirror also lands.
 *
 * DEFERRED to phase 6 (with the gallery masonry/strip work): the gallery lightbox.
 * The pilot gallery renders GROUP REFERENCES that navigate to group hrefs (AC L120)
 * — there is no in-page image set to lightbox — so no lightbox ships here, keeping
 * published + editor consistent.
 *
 * Selector contract (HARD — rename ⇒ ship work.v2.js):
 *   HERO   [data-wk-hero-slider][data-wk-interval] · .wk-hero__slide/.is-active ·
 *          [data-wk-prev]/[data-wk-next] · [data-wk-dots] (EMPTY → JS adds .wk-hero__dot)
 *   HEADER [data-wk-header][data-wk-header-mode="fixed"] → toggles .is-scrolled
 */
(function () {
  if (window.__workBooted) return;
  window.__workBooted = true;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. HERO SLIDER ---------- */
  (function () {
    var sliders = Array.prototype.slice.call(document.querySelectorAll('[data-wk-hero-slider]'));
    if (!sliders.length) return;

    sliders.forEach(function (slider) {
      var slides = Array.prototype.slice.call(slider.querySelectorAll('.wk-hero__slide'));
      if (slides.length < 2) return; // single-slide pilot state → nothing to animate

      var interval = parseInt(slider.getAttribute('data-wk-interval'), 10);
      if (!interval || interval < 1) interval = 5000;

      var idx = 0;
      var timer = null;

      // Inject dots into the EMPTY [data-wk-dots] container.
      var dotsWrap = slider.querySelector('[data-wk-dots]');
      var dots = [];
      if (dotsWrap) {
        slides.forEach(function (_s, i) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'wk-hero__dot';
          b.setAttribute('aria-label', 'Slide ' + (i + 1));
          b.setAttribute('aria-current', i === 0 ? 'true' : 'false');
          b.addEventListener('click', function () { go(i); restart(); });
          dotsWrap.appendChild(b);
          dots.push(b);
        });
      }

      function go(n) {
        idx = (n % slides.length + slides.length) % slides.length;
        slides.forEach(function (s, i) {
          if (i === idx) s.classList.add('is-active');
          else s.classList.remove('is-active');
        });
        dots.forEach(function (d, i) {
          d.setAttribute('aria-current', i === idx ? 'true' : 'false');
        });
      }

      function restart() {
        stop();
        if (reduce) return; // motion-safe: no autoplay
        timer = window.setInterval(function () { go(idx + 1); }, interval);
      }

      function stop() {
        if (timer) { window.clearInterval(timer); timer = null; }
      }

      var prev = slider.querySelector('[data-wk-prev]');
      var next = slider.querySelector('[data-wk-next]');
      if (prev) prev.addEventListener('click', function () { go(idx - 1); restart(); });
      if (next) next.addEventListener('click', function () { go(idx + 1); restart(); });

      document.addEventListener('visibilitychange', function () {
        if (document.hidden) stop();
        else restart();
      });

      go(0);
      restart();
    });
  })();

  /* ---------- 2. FIXED / STICKY HEADER ---------- */
  (function () {
    var headers = Array.prototype.slice.call(
      document.querySelectorAll('[data-wk-header][data-wk-header-mode="fixed"]')
    );
    if (!headers.length) return; // static header (pilot markup) → no-op

    function sync() {
      var scrolled = (window.pageYOffset || document.documentElement.scrollTop || 0) > 8;
      headers.forEach(function (h) {
        if (scrolled) h.classList.add('is-scrolled');
        else h.classList.remove('is-scrolled');
      });
    }

    window.addEventListener('scroll', sync, { passive: true });
    sync();
  })();
})();
