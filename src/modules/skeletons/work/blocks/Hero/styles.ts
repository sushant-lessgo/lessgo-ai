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
.wk-hero{ position:relative; min-height:clamp(520px,82vh,860px); display:flex; align-items:flex-end; overflow:hidden; background:var(--u-bg, var(--wk-dark)); color:var(--u-fg, var(--wk-on-dark)); }
.wk-hero__media{ position:absolute; inset:0; z-index:0; }
.wk-hero__media img{ width:100%; height:100%; object-fit:cover; display:block; }
.wk-hero__ph{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:var(--wk-paper-2); color:var(--wk-ink-mute); font-family:var(--wk-ff-mono); font-size:12px; letter-spacing:0.2em; text-transform:uppercase; }
.wk-hero__scrim{ position:absolute; inset:0; z-index:1; background:linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.35)); }
.wk-hero__in{ position:relative; z-index:2; width:100%; max-width:var(--wk-wrap); margin:0 auto; padding:calc(clamp(40px,7vw,96px) * var(--u-space-y, 1)) var(--wk-gutter); display:flex; flex-direction:column; gap:22px; }
.wk-hero__eyebrow{ font-family:var(--wk-ff-body); font-weight:600; font-size:11px; letter-spacing:0.16em; text-transform:uppercase; display:inline-flex; align-items:center; gap:10px; }
.wk-hero__eyebrow::before{ content:""; width:8px; height:8px; background:var(--wk-accent); border-radius:50%; flex:none; }
.wk-hero__name{ font-family:var(--wk-ff-display); font-weight:var(--wk-display-weight); font-size:clamp(2.6rem,7vw,5.4rem); line-height:0.94; letter-spacing:-0.02em; margin:0; }
.wk-hero__name em{ font-style:normal; color:var(--wk-accent); }
.wk-hero__quote{ max-width:44ch; font-size:clamp(1rem,1.6vw,1.2rem); line-height:1.6; opacity:var(--u-opacity, 0.92); margin:0; }
.wk-hero__actions{ display:flex; flex-wrap:wrap; gap:14px; margin-top:8px; align-items:center; }
.wk-hero__cta{ display:inline-flex; align-items:center; justify-content:center; gap:10px; font-family:var(--wk-ff-body); font-weight:600; font-size:13px; letter-spacing:0.04em; padding:15px 28px; background:var(--wk-accent); color:var(--wk-accent-ink,#fff); border:1.5px solid var(--wk-accent); border-radius:var(--u-radius, var(--wk-r)); text-decoration:none; white-space:nowrap; cursor:pointer; }
.wk-hero__cta-label{ display:inline; }
.wk-hero__socials{ display:flex; gap:18px; margin-top:4px; flex-wrap:wrap; }
.wk-hero__social{ color:inherit; text-decoration:none; font-family:var(--wk-ff-body); font-size:12px; letter-spacing:0.08em; text-transform:uppercase; opacity:0.85; }
.wk-hero__social:hover{ opacity:1; }
`;
