// src/modules/skeletons/work/blocks/Hero/styles.ts
// WorkHeroSlider CSS (edit + published parity). `wk-hero-` prefixed. Token-driven
// ONLY via CSS custom properties: SKIN tokens `var(--wk-*)` (from the skin's
// SSRTokens/ThemeInjector) + USER style tokens `var(--u-*, <skeleton default>)`
// (per-section Design ▾ overrides — absent → the skeleton default wins). The block
// paints a full-bleed cover (atelier "cover" hero); the media image is CONTENT.
// D1 renders the STATIC first-slide state — the slider behavior (multi-slide
// autoplay/arrows/dots) lands in phase 5 with work.v1.js and degrades to this
// single static slide when JS is off or <2 slides exist.
// Ported from template-design/designer-workspace/atelier/index.html (.atl-cover).

export const WORK_HERO_STYLES = `
.wk-hero{ position:relative; min-height:clamp(520px,82vh,860px); display:flex; align-items:var(--wk-hero-items, flex-end); overflow:hidden; background:var(--u-bg, var(--wk-dark)); color:var(--u-fg, var(--wk-on-dark)); }
.wk-hero__media{ position:absolute; inset:0; z-index:0; }
.wk-hero__media img{ width:100%; height:100%; object-fit:cover; display:block; }
/* Multi-slide slider (Wave 2). >=2 slides only; hooks match work.v1.js verbatim.
   Slides stack full-bleed; only .is-active is visible (crossfade). The first
   slide ships .is-active so it shows with no JS. */
.wk-hero__slides{ position:absolute; inset:0; z-index:0; }
.wk-hero__slide{ position:absolute; inset:0; opacity:0; transition:opacity .8s ease; }
.wk-hero__slide.is-active{ opacity:1; }
.wk-hero__slide-media{ position:absolute; inset:0; }
.wk-hero__slide-media img{ width:100%; height:100%; object-fit:cover; display:block; }
.wk-hero__arrow{ position:absolute; top:50%; transform:translateY(-50%); z-index:3; width:44px; height:44px; display:inline-flex; align-items:center; justify-content:center; font-size:24px; line-height:1; color:#fff; background:rgba(0,0,0,0.28); border:1px solid rgba(255,255,255,0.35); border-radius:50%; cursor:pointer; }
.wk-hero__arrow:hover{ background:rgba(0,0,0,0.5); }
.wk-hero__arrow--prev{ left:20px; }
.wk-hero__arrow--next{ right:20px; }
.wk-hero__dots{ position:absolute; bottom:22px; left:50%; transform:translateX(-50%); z-index:3; display:flex; gap:9px; }
.wk-hero__dot{ width:9px; height:9px; padding:0; border:none; border-radius:50%; background:rgba(255,255,255,0.42); cursor:pointer; }
.wk-hero__dot[aria-current="true"]{ background:#fff; }
.wk-hero__ph{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:var(--wk-paper-2); color:var(--wk-ink-mute); font-family:var(--wk-ff-mono); font-size:12px; letter-spacing:0.2em; text-transform:uppercase; }
.wk-hero__num{ display:var(--wk-hero-num-display, none); position:absolute; right:4vw; bottom:-0.12em; z-index:1; font-family:var(--wk-ff-display); font-weight:800; font-size:clamp(180px,32vw,460px); line-height:1; letter-spacing:-0.05em; color:oklch(1 0 0 / 0.07); user-select:none; pointer-events:none; }
.wk-hero__scrim{ position:absolute; inset:0; z-index:1; background:linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.35)); }
.wk-hero__in{ position:relative; z-index:2; width:100%; max-width:var(--wk-wrap); margin:0 auto; padding:calc(clamp(40px,7vw,96px) * var(--u-space-y, 1)) var(--wk-gutter); display:flex; flex-direction:column; align-items:var(--wk-hero-inline, stretch); text-align:var(--wk-hero-align, left); gap:22px; }
.wk-hero__eyebrow{ font-family:var(--wk-ff-body); font-weight:600; font-size:11px; letter-spacing:0.16em; text-transform:uppercase; display:inline-flex; align-items:center; gap:10px; }
.wk-hero__eyebrow::before{ content:""; width:8px; height:8px; background:var(--wk-accent); border-radius:50%; flex:none; }
.wk-hero__name{ font-family:var(--wk-ff-display); font-weight:var(--wk-hero-weight, var(--wk-display-weight)); font-size:clamp(2.6rem,7vw,var(--wk-hero-scale, 5.4rem)); line-height:var(--wk-hero-lh, 0.94); letter-spacing:var(--wk-hero-tracking, -0.02em); margin:0; }
.wk-hero__name em{ font-style:normal; color:var(--wk-accent); }
.wk-hero__quote{ max-width:44ch; font-size:clamp(1rem,1.6vw,1.2rem); line-height:1.6; opacity:var(--u-opacity, 0.92); margin:0; }
.wk-hero__actions{ display:flex; flex-wrap:wrap; gap:14px; margin-top:8px; align-items:center; }
.wk-hero__cta{ display:inline-flex; align-items:center; justify-content:center; gap:10px; font-family:var(--wk-ff-body); font-weight:600; font-size:13px; letter-spacing:0.04em; padding:15px 28px; background:var(--wk-accent); color:var(--wk-accent-ink,#fff); border:1.5px solid var(--wk-accent); border-radius:var(--u-radius, var(--wk-r)); text-decoration:none; white-space:nowrap; cursor:pointer; }
.wk-hero__cta-label{ display:inline; }
/* Second CTA — ghost/outline variant (transparent fill, current text colour). */
.wk-hero__cta--ghost{ background:transparent; color:var(--u-fg, var(--wk-on-dark)); border-color:currentColor; }
.wk-hero__cta--ghost:hover{ background:oklch(1 0 0 / 0.1); }
.wk-hero__socials{ display:flex; gap:18px; margin-top:4px; flex-wrap:wrap; }
.wk-hero__social{ color:inherit; text-decoration:none; font-family:var(--wk-ff-body); font-size:12px; letter-spacing:0.08em; text-transform:uppercase; opacity:0.85; }
.wk-hero__social:hover{ opacity:1; }
`;

