// Shared CSS for the Lumen footer (edit + published parity). All classes `lm-`
// prefixed. Ported from Lumen HTML .footer (lines 291-307) + .float-cta/.fab
// (309-318). Footer's data-surface is `esp-d` (dark) — text is light here; the
// block does NOT paint the section background.

export const FOOTER_STYLES = `
.lm-footer{ font-family:var(--font-body); color:oklch(0.80 0.02 70 / 0.82); }
.lm-footer-top{ display:grid; grid-template-columns:1.7fr 1fr 1fr; gap:40px; padding:var(--pad-y) var(--pad-x) 46px; max-width:var(--max-w); margin:0 auto; }
.lm-footer-brand .lm-footer-wm{ font-family:var(--font-display); font-weight:500; font-size:22px; letter-spacing:0.01em; color:var(--paper); }
.lm-footer-brand .lm-footer-wm em{ font-style:normal; color:var(--brass-l); }
.lm-footer-brand .lm-footer-sub{ font-family:var(--font-mono); font-size:9.5px; letter-spacing:0.2em; text-transform:uppercase; color:oklch(0.74 0.02 70 / 0.7); margin-left:9px; }
.lm-footer-brandrow{ display:inline-flex; align-items:baseline; gap:0; }
.lm-footer-brand p{ font-size:14px; line-height:1.7; max-width:36ch; margin:20px 0; color:oklch(0.80 0.02 70 / 0.8); }
.lm-footer-contact{ font-family:var(--font-mono); font-size:12px; line-height:1.95; letter-spacing:0.02em; }
.lm-footer-contact b{ color:var(--brass-l); font-weight:500; }
.lm-footer-col h4{ font-family:var(--font-mono); font-size:10.5px; font-weight:500; letter-spacing:0.18em; text-transform:uppercase; color:var(--brass-l); margin:0 0 18px; }
.lm-footer-col ul{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:12px; }
.lm-footer-col ul li{ font-size:14px; display:flex; align-items:center; gap:8px; }
.lm-footer-col ul li a:hover{ color:var(--paper); }
.lm-footer-bottom{ border-top:1px solid var(--line-dk); padding:22px var(--pad-x); max-width:var(--max-w); margin:0 auto; display:flex; flex-wrap:wrap; gap:12px 26px; align-items:center; justify-content:space-between; font-family:var(--font-mono); font-size:11px; letter-spacing:0.04em; }
.lm-footer-bottom a:hover{ color:var(--paper); }
.lm-footer-legal{ display:flex; gap:14px; align-items:center; flex-wrap:wrap; }

/* edit-only affordances (dark surface) */
.lm-footer-linkcfg{ display:inline-flex; align-items:center; justify-content:center; background:transparent; border:none; color:oklch(0.62 0.02 70); cursor:pointer; padding:0; }
.lm-footer-linkcfg:hover{ color:var(--paper); }
.lm-footer-rm{ background:transparent; border:none; color:oklch(0.6 0.02 70); font-size:14px; line-height:1; cursor:pointer; }
.lm-footer-rm:hover{ color:var(--paper); }
.lm-footer-add{ background:transparent; border:1px dashed var(--line-dk); color:oklch(0.72 0.02 70); padding:4px 10px; border-radius:2px; font-family:var(--font-mono); font-size:11px; cursor:pointer; }
.lm-footer-add:hover{ color:var(--paper); border-color:var(--brass-l); }

/* floating CTA — WhatsApp + book-a-call */
.lm-float-cta{ position:fixed; right:clamp(16px,3vw,28px); bottom:clamp(16px,3vw,28px); z-index:70; display:flex; flex-direction:column; gap:10px; }
.lm-fab{ display:inline-flex; align-items:center; gap:9px; padding:12px 16px; border-radius:999px; font-family:var(--font-body); font-weight:600; font-size:13.5px; text-decoration:none; box-shadow:0 14px 36px -14px oklch(0.235 0.01 60 / 0.5); transition:transform .16s ease; }
.lm-fab:hover{ transform:translateY(-2px); }
.lm-fab svg{ width:18px; height:18px; flex:none; }
.lm-fab-wa{ background:#25D366; color:#fff; }
.lm-fab-call{ background:var(--ink); color:var(--paper); }
.lm-fab .lm-fab-lbl{ white-space:nowrap; }

/* edit-only WhatsApp widget config */
.lm-wa-edit{ max-width:380px; margin:0 auto; padding:0 var(--pad-x) 28px; display:grid; gap:8px; }
.lm-wa-edit strong{ font-family:var(--font-mono); font-size:11px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:var(--brass-l); }
.lm-wa-edit input{ padding:8px 10px; border-radius:2px; border:1px solid var(--line-dk); background:var(--esp); color:var(--paper); font-size:13px; font-family:var(--font-body); }
.lm-wa-edit input::placeholder{ color:oklch(0.55 0.02 70); }

@media (max-width:1040px){ .lm-footer-top{ grid-template-columns:1.4fr 1fr; gap:34px 28px; } }
@media (max-width:760px){
  .lm-footer-top{ grid-template-columns:1fr; gap:34px; }
  .lm-float-cta .lm-fab .lm-fab-lbl{ display:none; }
  .lm-float-cta .lm-fab{ padding:13px; }
}
`;
