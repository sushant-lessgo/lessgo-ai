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

// Shared head grammar for the alternate proof SHAPES (logos/results) — centered.
const PROOF_HEAD = (p: string) => `
.${p}{ background:var(--u-bg, var(--wk-paper-2)); color:var(--u-fg, var(--wk-ink)); }
.${p}__in{ width:100%; max-width:var(--wk-wrap); margin:0 auto; padding:calc(var(--wk-sec-y) * var(--u-space-y, 1)) var(--wk-gutter); }
.${p}__head{ text-align:center; margin-bottom:clamp(24px,3.4vw,48px); }
.${p}__eyebrow{ font-family:var(--wk-ff-body); font-weight:600; font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:var(--wk-ink-mute); }
.${p}__heading{ font-family:var(--wk-ff-display); font-weight:var(--wk-display-weight); font-size:clamp(1.6rem,3.4vw,2.6rem); line-height:1.06; letter-spacing:-0.02em; margin:10px 0 0; }
`;

// ── WorkProofLogos — a logo wall. DIFFERENT collection (`logos`) than the
// testimonials shape (`quotes`) → distinct copyShape, never blind-swapped.
export const WORK_PROOF_LOGOS_STYLES = `
${PROOF_HEAD('wk-proof-logos')}
.wk-proof-logos__grid{ display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:clamp(16px,2.4vw,36px); align-items:center; }
.wk-proof-logos__item{ position:relative; display:flex; flex-direction:column; align-items:center; gap:8px; padding:12px; }
.wk-proof-logos__media{ position:relative; width:100%; height:56px; display:flex; align-items:center; justify-content:center; }
.wk-proof-logos__media img{ max-height:48px; max-width:100%; width:auto; object-fit:contain; display:block; }
.wk-proof-logos__ph{ width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:var(--wk-ink-mute); font-family:var(--wk-ff-mono); font-size:10px; letter-spacing:0.16em; text-transform:uppercase; border:1px dashed var(--wk-line); border-radius:var(--u-radius, var(--wk-r)); }
.wk-proof-logos__name{ font-family:var(--wk-ff-body); font-size:11px; letter-spacing:0.06em; color:var(--wk-ink-mute); }
`;

// ── WorkProofResults — a big-number metrics row. DIFFERENT collection (`metrics`)
// than testimonials (`quotes`) → distinct copyShape, never blind-swapped.
export const WORK_PROOF_RESULTS_STYLES = `
${PROOF_HEAD('wk-proof-results')}
.wk-proof-results__grid{ display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:clamp(20px,3vw,48px); }
.wk-proof-results__item{ position:relative; text-align:center; }
.wk-proof-results__value{ display:block; font-family:var(--wk-ff-display); font-weight:var(--wk-display-weight); font-size:clamp(2.2rem,5vw,3.6rem); line-height:1; letter-spacing:-0.02em; color:var(--wk-accent); }
.wk-proof-results__label{ display:block; font-family:var(--wk-ff-body); font-size:13px; line-height:1.4; color:var(--wk-ink-soft); margin-top:10px; }
`;
