// src/modules/skeletons/work/blocks/Gallery/styles.ts
// WorkGalleryGrid CSS (edit + published parity). `wk-gallery-` prefixed. Token-
// driven ONLY via CSS custom properties: SKIN `var(--wk-*)` + USER `var(--u-*,
// <default>)`. Renders GROUP references (category cover + name) — NEVER a flat
// embedded photo list (AC L120; the photos live in the works collection, not here).
// Ported from the Atelier home-mosaic grammar.
//
// RULE_HEAD (Wave 2A): additive, VAR-GATED rule-header grammar shared by every
// work section head. NEUTRAL defaults (from serializeSkinTokens for a non-setting
// skin) render byte-identical to the stacked head; only `sectionHeaderStyle:'rule'`
// flips it to Atelier's `.atl-rule` (2px top rule + accent index numeral + h2 +
// right-aligned eyebrow meta). Pure CSS — no markup change → edit==published. The
// index is a CSS counter (`wk-sec`, auto 01/02… in document order); in plain mode
// the ::before is display:none so it neither renders nor increments (byte-neutral).
// `meta` = the third head line that drops below the rule row (lead/awards); omit
// for heads without one.
export const RULE_HEAD = (p: string, meta?: string) => `
.${p}__head{ display:var(--wk-sec-head-display, block); flex-wrap:wrap; align-items:baseline; gap:12px 20px; border-top:var(--wk-sec-head-bw, 0) solid currentColor; padding-top:var(--wk-sec-head-pt, 0); }
.${p}__head::before{ content:counter(wk-sec, decimal-leading-zero); display:var(--wk-sec-head-num, none); counter-increment:wk-sec; order:0; font-family:var(--wk-ff-mono); font-weight:500; font-size:14px; letter-spacing:0.04em; color:var(--wk-accent); }
.${p}__heading{ order:1; }
.${p}__eyebrow{ order:2; margin-left:var(--wk-sec-head-meta-ml, 0); }${meta ? `
.${p}__${meta}{ order:3; flex-basis:100%; }` : ''}
`;

// GALLERY_CAPTION (Wave 2B): additive, VAR-GATED overlay-caption grammar shared by
// every gallery shape. NEUTRAL defaults (from serializeSkinTokens for a non-setting
// skin) render byte-identical to the stacked name-below; only `galleryCaption:'overlay'`
// flips it to Atelier's `.atl-gcell` — the group name OVERLAID on the cover (accent
// dot + name on a bottom gradient) with a hover-scale. Pure CSS on the existing
// markup (name is a sibling of the media inside the group link) → edit==published.
// In `below` mode `position:static` + `display:none` pseudo-elements + `scale(1)`
// make every added rule inert (the name keeps its 12px margin-below, ink colour).
export const GALLERY_CAPTION = (p: string) => `
.${p}__link{ position:relative; }
.${p}__media{ position:relative; }
.${p}__media::after{ content:""; position:absolute; inset:0; z-index:1; pointer-events:none; display:var(--wk-gal-grad-display, none); background:linear-gradient(180deg, transparent 55%, rgba(20,16,13,0.55)); }
.${p}__media img{ transition:transform .9s cubic-bezier(.2,.7,.2,1); }
.${p}__group:hover .${p}__media img{ transform:scale(var(--wk-gal-hover-scale, 1)); }
.${p}__name{ position:var(--wk-gal-cap-pos, static); left:14px; right:14px; bottom:12px; z-index:2; margin-top:var(--wk-gal-cap-mt, 12px); color:var(--wk-gal-cap-color, inherit); }
.${p}__name::before{ content:""; display:var(--wk-gal-dot-display, none); width:7px; height:7px; margin-right:8px; border-radius:50%; background:var(--wk-accent); vertical-align:middle; }
`;

export const WORK_GALLERY_STYLES = `
.wk-gallery{ background:var(--u-bg, var(--wk-paper)); color:var(--u-fg, var(--wk-ink)); }
.wk-gallery__in{ width:100%; max-width:var(--wk-wrap); margin:0 auto; padding:calc(var(--wk-sec-y) * var(--u-space-y, 1)) var(--wk-gutter); }
.wk-gallery__head{ margin-bottom:clamp(28px,4vw,56px); }
.wk-gallery__eyebrow{ font-family:var(--wk-ff-body); font-weight:600; font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:var(--wk-ink-mute); }
.wk-gallery__heading{ font-family:var(--wk-ff-display); font-weight:var(--wk-display-weight); font-size:clamp(1.9rem,4.4vw,3.4rem); line-height:1.02; letter-spacing:-0.02em; margin:10px 0 0; }
.wk-gallery__lead{ font-family:var(--wk-ff-body); font-size:var(--wk-fs-body); line-height:var(--wk-lh-body); color:var(--wk-ink-soft); max-width:52ch; margin:14px 0 0; }
.wk-gallery__grid{ display:grid; grid-template-columns:repeat(auto-fill, minmax(240px, 1fr)); gap:clamp(14px,2vw,26px); }
.wk-gallery__group{ position:relative; }
.wk-gallery__link{ display:block; text-decoration:none; color:inherit; }
.wk-gallery__media{ aspect-ratio:4 / 5; overflow:hidden; border-radius:var(--u-radius, var(--wk-r)); background:var(--wk-paper-2); }
.wk-gallery__media img{ width:100%; height:100%; object-fit:cover; display:block; }
.wk-gallery__ph{ width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:var(--wk-ink-mute); font-family:var(--wk-ff-mono); font-size:11px; letter-spacing:0.2em; text-transform:uppercase; }
.wk-gallery__name{ display:block; font-family:var(--wk-ff-display); font-weight:600; font-size:1.05rem; letter-spacing:-0.01em; margin-top:12px; }
.wk-gallery__manage{ margin-top:22px; }
.wk-gallery__manage a{ font-family:var(--wk-ff-body); font-size:12px; letter-spacing:0.06em; color:var(--wk-accent); text-decoration:none; border-bottom:1px dashed var(--wk-accent); }
${RULE_HEAD('wk-gallery', 'lead')}${GALLERY_CAPTION('wk-gallery')}`;

