// src/modules/skeletons/work/blocks/Catalog/styles.ts
// WorkCatalog CSS (edit + published parity). `wk-catalog-` prefixed. Token-driven
// ONLY via CSS custom properties: SKIN `var(--wk-*)` + USER `var(--u-*, <default>)`.
// This is the `/works` INDEX: a covers grid (each cell = a project cover + name,
// linking to that project's `/works/<slug>` page). Same grammar as the home gallery
// grid (WorkGalleryGrid) so the two read as one family. Existing tokens only — reuses
// the gallery's RULE_HEAD (rule-header skin parity) + GALLERY_CAPTION (overlay caption
// skin parity) grammars, which are pure VAR-GATED CSS on the shared markup.

import { RULE_HEAD, GALLERY_CAPTION } from '../Gallery/styles';

export const WORK_CATALOG_STYLES = `
.wk-catalog{ background:var(--u-bg, var(--wk-paper)); color:var(--u-fg, var(--wk-ink)); }
.wk-catalog__in{ width:100%; max-width:var(--wk-wrap); margin:0 auto; padding:calc(var(--wk-sec-y) * var(--u-space-y, 1)) var(--wk-gutter); }
.wk-catalog__head{ margin-bottom:clamp(28px,4vw,56px); }
.wk-catalog__eyebrow{ font-family:var(--wk-ff-body); font-weight:600; font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:var(--wk-ink-mute); }
.wk-catalog__heading{ font-family:var(--wk-ff-display); font-weight:var(--wk-display-weight); font-size:clamp(1.9rem,4.4vw,3.4rem); line-height:1.02; letter-spacing:-0.02em; margin:10px 0 0; }
.wk-catalog__lead{ font-family:var(--wk-ff-body); font-size:var(--wk-fs-body); line-height:var(--wk-lh-body); color:var(--wk-ink-soft); max-width:52ch; margin:14px 0 0; }
.wk-catalog__grid{ display:grid; grid-template-columns:repeat(auto-fill, minmax(240px, 1fr)); gap:clamp(14px,2vw,26px); }
.wk-catalog__group{ position:relative; }
.wk-catalog__link{ display:block; text-decoration:none; color:inherit; }
.wk-catalog__media{ aspect-ratio:4 / 5; overflow:hidden; border-radius:var(--u-radius, var(--wk-r)); background:var(--wk-paper-2); }
.wk-catalog__media img{ width:100%; height:100%; object-fit:cover; display:block; }
.wk-catalog__ph{ width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:var(--wk-ink-mute); font-family:var(--wk-ff-mono); font-size:11px; letter-spacing:0.2em; text-transform:uppercase; }
.wk-catalog__name{ display:block; font-family:var(--wk-ff-display); font-weight:600; font-size:1.05rem; letter-spacing:-0.01em; margin-top:12px; }
${RULE_HEAD('wk-catalog', 'lead')}${GALLERY_CAPTION('wk-catalog')}`;
