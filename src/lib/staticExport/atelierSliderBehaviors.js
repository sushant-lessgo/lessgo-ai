/* atelierSliderBehaviors.js — LEGACY-FROZEN published-only behavior for the OLD
 * hand-written Atelier hero cover slider. Built to public/assets/slider.v1.js
 * (scripts/buildAssets.js). The old atelier skin was RETIRED in
 * atelier-skeleton-cutover — NEW atelier publishes are work-skeleton pages that
 * load work.v1.js instead and never inject this tag. This source is kept ONLY
 * because already-published old blobs reference /assets/slider.v1.js by URL
 * (immutable-asset contract) and must keep loading it. Do not delete; do not edit
 * semantics (a change = a NEW filename slider.v2.js).
 *
 * NO-OP when the markup is absent, with an idempotent boot guard. Selectors are a
 * HARD CONTRACT with the old Atelier hero markup — do NOT rename without shipping
 * slider.v2.js:
 *   .lg-atelier-cover                              closest() ancestor
 *   .lg-atelier-slides[data-atl-slider][data-interval]
 *   .lg-atelier-slide / .is-active                slides + active class
 *   .lg-atelier-arrows > [data-atl-prev] / [data-atl-next]
 *   .lg-atelier-dots[data-atl-dots]               EMPTY — JS injects .lg-atelier-dot
 *
 * Behavior: crossfade autoplay (interval default 5000ms), prev/next arrows,
 * injected dots, visibilitychange pause/resume, prefers-reduced-motion disables
 * autoplay. Degrades to the static first (.is-active) slide with no JS.
 */
(function () {
  if (window.__atelierSliderBooted) return;
  window.__atelierSliderBooted = true;

  var sliders = Array.prototype.slice.call(document.querySelectorAll('[data-atl-slider]'));
  if (!sliders.length) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  sliders.forEach(function (slider) {
    var cover = slider.closest('.lg-atelier-cover') || slider;
    var slides = Array.prototype.slice.call(slider.querySelectorAll('.lg-atelier-slide'));
    if (slides.length < 2) return; // nothing to animate

    var interval = parseInt(slider.getAttribute('data-interval'), 10);
    if (!interval || interval < 1) interval = 5000;

    var idx = 0;
    var timer = null;

    // Inject dots into the EMPTY [data-atl-dots] container.
    var dotsWrap = cover.querySelector('[data-atl-dots]');
    var dots = [];
    if (dotsWrap) {
      slides.forEach(function (_s, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'lg-atelier-dot';
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

    var prev = cover.querySelector('[data-atl-prev]');
    var next = cover.querySelector('[data-atl-next]');
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