// Shared head styling for the alternate gallery shapes (masonry/strip) — same
// eyebrow/heading/lead grammar as the grid, re-prefixed per shape below.
const GALLERY_HEAD = (p: string) => `
.${p}{ background:var(--u-bg, var(--wk-paper)); color:var(--u-fg, var(--wk-ink)); }
.${p}__in{ width:100%; max-width:var(--wk-wrap); margin:0 auto; padding:calc(var(--wk-sec-y) * var(--u-space-y, 1)) var(--wk-gutter); }
.${p}__head{ margin-bottom:clamp(28px,4vw,56px); }
.${p}__eyebrow{ font-family:var(--wk-ff-body); font-weight:600; font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:var(--wk-ink-mute); }
.${p}__heading{ font-family:var(--wk-ff-display); font-weight:var(--wk-display-weight); font-size:clamp(1.9rem,4.4vw,3.4rem); line-height:1.02; letter-spacing:-0.02em; margin:10px 0 0; }
.${p}__lead{ font-family:var(--wk-ff-body); font-size:var(--wk-fs-body); line-height:var(--wk-lh-body); color:var(--wk-ink-soft); max-width:52ch; margin:14px 0 0; }
.${p}__link{ display:block; text-decoration:none; color:inherit; }
.${p}__ph{ width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:var(--wk-ink-mute); font-family:var(--wk-ff-mono); font-size:11px; letter-spacing:0.2em; text-transform:uppercase; }
.${p}__name{ display:block; font-family:var(--wk-ff-display); font-weight:600; font-size:1.05rem; letter-spacing:-0.01em; margin-top:12px; }
.${p}__manage{ margin-top:22px; }
.${p}__manage a{ font-family:var(--wk-ff-body); font-size:12px; letter-spacing:0.06em; color:var(--wk-accent); text-decoration:none; border-bottom:1px dashed var(--wk-accent); }
`;

// ── WorkGalleryMasonry — CSS-columns masonry of group covers (varied heights).
// Same `groups` collection + AC-L120 group-reference contract as the grid.
// NOTE (Wave 2B): the mosaic uses a deterministic CSS GRID (not CSS multicol).
// Multicol balances by CONTENT HEIGHT, and the editor's inline-edit affordances give
// its items a different min-content width than the published static items, so the two
// renderers pick a DIFFERENT column count (edit collapses to fewer, wider columns) —
// an edit↔published parity break the isolated harness catches. A fixed-track grid is
// column-count-stable in both renderers. Varied-height packing (true masonry) is the
// trade-off; captured as a cross-track note. Mirrors Atelier's own home `.atl-mosaic`
// (which is grid, not columns).
export const WORK_GALLERY_MASONRY_STYLES = `
${GALLERY_HEAD('wk-gallery-masonry')}
.wk-gallery-masonry__grid{ display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:clamp(14px,2vw,26px); align-items:start; }
@media(max-width:820px){ .wk-gallery-masonry__grid{ grid-template-columns:repeat(2, minmax(0, 1fr)); } }
@media(max-width:520px){ .wk-gallery-masonry__grid{ grid-template-columns:1fr; } }
.wk-gallery-masonry__group{ position:relative; }
.wk-gallery-masonry__media{ position:relative; overflow:hidden; border-radius:var(--u-radius, var(--wk-r)); background:var(--wk-paper-2); display:block; }
.wk-gallery-masonry__media img{ width:100%; height:auto; display:block; }
.wk-gallery-masonry__img{ display:block; }
.wk-gallery-masonry__media .wk-gallery-masonry__ph{ aspect-ratio:4 / 5; }
${RULE_HEAD('wk-gallery-masonry', 'lead')}${GALLERY_CAPTION('wk-gallery-masonry')}`;

// ── WorkGalleryStrip — horizontal scroll row of group covers (Pulse .archive-list
// horizontal read). Same `groups` collection + group-reference contract.
export const WORK_GALLERY_STRIP_STYLES = `
${GALLERY_HEAD('wk-gallery-strip')}
.wk-gallery-strip__grid{ display:flex; gap:clamp(14px,2vw,26px); overflow-x:auto; padding-bottom:10px; scroll-snap-type:x mandatory; }
.wk-gallery-strip__group{ position:relative; flex:0 0 clamp(220px,30vw,300px); scroll-snap-align:start; }
.wk-gallery-strip__media{ position:relative; aspect-ratio:3 / 4; overflow:hidden; border-radius:var(--u-radius, var(--wk-r)); background:var(--wk-paper-2); display:block; }
.wk-gallery-strip__media img{ width:100%; height:100%; object-fit:cover; display:block; }
.wk-gallery-strip__img{ display:block; width:100%; height:100%; }
${RULE_HEAD('wk-gallery-strip', 'lead')}${GALLERY_CAPTION('wk-gallery-strip')}`;