// ── WorkHeroImage — full-bleed image background, CENTERED overlay content (a
// DISTINCT arrangement from the bottom-aligned slider). Video-bg is the reserved
// `WorkHeroVideo` SLOT; this is the still-image cover. Same hero CONTENT contract.
export const WORK_HERO_IMAGE_STYLES = `
.wk-hero-img{ position:relative; min-height:clamp(520px,82vh,860px); display:flex; align-items:center; justify-content:center; text-align:center; overflow:hidden; background:var(--u-bg, var(--wk-dark)); color:var(--u-fg, var(--wk-on-dark)); }
.wk-hero-img__media{ position:absolute; inset:0; z-index:0; }
.wk-hero-img__media img{ width:100%; height:100%; object-fit:cover; display:block; }
.wk-hero-img__ph{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:var(--wk-paper-2); color:var(--wk-ink-mute); font-family:var(--wk-ff-mono); font-size:12px; letter-spacing:0.2em; text-transform:uppercase; }
.wk-hero-img__scrim{ position:absolute; inset:0; z-index:1; background:rgba(0,0,0,0.5); }
.wk-hero-img__in{ position:relative; z-index:2; width:100%; max-width:min(760px, 92%); margin:0 auto; padding:calc(clamp(40px,7vw,96px) * var(--u-space-y, 1)) var(--wk-gutter); display:flex; flex-direction:column; align-items:center; gap:22px; }
.wk-hero-img__eyebrow{ font-family:var(--wk-ff-body); font-weight:600; font-size:11px; letter-spacing:0.16em; text-transform:uppercase; display:inline-flex; align-items:center; gap:10px; }
.wk-hero-img__eyebrow::before{ content:""; width:8px; height:8px; background:var(--wk-accent); border-radius:50%; flex:none; }
.wk-hero-img__name{ font-family:var(--wk-ff-display); font-weight:var(--wk-display-weight); font-size:clamp(2.6rem,7vw,5.4rem); line-height:0.96; letter-spacing:-0.02em; margin:0; }
.wk-hero-img__name em{ font-style:normal; color:var(--wk-accent); }
.wk-hero-img__quote{ max-width:52ch; font-size:clamp(1rem,1.6vw,1.2rem); line-height:1.6; opacity:var(--u-opacity, 0.92); margin:0; }
.wk-hero-img__actions{ display:flex; flex-wrap:wrap; gap:14px; margin-top:8px; align-items:center; justify-content:center; }
.wk-hero-img__cta{ display:inline-flex; align-items:center; justify-content:center; gap:10px; font-family:var(--wk-ff-body); font-weight:600; font-size:13px; letter-spacing:0.04em; padding:15px 28px; background:var(--wk-accent); color:var(--wk-accent-ink,#fff); border:1.5px solid var(--wk-accent); border-radius:var(--u-radius, var(--wk-r)); text-decoration:none; white-space:nowrap; cursor:pointer; }
.wk-hero-img__socials{ display:flex; gap:18px; margin-top:4px; flex-wrap:wrap; justify-content:center; }
.wk-hero-img__social{ color:inherit; text-decoration:none; font-family:var(--wk-ff-body); font-size:12px; letter-spacing:0.08em; text-transform:uppercase; opacity:0.85; }
.wk-hero-img__social:hover{ opacity:1; }
`;

