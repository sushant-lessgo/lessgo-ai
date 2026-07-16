// src/modules/skeletons/work/blocks/Contact/styles.ts
// WorkContact CSS (edit + published parity). `wk-contact-` prefixed. Token-driven
// ONLY via CSS custom properties: SKIN `var(--wk-*)` + USER `var(--u-*, <default>)`.
// 2-col: copy / bordered form card. The form itself arrives as a prebuilt formNode
// from each wrapper (edit inert preview / published real <form data-lessgo-form>),
// like Atelier/Vestria/TechPremium. Harvested from the Atelier CONTACT styles.

export const WORK_CONTACT_STYLES = `
.wk-contact{ background:var(--u-bg, var(--wk-paper)); color:var(--u-fg, var(--wk-ink)); }
.wk-contact__in{ width:100%; max-width:var(--wk-wrap); margin:0 auto; padding:calc(var(--wk-sec-y) * var(--u-space-y, 1)) var(--wk-gutter); display:grid; grid-template-columns:1fr 1fr; gap:clamp(36px,5vw,80px); align-items:start; }
.wk-contact__copy .wk-contact__eyebrow{ font-family:var(--wk-ff-body); font-weight:600; font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:var(--wk-ink-mute); }
.wk-contact__heading{ font-family:var(--wk-ff-display); font-weight:var(--wk-display-weight); font-size:clamp(1.9rem,4.2vw,3.2rem); line-height:1.02; letter-spacing:-0.02em; margin:14px 0 0; }
.wk-contact__lead{ font-family:var(--wk-ff-body); font-size:var(--wk-fs-body); line-height:var(--wk-lh-body); color:var(--wk-ink-soft); max-width:42ch; margin:18px 0 0; }
.wk-contact__cta-wrap{ margin-top:26px; }
.wk-contact__cta{ display:inline-flex; align-items:center; justify-content:center; font-family:var(--wk-ff-body); font-weight:600; font-size:13px; letter-spacing:0.04em; padding:15px 28px; background:var(--wk-accent); color:var(--wk-accent-ink,#fff); border:1.5px solid var(--wk-accent); border-radius:var(--u-radius, var(--wk-r)); text-decoration:none; cursor:pointer; }

.wk-contact-form{ border:1.5px solid var(--wk-ink); padding:clamp(24px,3.4vw,40px); display:grid; gap:20px; background:var(--wk-paper); border-radius:var(--u-radius, var(--wk-r)); }
.wk-contact-field{ display:grid; gap:8px; }
.wk-contact-form label{ font-family:var(--wk-ff-body); font-weight:600; font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:var(--wk-ink-mute); }
.wk-contact-req{ color:var(--wk-accent); margin-left:3px; }
.wk-contact-form input, .wk-contact-form textarea, .wk-contact-form select{ font-family:var(--wk-ff-body); font-weight:400; font-size:15px; color:var(--wk-ink); background:var(--wk-paper); border:1px solid var(--wk-line); border-radius:var(--wk-r); padding:13px 14px; width:100%; transition:border-color .2s; }
.wk-contact-form input:focus, .wk-contact-form textarea:focus, .wk-contact-form select:focus{ outline:none; border-color:var(--wk-accent); }
.wk-contact-form textarea{ min-height:120px; resize:vertical; }
.wk-contact-submit{ display:inline-flex; align-items:center; justify-content:center; width:100%; font-family:var(--wk-ff-body); font-weight:600; font-size:13px; letter-spacing:0.04em; padding:15px 28px; background:var(--wk-accent); color:var(--wk-accent-ink,#fff); border:1.5px solid var(--wk-accent); border-radius:var(--wk-r); cursor:pointer; }
.wk-contact-form__note{ font-family:var(--wk-ff-body); font-size:12px; color:var(--wk-ink-mute); margin:0; }

@media(max-width:900px){ .wk-contact__in{ grid-template-columns:1fr; gap:40px; } }
`;
