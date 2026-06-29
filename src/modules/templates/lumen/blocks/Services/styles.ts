// Shared CSS for the Lumen priced-service cards (edit + published parity). `lm-`
// prefixed. Ported from Lumen HTML (.sec-head + .svc-grid/.svc, lines ~71-78,
// 190-218). Block does NOT paint the section bg — the data-surface="paper" wrapper does.

export const SERVICES_STYLES = `
.lm-svc-sec{ padding:var(--pad-y) 0; }
.lm-svc-wrap{ max-width:var(--max-w); margin:0 auto; padding-left:var(--pad-x); padding-right:var(--pad-x); }
.lm-sec-head{ max-width:62ch; display:flex; flex-direction:column; gap:16px; margin-bottom:52px; }
.lm-eyebrow{
  font-family:var(--font-mono); font-weight:500; font-size:11px;
  letter-spacing:0.22em; text-transform:uppercase; color:var(--brass-d);
  display:inline-flex; align-items:center; gap:11px;
}
.lm-eyebrow::before{ content:""; width:24px; height:1px; background:var(--line-2); }
.lm-sec-head h2{ font-family:var(--font-display); font-size:clamp(30px,4.2vw,50px); font-weight:400; letter-spacing:-0.012em; line-height:1.08; color:var(--ink); margin:0; }
.lm-sec-head h2 em{ font-style:italic; color:var(--brass-d); }
.lm-lede{ font-family:var(--font-body); font-size:18px; line-height:1.66; color:var(--ink-2); margin:0; max-width:46ch; }

.lm-svc-grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:22px; }
.lm-svc{ border:1px solid var(--line); background:var(--paper); padding:32px 32px 30px; display:flex; flex-direction:column; gap:18px; transition:border-color .16s, transform .16s, box-shadow .16s; }
.lm-svc:hover{ border-color:var(--line-2); transform:translateY(-2px); box-shadow:0 22px 50px -34px oklch(0.235 0.01 60 / 0.55); }
.lm-svc-top{ display:flex; align-items:flex-start; justify-content:space-between; gap:18px; }
.lm-svc-name h3{ font-family:var(--font-display); font-size:25px; font-weight:500; letter-spacing:-0.01em; color:var(--ink); margin:0; }
.lm-svc-name .lm-nl-sub{ font-family:var(--font-mono); font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:var(--brass-d); margin-top:7px; display:block; }
.lm-svc-price{ font-family:var(--font-display); font-weight:500; font-size:30px; letter-spacing:-0.01em; color:var(--ink); white-space:nowrap; line-height:1; text-align:right; }
.lm-svc-price small{ font-family:var(--font-mono); font-size:10px; letter-spacing:0.08em; text-transform:uppercase; color:var(--ink-3); display:block; margin-top:7px; font-weight:500; }
.lm-svc-pitch{ margin:0; color:var(--ink-2); font-size:15px; line-height:1.6; max-width:42ch; }
.lm-svc-deliv{ list-style:none; margin:6px 0 0; padding:18px 0 0; border-top:1px solid var(--line); display:grid; gap:11px; }
.lm-svc-deliv li{ display:grid; grid-template-columns:auto 1fr auto; gap:11px; font-size:13.5px; color:var(--ink-2); line-height:1.45; align-items:start; }
.lm-svc-deliv li .lm-tick{ width:15px; height:15px; flex:none; margin-top:2px; }
.lm-svc-deliv li .lm-tick svg{ width:15px; height:15px; stroke:var(--brass-d); stroke-width:1.8; fill:none; }
.lm-svc-deliv li .lm-deliv-rm{ width:15px; height:15px; border:0; background:transparent; color:var(--ink-3); cursor:pointer; font-size:13px; line-height:1; }
.lm-svc-foot{ margin-top:auto; padding-top:8px; }
.lm-svc-foot a{ font-family:var(--font-body); font-weight:600; font-size:13.5px; color:var(--ink); display:inline-flex; align-items:center; gap:7px; border-bottom:1px solid var(--brass); padding-bottom:2px; transition:gap .16s, color .16s; cursor:pointer; }
.lm-svc-foot a:hover{ gap:11px; color:var(--brass-d); }
.lm-svc-add{ font-family:var(--font-mono); font-size:11px; letter-spacing:0.04em; color:var(--ink-3); background:transparent; border:1px dashed var(--line-2); border-radius:2px; padding:10px 16px; cursor:pointer; margin-top:22px; }
.lm-svc-add:hover{ border-color:var(--brass); color:var(--brass-d); }
.lm-svc-rm{ align-self:flex-start; width:20px; height:20px; border-radius:50%; background:var(--paper); border:1px solid var(--line-2); color:var(--ink-3); font-size:12px; line-height:1; cursor:pointer; display:grid; place-items:center; }
.lm-deliv-add{ font-family:var(--font-mono); font-size:10.5px; letter-spacing:0.04em; color:var(--ink-3); background:transparent; border:1px dashed var(--line); border-radius:2px; padding:5px 10px; cursor:pointer; justify-self:start; }
@media (max-width:760px){ .lm-svc-grid{ grid-template-columns:1fr; } .lm-svc-price{ font-size:26px; } }
`;
