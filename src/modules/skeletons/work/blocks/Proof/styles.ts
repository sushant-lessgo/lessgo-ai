// src/modules/skeletons/work/blocks/Proof/styles.ts
// WorkProofTestimonials CSS (edit + published parity). `wk-proof-` prefixed.
// Token-driven ONLY via CSS custom properties: SKIN `var(--wk-*)` + USER
// `var(--u-*, <default>)`. Verbatim-quote grid (the default proof shape).

export const WORK_PROOF_STYLES = `
.wk-proof{ background:var(--u-bg, var(--wk-paper-2)); color:var(--u-fg, var(--wk-ink)); }
.wk-proof__in{ width:100%; max-width:var(--wk-wrap); margin:0 auto; padding:calc(var(--wk-sec-y) * var(--u-space-y, 1)) var(--wk-gutter); }
.wk-proof__head{ margin-bottom:clamp(24px,3.4vw,48px); }
.wk-proof__eyebrow{ font-family:var(--wk-ff-body); font-weight:600; font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:var(--wk-ink-mute); }
.wk-proof__heading{ font-family:var(--wk-ff-display); font-weight:var(--wk-display-weight); font-size:clamp(1.7rem,3.8vw,3rem); line-height:1.04; letter-spacing:-0.02em; margin:10px 0 0; }
.wk-proof__awards{ font-family:var(--wk-ff-body); font-size:13px; color:var(--wk-ink-soft); margin:12px 0 0; }
.wk-proof__grid{ display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:clamp(16px,2.2vw,30px); }
.wk-proof__card{ background:var(--wk-paper); border:1px solid var(--wk-line); border-radius:var(--u-radius, var(--wk-r)); padding:clamp(20px,2.4vw,32px); display:flex; flex-direction:column; gap:16px; }
.wk-proof__quote{ font-family:var(--wk-ff-display); font-size:1.15rem; line-height:1.45; letter-spacing:-0.01em; opacity:var(--u-opacity, 1); margin:0; }
.wk-proof__source{ font-family:var(--wk-ff-body); font-weight:600; font-size:12px; letter-spacing:0.06em; text-transform:uppercase; color:var(--wk-ink-mute); margin:0; }
`;
