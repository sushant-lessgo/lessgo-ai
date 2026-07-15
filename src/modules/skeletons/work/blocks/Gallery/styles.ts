// src/modules/skeletons/work/blocks/Gallery/styles.ts
// WorkGalleryGrid CSS (edit + published parity). `wk-gallery-` prefixed. Token-
// driven ONLY via CSS custom properties: SKIN `var(--wk-*)` + USER `var(--u-*,
// <default>)`. Renders GROUP references (category cover + name) — NEVER a flat
// embedded photo list (AC L120; the photos live in the works collection, not here).
// Ported from the Atelier home-mosaic grammar.

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
`;

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
export const WORK_GALLERY_MASONRY_STYLES = `
${GALLERY_HEAD('wk-gallery-masonry')}
.wk-gallery-masonry__grid{ columns:3 260px; column-gap:clamp(14px,2vw,26px); }
.wk-gallery-masonry__group{ position:relative; break-inside:avoid; margin:0 0 clamp(14px,2vw,26px); }
.wk-gallery-masonry__media{ position:relative; overflow:hidden; border-radius:var(--u-radius, var(--wk-r)); background:var(--wk-paper-2); display:block; }
.wk-gallery-masonry__media img{ width:100%; height:auto; display:block; }
.wk-gallery-masonry__img{ display:block; }
.wk-gallery-masonry__media .wk-gallery-masonry__ph{ aspect-ratio:4 / 5; }
`;

// ── WorkGalleryStrip — horizontal scroll row of group covers (Pulse .archive-list
// horizontal read). Same `groups` collection + group-reference contract.
export const WORK_GALLERY_STRIP_STYLES = `
${GALLERY_HEAD('wk-gallery-strip')}
.wk-gallery-strip__grid{ display:flex; gap:clamp(14px,2vw,26px); overflow-x:auto; padding-bottom:10px; scroll-snap-type:x mandatory; }
.wk-gallery-strip__group{ position:relative; flex:0 0 clamp(220px,30vw,300px); scroll-snap-align:start; }
.wk-gallery-strip__media{ position:relative; aspect-ratio:3 / 4; overflow:hidden; border-radius:var(--u-radius, var(--wk-r)); background:var(--wk-paper-2); display:block; }
.wk-gallery-strip__media img{ width:100%; height:100%; object-fit:cover; display:block; }
.wk-gallery-strip__img{ display:block; width:100%; height:100%; }
`;
