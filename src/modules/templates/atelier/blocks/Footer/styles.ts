// Atelier Footer CSS — ported from the approved design (styles.css CLOSER +
// FOOTER; atl-* → lg-atelier-). Surface = dark-2 (the block does NOT paint its own
// full-bleed section background — colour comes from the section wrapper). The
// `.atl-closer` full-bleed CTA band is mapped INTO the footer scaffolding (above
// the footer proper) per the orchestrator ruling — no new registered section type.

import { HATCH_PLACEHOLDER_CSS } from '../shared/styles';

export const FOOTER_STYLES = `
${HATCH_PLACEHOLDER_CSS}
/* ---------- CLOSER (full-bleed CTA band, above the footer proper) ---------- */
.lg-atelier-closer{ position:relative; overflow:hidden; }
.lg-atelier-closer__bg{ position:absolute; inset:0; z-index:0; }
.lg-atelier-closer__img{ position:relative; display:block; width:100%; height:100%; }
.lg-atelier-closer__img img{ width:100%; height:100%; object-fit:cover; display:block; }
.lg-atelier-closer::after{ content:""; position:absolute; inset:0; background:oklch(0.13 0.01 60 / 0.62); z-index:1; }
.lg-atelier-closer-in{ position:relative; z-index:2; padding:calc(clamp(80px,12vw,170px) * var(--space)) var(--gutter); max-width:var(--wrap); margin:0 auto; text-align:center; display:flex; flex-direction:column; align-items:center; }
.lg-atelier-closer__h2{ color:#fff; font-size:clamp(38px,6.5vw,100px); font-weight:700; letter-spacing:-0.04em; max-width:16ch; margin-top:20px; }
.lg-atelier-closer__h2 em{ font-style:normal; color:var(--accent); }
.lg-atelier-closer__lede{ color:oklch(0.9 0.01 90); font-size:clamp(16px,1.8vw,19px); font-weight:300; max-width:48ch; margin:24px 0 0; }
.lg-atelier-closer-actions{ display:flex; flex-wrap:wrap; justify-content:center; gap:12px; margin-top:38px; }

/* ---------- FOOTER proper ---------- */
.lg-atelier-footer{ color:oklch(0.8 0.01 90 / 0.85); }
.lg-atelier-footer-big{ padding:calc(clamp(50px,7vw,100px) * var(--space)) var(--gutter) calc(30px * var(--space)); max-width:var(--wrap); margin:0 auto; }
.lg-atelier-fw{ font-family:var(--ff-display); font-weight:700; font-size:clamp(48px,11vw,170px); letter-spacing:-0.04em; line-height:0.85; color:var(--paper); }
.lg-atelier-fw .dot{ color:var(--accent); }
.lg-atelier-footer-cols{ display:grid; grid-template-columns:1.6fr 1fr 1fr; gap:40px; padding:calc(clamp(36px,4vw,56px) * var(--space)) var(--gutter); max-width:var(--wrap); margin:0 auto; border-top:1px solid var(--line-dark); }
.lg-atelier-footer__desc{ font-size:14px; line-height:1.8; max-width:36ch; margin:0 0 18px; }
.lg-atelier-footer-contact{ font-size:13.5px; line-height:2; color:oklch(0.8 0.01 90 / 0.85); }
.lg-atelier-footer-contact b{ color:var(--accent); font-weight:600; }
.lg-atelier-footer h4{ font-family:var(--ff-body); font-weight:600; font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:var(--accent); margin:0 0 18px; }
.lg-atelier-footer-links{ display:flex; flex-direction:column; gap:12px; }
.lg-atelier-footer-links > *{ font-size:14px; }
.lg-atelier-footer-links a{ color:oklch(0.8 0.01 90 / 0.85); text-decoration:none; }
.lg-atelier-footer-links a:hover{ color:var(--paper); }
.lg-atelier-footer-bottom{ border-top:1px solid var(--line-dark); padding:20px var(--gutter); max-width:var(--wrap); margin:0 auto; display:flex; flex-wrap:wrap; gap:12px 26px; align-items:center; justify-content:space-between; font-size:11px; letter-spacing:0.1em; text-transform:uppercase; }
.lg-atelier-footer-bottom a{ color:inherit; text-decoration:none; }
.lg-atelier-footer-bottom a:hover{ color:var(--paper); }

@media(max-width:900px){ .lg-atelier-footer-cols{ grid-template-columns:1fr 1fr; gap:32px 24px; } }
@media(max-width:560px){
  .lg-atelier-closer-actions .lg-atelier-btn{ flex:1; }
  .lg-atelier-footer-cols{ grid-template-columns:1fr; }
}
`;
