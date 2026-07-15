// src/modules/skeletons/work/blocks/Packages/styles.ts
// WorkPackages CSS (edit + published parity). `wk-packages-` prefixed. Token-driven
// ONLY via CSS custom properties: SKIN `var(--wk-*)` + USER `var(--u-*, <default>)`.
// A priced-services card grid (the conviction pillar — "on request" is a legal
// price answer). price_mode drives whether a "from" affix precedes the price line.

export const WORK_PACKAGES_STYLES = `
.wk-packages{ background:var(--u-bg, var(--wk-paper)); color:var(--u-fg, var(--wk-ink)); }
.wk-packages__in{ width:100%; max-width:var(--wk-wrap); margin:0 auto; padding:calc(var(--wk-sec-y) * var(--u-space-y, 1)) var(--wk-gutter); }
.wk-packages__head{ margin-bottom:clamp(28px,4vw,56px); }
.wk-packages__eyebrow{ font-family:var(--wk-ff-body); font-weight:600; font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:var(--wk-ink-mute); }
.wk-packages__heading{ font-family:var(--wk-ff-display); font-weight:var(--wk-display-weight); font-size:clamp(1.9rem,4.4vw,3.4rem); line-height:1.02; letter-spacing:-0.02em; margin:10px 0 0; }
.wk-packages__lead{ font-family:var(--wk-ff-body); font-size:var(--wk-fs-body); line-height:var(--wk-lh-body); color:var(--wk-ink-soft); max-width:52ch; margin:14px 0 0; }
.wk-packages__grid{ display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:clamp(16px,2.4vw,30px); }
.wk-packages__card{ display:flex; flex-direction:column; gap:14px; background:var(--wk-paper); border:1px solid var(--wk-line); border-radius:var(--u-radius, var(--wk-r)); padding:clamp(22px,2.6vw,34px); }
.wk-packages__name{ font-family:var(--wk-ff-display); font-weight:600; font-size:1.25rem; letter-spacing:-0.01em; }
.wk-packages__price{ display:flex; align-items:baseline; gap:8px; font-family:var(--wk-ff-display); font-weight:var(--wk-display-weight); font-size:1.7rem; letter-spacing:-0.02em; color:var(--wk-accent); }
.wk-packages__from{ font-family:var(--wk-ff-body); font-weight:600; font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:var(--wk-ink-mute); }
.wk-packages__desc{ font-family:var(--wk-ff-body); font-size:var(--wk-fs-body); line-height:var(--wk-lh-body); color:var(--wk-ink-soft); flex:1 1 auto; }
.wk-packages__cta{ align-self:flex-start; font-family:var(--wk-ff-body); font-weight:600; font-size:13px; letter-spacing:0.02em; color:var(--wk-accent); text-decoration:none; border-bottom:1px solid var(--wk-accent); padding-bottom:2px; }
`;