// ── WorkHeroSplit — LeftTextRightImage editorial poster (Kontur/Pulse `.hero-grid`
// pattern). Text column on paper, portrait column on the right. Same hero contract.
export const WORK_HERO_SPLIT_STYLES = `
.wk-hero-split{ background:var(--u-bg, var(--wk-paper)); color:var(--u-fg, var(--wk-ink)); }
.wk-hero-split__in{ width:100%; max-width:var(--wk-wrap); margin:0 auto; padding:calc(var(--wk-sec-y) * var(--u-space-y, 1)) var(--wk-gutter); display:grid; grid-template-columns:1.05fr 0.95fr; gap:clamp(28px,5vw,72px); align-items:center; }
.wk-hero-split__copy{ display:flex; flex-direction:column; gap:20px; }
.wk-hero-split__eyebrow{ font-family:var(--wk-ff-body); font-weight:600; font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:var(--wk-ink-mute); display:inline-flex; align-items:center; gap:10px; }
.wk-hero-split__eyebrow::before{ content:""; width:8px; height:8px; background:var(--wk-accent); border-radius:50%; flex:none; }
.wk-hero-split__name{ font-family:var(--wk-ff-display); font-weight:var(--wk-display-weight); font-size:clamp(2.2rem,5vw,4rem); line-height:0.98; letter-spacing:-0.02em; margin:0; }
.wk-hero-split__name em{ font-style:normal; color:var(--wk-accent); }
.wk-hero-split__quote{ max-width:44ch; font-family:var(--wk-ff-body); font-size:var(--wk-fs-body); line-height:var(--wk-lh-body); color:var(--wk-ink-soft); opacity:var(--u-opacity, 1); margin:0; }
.wk-hero-split__actions{ display:flex; flex-wrap:wrap; gap:14px; margin-top:6px; align-items:center; }
.wk-hero-split__cta{ display:inline-flex; align-items:center; justify-content:center; gap:10px; font-family:var(--wk-ff-body); font-weight:600; font-size:13px; letter-spacing:0.04em; padding:15px 28px; background:var(--wk-accent); color:var(--wk-accent-ink,#fff); border:1.5px solid var(--wk-accent); border-radius:var(--u-radius, var(--wk-r)); text-decoration:none; white-space:nowrap; cursor:pointer; }
.wk-hero-split__media{ position:relative; aspect-ratio:4 / 5; overflow:hidden; border-radius:var(--u-radius, var(--wk-r)); background:var(--wk-paper-2); }
.wk-hero-split__media img{ width:100%; height:100%; object-fit:cover; display:block; }
.wk-hero-split__ph{ width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:var(--wk-ink-mute); font-family:var(--wk-ff-mono); font-size:11px; letter-spacing:0.2em; text-transform:uppercase; }
.wk-hero-split__socials{ display:flex; gap:18px; margin-top:4px; flex-wrap:wrap; }
.wk-hero-split__social{ color:inherit; text-decoration:none; font-family:var(--wk-ff-body); font-size:12px; letter-spacing:0.08em; text-transform:uppercase; opacity:0.85; }
.wk-hero-split__social:hover{ opacity:1; }
@media(max-width:820px){ .wk-hero-split__in{ grid-template-columns:1fr; } }
`;

// ── WorkHeroCenter — AllCenter typographic hero (no media), centered on paper.
// Same hero contract; portrait_image is intentionally not rendered here.
export const WORK_HERO_CENTER_STYLES = `
.wk-hero-center{ background:var(--u-bg, var(--wk-paper)); color:var(--u-fg, var(--wk-ink)); text-align:center; }
.wk-hero-center__in{ width:100%; max-width:820px; margin:0 auto; padding:calc(clamp(64px,10vw,140px) * var(--u-space-y, 1)) var(--wk-gutter); display:flex; flex-direction:column; align-items:center; gap:24px; }
.wk-hero-center__eyebrow{ font-family:var(--wk-ff-body); font-weight:600; font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:var(--wk-ink-mute); display:inline-flex; align-items:center; gap:10px; }
.wk-hero-center__eyebrow::before{ content:""; width:8px; height:8px; background:var(--wk-accent); border-radius:50%; flex:none; }
.wk-hero-center__name{ font-family:var(--wk-ff-display); font-weight:var(--wk-display-weight); font-size:clamp(2.6rem,6vw,4.6rem); line-height:0.98; letter-spacing:-0.02em; margin:0; }
.wk-hero-center__name em{ font-style:normal; color:var(--wk-accent); }
.wk-hero-center__quote{ max-width:52ch; font-family:var(--wk-ff-body); font-size:clamp(1rem,1.6vw,1.2rem); line-height:1.6; color:var(--wk-ink-soft); opacity:var(--u-opacity, 1); margin:0; }
.wk-hero-center__actions{ display:flex; flex-wrap:wrap; gap:14px; margin-top:6px; align-items:center; justify-content:center; }
.wk-hero-center__cta{ display:inline-flex; align-items:center; justify-content:center; gap:10px; font-family:var(--wk-ff-body); font-weight:600; font-size:13px; letter-spacing:0.04em; padding:15px 28px; background:var(--wk-accent); color:var(--wk-accent-ink,#fff); border:1.5px solid var(--wk-accent); border-radius:var(--u-radius, var(--wk-r)); text-decoration:none; white-space:nowrap; cursor:pointer; }
.wk-hero-center__socials{ display:flex; gap:18px; margin-top:4px; flex-wrap:wrap; justify-content:center; }
.wk-hero-center__social{ color:inherit; text-decoration:none; font-family:var(--wk-ff-body); font-size:12px; letter-spacing:0.08em; text-transform:uppercase; opacity:0.85; }
.wk-hero-center__social:hover{ opacity:1; }
`;
