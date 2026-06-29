// Shared CSS for the Lumen nav (edit + published parity). `lm-` prefixed.
// Ported from Lumen HTML (.nav, lines 137-154 + .btn 98-117). Block does NOT
// paint the section bg beyond its own sticky bar.

export const HEADER_STYLES = `
.lm-nav{
  position:sticky; top:0; z-index:60; background:oklch(0.977 0.006 70 / 0.86);
  backdrop-filter:blur(10px); border-bottom:1px solid var(--line);
}
.lm-nav-in{ display:flex; align-items:center; gap:28px; padding:15px var(--pad-x); max-width:var(--max-w); margin:0 auto; }
.lm-brand{ display:inline-flex; align-items:baseline; gap:9px; text-decoration:none; }
.lm-brand__wm{ font-family:var(--font-display); font-weight:500; font-size:22px; letter-spacing:0.01em; color:var(--ink); }
.lm-brand__wm em{ font-style:normal; color:var(--brass-d); }
.lm-brand__sub{ font-family:var(--font-mono); font-size:9.5px; letter-spacing:0.2em; text-transform:uppercase; color:var(--ink-3); }
.lm-brand__img{ height:30px; width:auto; display:block; }
.lm-nav-links{ display:flex; gap:30px; margin-left:18px; align-items:center; }
.lm-nav-links a{ font-size:13.5px; font-weight:500; color:var(--ink-2); letter-spacing:0.01em; text-decoration:none; }
.lm-nav-links a:hover{ color:var(--ink); }
.lm-nav-link-wrap{ display:inline-flex; align-items:center; gap:4px; font-size:13.5px; font-weight:500; color:var(--ink-2); }
.lm-nav-cta{ margin-left:auto; display:flex; align-items:center; gap:16px; }
.lm-lang{ display:inline-flex; align-items:center; border:1px solid var(--line-2); border-radius:var(--r); overflow:hidden; }
.lm-lang button{ font-family:var(--font-mono); font-size:11px; font-weight:500; letter-spacing:0.08em; padding:6px 9px; color:var(--ink-3); background:none; border:0; cursor:pointer; transition:background .15s, color .15s; }
.lm-lang button[aria-pressed="true"]{ background:var(--ink); color:var(--paper); }
.lm-lang button + button{ border-left:1px solid var(--line-2); }
.lm-btn{
  display:inline-flex; align-items:center; justify-content:center; gap:9px;
  font-family:var(--font-body); font-weight:600; font-size:14px; letter-spacing:0.01em;
  padding:13px 22px; border-radius:var(--r); white-space:nowrap; line-height:1; cursor:pointer;
  transition:background .16s ease, color .16s ease, border-color .16s ease, transform .16s ease; text-decoration:none;
}
.lm-btn--fill{ background:var(--ink); color:var(--paper); border:1px solid var(--ink); }
.lm-btn--fill:hover{ background:#000; transform:translateY(-1px); }
.lm-btn--sm{ padding:10px 16px; font-size:13.5px; }
/* edit affordances */
.lm-logo-edit{ display:inline-flex; align-items:center; gap:8px; margin-left:10px; }
.lm-logo-edit__btn{ font-family:var(--font-mono); font-size:10px; letter-spacing:0.04em; color:var(--ink-3); background:transparent; border:1px dashed var(--line-2); border-radius:2px; padding:4px 9px; cursor:pointer; }
.lm-logo-edit__x{ font-family:var(--font-mono); font-size:10px; color:var(--ink-3); background:none; border:0; cursor:pointer; text-decoration:underline; }
.lm-nav-link-cfg{ color:var(--ink-3); background:none; border:0; cursor:pointer; display:inline-flex; }
.lm-nav-edit-x{ width:16px; height:16px; border-radius:50%; background:var(--paper); border:1px solid var(--line-2); color:var(--ink-3); font-size:11px; line-height:1; cursor:pointer; display:inline-grid; place-items:center; }
.lm-nav-edit-add{ font-family:var(--font-mono); font-size:10.5px; letter-spacing:0.04em; color:var(--ink-3); background:transparent; border:1px dashed var(--line-2); border-radius:2px; padding:4px 10px; cursor:pointer; }
@media (max-width:1040px){ .lm-nav-links{ display:none; } }
`;
