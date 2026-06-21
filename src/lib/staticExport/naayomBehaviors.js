/* =========================================================================
   naayom.v1.js — published TechPremium behaviors (Phase 4)
   Built by scripts/buildAssets.js → public/assets/naayom.v1.js, injected by
   htmlGenerator on TechPremium pages. Tiny vanilla JS; no framework. Each
   behavior is self-contained and no-ops if its markup is absent. tp- prefixed
   selectors (edit-mode safety). Port of design_handoff_naayom/design/naayom.js,
   adapted to the dual-renderer markup. Idempotent: runs once per page load.

   Subsumes Phase-3's per-block product-gallery inline script — the [data-tp-pd]
   + .tp-lightbox contract here matches that markup exactly.
   ========================================================================= */
(function () {
  "use strict";
  if (window.__naayomInit) return;
  window.__naayomInit = true;

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---- 1. Mobile menu --------------------------------------------------- */
  function initMobileMenu() {
    var nav = $(".tp-nav"); if (!nav) return;
    var burger = $(".tp-nav-burger", nav);
    if (burger) {
      burger.addEventListener("click", function () {
        var open = nav.classList.toggle("is-menu-open");
        burger.setAttribute("aria-expanded", open ? "true" : "false");
        document.body.style.overflow = open ? "hidden" : "";
      });
    }
    $$(".tp-nav-m-sec > button", nav).forEach(function (btn) {
      btn.addEventListener("click", function () { btn.parentNode.classList.toggle("is-open"); });
    });
    $$(".tp-nav-mobile a", nav).forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("is-menu-open");
        document.body.style.overflow = "";
      });
    });
  }

  /* ---- 2. Desktop dropdowns (click = touch/keyboard a11y) --------------- */
  function initDropdowns() {
    var drops = $$(".tp-nav-drop");
    drops.forEach(function (drop) {
      var t = $(".tp-nav-drop-t", drop);
      if (!t) return;
      t.addEventListener("click", function (e) {
        e.preventDefault();
        var open = drop.classList.toggle("is-open");
        t.setAttribute("aria-expanded", open ? "true" : "false");
        drops.forEach(function (o) { if (o !== drop) o.classList.remove("is-open"); });
      });
    });
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".tp-nav-drop")) drops.forEach(function (d) { d.classList.remove("is-open"); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") drops.forEach(function (d) { d.classList.remove("is-open"); });
    });
  }

  /* ---- 3. Active nav link by path --------------------------------------- */
  function initActiveNav() {
    var here = (location.pathname || "/").replace(/\/+$/, "") || "/";
    $$(".tp-nav-links a, .tp-nav-drop-menu a").forEach(function (a) {
      var href = (a.getAttribute("href") || "").replace(/#.*$/, "").replace(/\/+$/, "") || "/";
      if (href && href !== "#" && here === href) a.classList.add("is-active");
    });
  }

  /* ---- shared lightbox (gallery grid + product detail) ------------------ */
  var lb = null, lbItems = [], lbIndex = 0;
  function buildLb() {
    if (lb) return lb;
    lb = document.createElement("div");
    lb.className = "tp-lightbox";
    lb.innerHTML =
      '<div class="tp-lb-stage">' +
        '<button class="tp-lb-close" aria-label="Close">✕</button>' +
        '<button class="tp-lb-nav prev" aria-label="Previous">‹</button>' +
        '<button class="tp-lb-nav next" aria-label="Next">›</button>' +
        '<div class="tp-lb-img"></div><div class="tp-lb-cap"></div>' +
      '</div>';
    document.body.appendChild(lb);
    $(".tp-lb-close", lb).addEventListener("click", closeLb);
    $(".tp-lb-nav.prev", lb).addEventListener("click", function () { showLb(lbIndex - 1); });
    $(".tp-lb-nav.next", lb).addEventListener("click", function () { showLb(lbIndex + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") closeLb();
      if (e.key === "ArrowLeft") showLb(lbIndex - 1);
      if (e.key === "ArrowRight") showLb(lbIndex + 1);
    });
    return lb;
  }
  function openLb(items, start) {
    if (!items || !items.length) return;
    buildLb();
    lbItems = items;
    showLb(start || 0);
    lb.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }
  function showLb(n) {
    if (!lbItems.length) return;
    lbIndex = (n + lbItems.length) % lbItems.length;
    var it = lbItems[lbIndex];
    $(".tp-lb-img", lb).innerHTML = it.src
      ? '<img src="' + it.src + '" alt="">'
      : '<span class="tp-pd-ph">' + (it.cap || "") + "</span>";
    $(".tp-lb-cap", lb).textContent = (it.cap || "") + (lbItems.length > 1 ? "   ·   " + (lbIndex + 1) + " / " + lbItems.length : "");
  }
  function closeLb() { if (lb) lb.classList.remove("is-open"); document.body.style.overflow = ""; }

  /* ---- 4. Product-detail gallery (prev/next + thumbs + lightbox) -------- */
  function initProductGallery() {
    $$("[data-tp-pd]").forEach(function (gal) {
      var slides = $$(".tp-pd-slide", gal);
      var thumbs = $$(".tp-pd-thumb", gal);
      var cur = $(".tp-cur", gal);
      var i = 0;
      function items() {
        return slides.map(function (s) {
          var img = s.querySelector("img");
          return { src: img ? img.getAttribute("src") : "", cap: s.getAttribute("data-cap") || "" };
        });
      }
      function show(n) {
        i = (n + slides.length) % slides.length;
        slides.forEach(function (s, k) { s.classList.toggle("is-active", k === i); });
        thumbs.forEach(function (t, k) { t.classList.toggle("is-active", k === i); });
        if (cur) cur.textContent = String(i + 1);
      }
      var prev = $("[data-prev]", gal), next = $("[data-next]", gal), zoom = $("[data-zoom]", gal);
      if (prev) prev.addEventListener("click", function () { show(i - 1); });
      if (next) next.addEventListener("click", function () { show(i + 1); });
      thumbs.forEach(function (t, k) { t.addEventListener("click", function () { show(k); }); });
      if (zoom) zoom.addEventListener("click", function () { openLb(items(), i); });
      slides.forEach(function (s, k) { s.addEventListener("click", function () { openLb(items(), k); }); });
    });
  }

  /* ---- 5. Gallery grid lightbox ----------------------------------------- */
  function gridItems(grid) {
    return $$(".tp-gitem", grid).map(function (it) {
      var img = it.querySelector("img");
      var tag = it.querySelector(".tp-tag");
      return {
        src: img ? img.getAttribute("src") : "",
        cap: tag ? tag.textContent.trim() : (it.getAttribute("data-cap") || ""),
      };
    });
  }
  function initGalleryLightbox() {
    $$("[data-tp-lightbox-group]").forEach(function (grid) {
      $$(".tp-gitem", grid).forEach(function (item, k) {
        item.addEventListener("click", function () {
          // Only visible items (respects the active filter).
          var visible = $$(".tp-gitem", grid).filter(function (g) { return g.style.display !== "none"; });
          var items = visible.map(function (g) {
            var img = g.querySelector("img"), tag = g.querySelector(".tp-tag");
            return { src: img ? img.getAttribute("src") : "", cap: tag ? tag.textContent.trim() : (g.getAttribute("data-cap") || "") };
          });
          var idx = visible.indexOf(item);
          openLb(items.length ? items : gridItems(grid), idx < 0 ? 0 : idx);
        });
      });
    });
  }

  /* ---- 6. Gallery filter ------------------------------------------------ */
  function initGalleryFilter() {
    var bar = $(".tp-gfilter"); if (!bar) return;
    var grid = $("[data-tp-lightbox-group]");
    bar.addEventListener("click", function (e) {
      var btn = e.target.closest("button"); if (!btn) return;
      $$("button", bar).forEach(function (b) { b.classList.toggle("is-active", b === btn); });
      var cat = btn.getAttribute("data-cat");
      if (!grid) return;
      $$(".tp-gitem", grid).forEach(function (it) {
        var show = cat === "all" || it.getAttribute("data-cat") === cat;
        it.style.display = show ? "" : "none";
      });
    });
  }

  /* ---- 7. Live readout tick (signature) --------------------------------- */
  function initReadoutTick() {
    if (reduce) return;
    var specs = {
      co2:  { base: 820,   spread: 40,  unit: " ppm", dec: 0 },
      temp: { base: 18.4,  spread: 0.3, unit: " °C", dec: 1 },
      rh:   { base: 91,    spread: 2,   unit: " %",   dec: 0 },
      co2b: { base: 12400, spread: 300, unit: " ppm", dec: 0 },
      tempb:{ base: 24.1,  spread: 0.3, unit: " °C", dec: 1 },
      rhb:  { base: 95,    spread: 1.5, unit: " %",   dec: 0 }
    };
    var fields = [];
    $$("[data-live]").forEach(function (el) {
      var s = specs[el.getAttribute("data-live")];
      if (s) fields.push({ el: el, s: s });
    });
    if (!fields.length) return;
    setInterval(function () {
      fields.forEach(function (f) {
        var v = f.s.base + (Math.random() - 0.5) * 2 * f.s.spread;
        f.el.innerHTML = v.toFixed(f.s.dec) + "<small>" + f.s.unit + "</small>";
      });
    }, 3000);
  }

  /* ---- boot ------------------------------------------------------------- */
  function boot() {
    initMobileMenu();
    initDropdowns();
    initActiveNav();
    initProductGallery();
    initGalleryLightbox();
    initGalleryFilter();
    initReadoutTick();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
