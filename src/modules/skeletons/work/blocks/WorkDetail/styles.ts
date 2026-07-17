// src/modules/skeletons/work/blocks/WorkDetail/styles.ts
// WorkDetail CSS (edit + published parity). `wk-detail-` prefixed. Token-driven
// ONLY via CSS custom properties: SKIN `var(--wk-*)` + USER `var(--u-*, <default>)`.
// This is the `/works/<slug>` PROJECT-STORY page: a title, an optional
// client/problem/result meta strip (carry-only, may be empty), and a photo GRID
// seeded from the `photos` collection. A FLAT photo list is CORRECT here — the
// group-references-only invariant is the home GALLERY's (galleryGroups.test), not
// this surface. Existing tokens only (no new design token). The head is a plain
// stacked title+meta (NOT the eyebrow/heading/lead rule-head grammar), so it does
// not consume the RULE_HEAD vars.

export const WORK_DETAIL_STYLES = `
.wk-detail{ background:var(--u-bg, var(--wk-paper)); color:var(--u-fg, var(--wk-ink)); }
.wk-detail__in{ width:100%; max-width:var(--wk-wrap); margin:0 auto; padding:calc(var(--wk-sec-y) * var(--u-space-y, 1)) var(--wk-gutter); }
.wk-detail__head{ margin-bottom:clamp(24px,3.5vw,44px); }
.wk-detail__title{ font-family:var(--wk-ff-display); font-weight:var(--wk-display-weight); font-size:clamp(2rem,5vw,3.6rem); line-height:1.02; letter-spacing:-0.02em; margin:0; }
.wk-detail__meta{ display:flex; flex-wrap:wrap; gap:14px 40px; margin:20px 0 0; }
.wk-detail__meta-row{ display:flex; flex-direction:column; gap:4px; }
.wk-detail__meta-label{ font-family:var(--wk-ff-body); font-weight:600; font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:var(--wk-ink-mute); }
.wk-detail__meta-value{ font-family:var(--wk-ff-body); font-size:var(--wk-fs-body); line-height:var(--wk-lh-body); color:var(--wk-ink-soft); max-width:46ch; }
.wk-detail__grid{ display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:clamp(12px,1.6vw,22px); }
.wk-detail__cell{ position:relative; }
.wk-detail__media{ aspect-ratio:4 / 5; overflow:hidden; border-radius:var(--u-radius, var(--wk-r)); background:var(--wk-paper-2); }
.wk-detail__media img{ width:100%; height:100%; object-fit:cover; display:block; }
.wk-detail__ph{ width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:var(--wk-ink-mute); font-family:var(--wk-ff-mono); font-size:11px; letter-spacing:0.2em; text-transform:uppercase; }
`;
