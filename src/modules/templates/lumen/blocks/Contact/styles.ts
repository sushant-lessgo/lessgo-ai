// Shared CSS for the Lumen contact section (edit + published parity). `lm-`
// prefixed. Ported from Lumen HTML (.contact lines 264-289). Block does NOT paint
// the section bg — the data-surface="paper-2" wrapper does.

export const CONTACT_STYLES = `
.lm-contact-in{ max-width:var(--max-w); margin:0 auto; padding:var(--pad-y) var(--pad-x); display:grid; grid-template-columns:1.05fr 0.95fr; gap:clamp(40px,6vw,80px); align-items:start; }
.lm-contact-copy .lm-eyebrow{ font-family:var(--font-mono); font-weight:500; font-size:11px; letter-spacing:0.22em; text-transform:uppercase; color:var(--brass-d); display:inline-flex; align-items:center; gap:11px; }
.lm-contact-copy .lm-eyebrow::before{ content:""; width:24px; height:1px; background:var(--line-2); }
.lm-contact-copy h2{ font-family:var(--font-display); font-size:clamp(30px,4vw,48px); font-weight:400; letter-spacing:-0.012em; line-height:1.08; color:var(--ink); margin:16px 0 0; }
.lm-contact-copy h2 em{ font-style:italic; color:var(--brass-d); }
.lm-contact-copy .lm-lede{ font-family:var(--font-body); font-size:18px; line-height:1.66; color:var(--ink-2); margin:18px 0 30px; max-width:42ch; }
.lm-contact-details{ display:grid; gap:2px; border:1px solid var(--line); background:var(--paper); }
.lm-cd-row{ display:grid; grid-template-columns:120px 1fr; gap:14px; padding:16px 20px; align-items:center; }
.lm-cd-row + .lm-cd-row{ border-top:1px solid var(--line); }
.lm-cd-row .k{ font-family:var(--font-mono); font-size:10.5px; letter-spacing:0.14em; text-transform:uppercase; color:var(--ink-3); }
.lm-cd-row .v{ font-size:15px; color:var(--ink); }
.lm-cd-row .v b{ font-weight:600; }
.lm-contact-quick{ display:flex; flex-wrap:wrap; gap:12px; margin-top:22px; }
.lm-btn{ display:inline-flex; align-items:center; justify-content:center; gap:9px; font-family:var(--font-body); font-weight:600; font-size:15px; letter-spacing:0.01em; padding:16px 28px; border-radius:var(--r); white-space:nowrap; line-height:1; cursor:pointer; text-decoration:none; transition:background .16s,color .16s,border-color .16s,transform .16s; }
.lm-btn--wa{ background:oklch(0.62 0.16 150); color:#fff; }
.lm-btn--wa:hover{ background:oklch(0.55 0.16 150); transform:translateY(-1px); }
.lm-btn--line{ border:1px solid var(--line-2); color:var(--ink); background:transparent; }
.lm-btn--line:hover{ border-color:var(--ink); }
.lm-btn .ic{ width:16px; height:16px; flex:none; }
.lm-form{ background:var(--paper); border:1px solid var(--line); padding:30px; display:grid; gap:18px; }
.lm-form .field{ display:grid; gap:8px; }
.lm-form label{ font-family:var(--font-mono); font-size:10.5px; letter-spacing:0.13em; text-transform:uppercase; color:var(--ink-3); }
.lm-form input, .lm-form textarea{ font-family:var(--font-body); font-size:15px; color:var(--ink); background:var(--paper-2); border:1px solid var(--line-2); border-radius:var(--r); padding:13px 14px; width:100%; transition:border-color .15s, background .15s; }
.lm-form input:focus, .lm-form textarea:focus{ outline:none; border-color:var(--brass); background:var(--paper); }
.lm-form textarea{ min-height:128px; resize:vertical; }
.lm-form .submit{ margin-top:4px; }
.lm-form .note{ font-family:var(--font-mono); font-size:11px; color:var(--ink-3); letter-spacing:0.03em; }
.lm-btn--fill{ background:var(--ink); color:var(--paper); border:1px solid var(--ink); }
.lm-btn--fill:hover{ background:#000; transform:translateY(-1px); }
@media (max-width:1040px){ .lm-contact-in{ grid-template-columns:1fr; gap:44px; } }
@media (max-width:760px){ .lm-cd-row{ grid-template-columns:1fr; gap:6px; } }
`;
