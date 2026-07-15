// src/modules/skeletons/work/blocks/Header/styles.ts
// WorkHeader CSS (edit + published parity). `wk-header-` prefixed. Token-driven
// ONLY via CSS custom properties: SKIN tokens `var(--wk-*)` + USER style tokens
// `var(--u-*, <skeleton default>)`. Phase 4 wires the DEFAULT arrangement only
// (logo-left · nav-center · cta-right). The other 4 arrangements + sticky/fixed
// (`data-wk-header-mode`) land in phase 6. Ported from the Atelier "NAV" grammar.

export const WORK_HEADER_STYLES = `
.wk-header{ background:var(--u-bg, var(--wk-paper)); color:var(--u-fg, var(--wk-ink)); border-bottom:1px solid var(--wk-line); }
.wk-header__in{ width:100%; max-width:var(--wk-wrap); margin:0 auto; padding:18px var(--wk-gutter); display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:24px; }
.wk-header__logo{ display:inline-flex; align-items:center; gap:10px; text-decoration:none; color:inherit; font-family:var(--wk-ff-display); font-weight:var(--wk-display-weight); font-size:18px; letter-spacing:-0.01em; justify-self:start; }
.wk-header__logo img{ height:32px; width:auto; display:block; }
.wk-header__nav{ display:flex; align-items:center; gap:26px; justify-self:center; }
.wk-header__nav a{ color:inherit; text-decoration:none; font-family:var(--wk-ff-body); font-weight:600; font-size:12px; letter-spacing:0.08em; text-transform:uppercase; opacity:0.82; }
.wk-header__nav a:hover{ opacity:1; }
.wk-header__right{ display:flex; align-items:center; gap:14px; justify-self:end; }
.wk-header__cta{ display:inline-flex; align-items:center; justify-content:center; font-family:var(--wk-ff-body); font-weight:600; font-size:12px; letter-spacing:0.04em; padding:11px 20px; background:var(--wk-accent); color:var(--wk-accent-ink,#fff); border:1.5px solid var(--wk-accent); border-radius:var(--u-radius, var(--wk-r)); text-decoration:none; white-space:nowrap; cursor:pointer; }
@media(max-width:820px){ .wk-header__in{ grid-template-columns:1fr auto; } .wk-header__nav{ display:none; } }
`;
