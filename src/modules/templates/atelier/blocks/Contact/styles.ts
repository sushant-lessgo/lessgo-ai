// Atelier Contact CSS — ported from the approved design (styles.css CONTACT;
// atl-* → lg-atelier-). 2-col: copy + detail rows / bordered form card. The form
// itself arrives as a prebuilt formNode from each wrapper (edit inert preview /
// published real <form data-lessgo-form>), like Vestria/TechPremium. Surface = paper.

export const CONTACT_STYLES = `
.lg-atelier-contact{ display:grid; grid-template-columns:1fr 1fr; gap:clamp(36px,5vw,80px); align-items:start; }
.lg-atelier-contact-copy h2{ font-family:var(--ff-display); font-size:clamp(30px,4.4vw,56px); font-weight:600; letter-spacing:-0.03em; margin:20px 0 0; line-height:0.98; }
.lg-atelier-contact-copy h2 em{ font-style:normal; color:var(--accent-deep); }
.lg-atelier-contact-copy .lg-atelier-lede{ margin:22px 0 32px; max-width:42ch; }
.lg-atelier-cd{ border-top:1px solid var(--ink); }
.lg-atelier-cd-row{ display:grid; grid-template-columns:130px 1fr; gap:16px; padding:16px 0; border-bottom:1px solid var(--line); align-items:baseline; }
.lg-atelier-cd-row .k{ font-weight:600; font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:var(--ink-mute); }
.lg-atelier-cd-row .v{ font-size:16px; }
.lg-atelier-cd-row .v.v-strong{ font-family:var(--ff-display); font-weight:600; font-size:19px; letter-spacing:-0.01em; }

.lg-atelier-form{ border:1.5px solid var(--ink); padding:calc(clamp(24px,3.4vw,40px) * var(--space)); display:grid; gap:calc(20px * var(--space)); background:var(--paper); }
.lg-atelier-field{ display:grid; gap:8px; }
.lg-atelier-form label{ font-weight:600; font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:var(--ink-mute); }
.lg-atelier-req{ color:var(--accent-deep); margin-left:3px; }
.lg-atelier-form input, .lg-atelier-form textarea, .lg-atelier-form select{ font-family:var(--ff-body); font-weight:400; font-size:15px; color:var(--ink); background:var(--paper); border:1px solid var(--line); border-radius:calc(var(--btn-r) / 2); padding:13px 14px; width:100%; transition:border-color .2s; }
.lg-atelier-form input:focus, .lg-atelier-form textarea:focus, .lg-atelier-form select:focus{ outline:none; border-color:var(--accent); }
.lg-atelier-form textarea{ min-height:120px; resize:vertical; }
.lg-atelier-form .lg-atelier-btn{ width:100%; }
.lg-atelier-form__note{ font-size:12px; color:var(--ink-mute); margin:0; }

@media(max-width:900px){ .lg-atelier-contact{ grid-template-columns:1fr; gap:40px; } }
`;
