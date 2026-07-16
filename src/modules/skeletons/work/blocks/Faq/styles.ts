// src/modules/skeletons/work/blocks/Faq/styles.ts
// WorkFaq CSS (edit + published parity). `wk-faq-` prefixed. Token-driven ONLY via
// CSS custom properties: SKIN `var(--wk-*)` + USER `var(--u-*, <default>)`. A plain
// question/answer list (no JS — static, so edit == published by construction).

export const WORK_FAQ_STYLES = `
.wk-faq{ background:var(--u-bg, var(--wk-paper)); color:var(--u-fg, var(--wk-ink)); }
.wk-faq__in{ width:100%; max-width:min(880px, var(--wk-wrap)); margin:0 auto; padding:calc(var(--wk-sec-y) * var(--u-space-y, 1)) var(--wk-gutter); }
.wk-faq__head{ margin-bottom:clamp(24px,3.4vw,48px); }
.wk-faq__eyebrow{ font-family:var(--wk-ff-body); font-weight:600; font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:var(--wk-ink-mute); }
.wk-faq__heading{ font-family:var(--wk-ff-display); font-weight:var(--wk-display-weight); font-size:clamp(1.7rem,3.8vw,2.8rem); line-height:1.04; letter-spacing:-0.02em; margin:10px 0 0; }
.wk-faq__list{ display:flex; flex-direction:column; gap:0; }
.wk-faq__item{ position:relative; padding:clamp(18px,2.2vw,26px) 0; border-top:1px solid var(--wk-line); }
.wk-faq__q{ font-family:var(--wk-ff-display); font-weight:600; font-size:1.15rem; line-height:1.3; letter-spacing:-0.01em; margin:0; }
.wk-faq__a{ font-family:var(--wk-ff-body); font-size:var(--wk-fs-body); line-height:var(--wk-lh-body); color:var(--wk-ink-soft); margin:10px 0 0; }
`;
