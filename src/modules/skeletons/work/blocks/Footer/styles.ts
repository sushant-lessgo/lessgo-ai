// src/modules/skeletons/work/blocks/Footer/styles.ts
// WorkFooter CSS (edit + published parity). `wk-footer-` prefixed. Token-driven
// ONLY via CSS custom properties: SKIN `var(--wk-*)` + USER `var(--u-*, <default>)`.
// Dark footer band (the work baseline surface). Harvested from the Atelier FOOTER.
//
// Wave 2A: the `footerWordmark` skin token expands (serializeSkinTokens) into
// `--wk-footer-wm-fs/-lh/-ls` + `--wk-footer-dot`, which restyle the heading into
// Atelier's giant footer wordmark (`.atl-footer-big .fw`) + accent dot. NEUTRAL
// defaults equal the current compact heading → byte-identical for a non-setting
// skin. Pure CSS on the existing markup → edit==published; no new contract field
// (the wordmark text reuses `heading`).

export const WORK_FOOTER_STYLES = `
.wk-footer{ background:var(--u-bg, var(--wk-dark)); color:var(--u-fg, var(--wk-on-dark)); }
.wk-footer__in{ width:100%; max-width:var(--wk-wrap); margin:0 auto; padding:calc(clamp(48px,6vw,88px) * var(--u-space-y, 1)) var(--wk-gutter) 40px; }
.wk-footer__top{ display:flex; flex-wrap:wrap; align-items:flex-end; justify-content:space-between; gap:28px; padding-bottom:32px; border-bottom:1px solid var(--wk-line-dark); }
.wk-footer__eyebrow{ font-family:var(--wk-ff-body); font-weight:600; font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:var(--wk-on-dark-soft); }
.wk-footer__heading{ font-family:var(--wk-ff-display); font-weight:var(--wk-display-weight); font-size:var(--wk-footer-wm-fs, clamp(1.7rem,4vw,3rem)); line-height:var(--wk-footer-wm-lh, 1.02); letter-spacing:var(--wk-footer-wm-ls, -0.02em); margin:10px 0 0; }
.wk-footer__heading::after{ content:"."; display:var(--wk-footer-dot, none); color:var(--wk-accent); }
.wk-footer__note{ font-family:var(--wk-ff-body); font-size:var(--wk-fs-body); line-height:var(--wk-lh-body); color:var(--wk-on-dark-soft); max-width:44ch; margin:0; }
.wk-footer__socials{ display:flex; flex-wrap:wrap; gap:20px; margin-top:28px; }
.wk-footer__social{ color:inherit; text-decoration:none; font-family:var(--wk-ff-body); font-size:12px; letter-spacing:0.08em; text-transform:uppercase; opacity:0.82; }
.wk-footer__social:hover{ opacity:1; }
.wk-footer__bottom{ margin-top:28px; font-family:var(--wk-ff-mono); font-size:11px; letter-spacing:0.06em; color:var(--wk-on-dark-soft); }
`;
