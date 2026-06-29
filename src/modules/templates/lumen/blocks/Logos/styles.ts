// Shared CSS for the Lumen client-type strip (edit + published parity). `lm-`
// prefixed. Ported from Lumen HTML (.clients, lines 179-185). Block does NOT
// paint the section bg — the data-surface="paper-2" wrapper does.

export const CLIENTS_STYLES = `
.lm-clients-in{
  display:grid; grid-template-columns:auto 1px 1fr; gap:clamp(22px,4vw,52px);
  align-items:center; padding:24px var(--pad-x); max-width:var(--max-w); margin:0 auto;
}
.lm-clients-lbl{
  font-family:var(--font-mono); font-size:10.5px; letter-spacing:0.16em;
  text-transform:uppercase; color:var(--ink-3); max-width:16ch; line-height:1.5;
}
.lm-clients-div{ background:var(--line-2); height:38px; }
.lm-clients-row{ display:flex; flex-wrap:wrap; align-items:center; gap:12px 16px; }
.lm-client-chip{ position:relative; font-family:var(--font-display); font-size:18px; font-weight:400; color:var(--ink-2); letter-spacing:0.005em; }
.lm-client-chip + .lm-client-chip::before{ content:"·"; margin-right:16px; color:var(--brass-d); }
.lm-client-rm{ margin-left:6px; width:16px; height:16px; border-radius:50%; background:var(--paper); border:1px solid var(--line-2); color:var(--ink-3); font-size:11px; line-height:1; cursor:pointer; display:inline-grid; place-items:center; vertical-align:middle; }
.lm-client-add{ font-family:var(--font-mono); font-size:10.5px; letter-spacing:0.04em; color:var(--ink-3); background:transparent; border:1px dashed var(--line-2); border-radius:2px; padding:6px 12px; cursor:pointer; }
.lm-client-add:hover{ border-color:var(--brass); color:var(--brass-d); }
@media (max-width:760px){
  .lm-clients-in{ grid-template-columns:1fr; gap:16px; }
  .lm-clients-div{ display:none; }
}
`;
