// Shared CSS for the Lumen hero (edit + published parity). `lm-` prefixed.
// Ported from Lumen HTML (.hero, lines 156-174 + shared .eyebrow/.lede/.ph/.fig
// /.btn). Block does NOT paint a full-bleed section bg — the data-surface wrapper does.

export const HERO_STYLES = `
.lm-hero{ padding:clamp(40px,5vw,72px) 0 var(--pad-y); }
.lm-hero-in{ max-width:var(--max-w); margin:0 auto; padding:0 var(--pad-x); display:grid; grid-template-columns:1.02fr 0.98fr; gap:clamp(36px,5vw,72px); align-items:end; }
.lm-hero-copy{ display:flex; flex-direction:column; align-items:flex-start; gap:24px; padding-bottom:8px; }
.lm-eyebrow{ font-family:var(--font-mono); font-weight:500; font-size:11px; letter-spacing:0.22em; text-transform:uppercase; color:var(--brass-d); display:inline-flex; align-items:center; gap:11px; }
.lm-eyebrow::before{ content:""; width:24px; height:1px; background:var(--line-2); }
.lm-hero h1, .lm-hero__display{ font-family:var(--font-display); font-size:clamp(40px,5.6vw,74px); font-weight:400; letter-spacing:-0.018em; line-height:1.02; color:var(--ink); margin:0; }
.lm-hero__display em{ font-style:italic; color:var(--brass-d); }
.lm-lede{ font-family:var(--font-body); font-size:18px; line-height:1.66; color:var(--ink-2); margin:0; max-width:46ch; }
.lm-hero-actions{ display:flex; flex-wrap:wrap; gap:12px; }
.lm-hero-who{ font-family:var(--font-mono); font-size:11.5px; letter-spacing:0.10em; text-transform:uppercase; color:var(--ink-3); }
.lm-hero-who b{ color:var(--ink); font-weight:500; }
.lm-hero-art{ position:relative; }
.lm-hero-art .lm-frameline{ position:absolute; inset:-12px; border:1px solid var(--brass); opacity:.34; pointer-events:none; }
.lm-hero-art .lm-badge{ position:absolute; top:16px; left:16px; z-index:2; font-family:var(--font-mono); font-size:10px; font-weight:500; letter-spacing:0.12em; text-transform:uppercase; color:var(--brass-l); background:oklch(0.205 0.010 52 / 0.82); border:1px solid var(--line-dk); padding:6px 10px; border-radius:var(--r); backdrop-filter:blur(4px); }
.lm-ph{ position:relative; background:var(--paper-2); overflow:hidden; background-image:repeating-linear-gradient(135deg, oklch(0.235 0.010 60 / 0.05) 0 1px, transparent 1px 13px); border:1px solid var(--line); }
.lm-ph.on-dark{ background-color:var(--esp); border-color:var(--line-dk); background-image:repeating-linear-gradient(135deg, oklch(0.815 0.050 74 / 0.08) 0 1px, transparent 1px 13px); }
.lm-ph img{ display:block; width:100%; height:100%; object-fit:cover; }
.lm-ph__tag{ position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); font-family:var(--font-mono); font-size:10px; font-weight:500; letter-spacing:0.13em; text-transform:uppercase; color:var(--ink-3); white-space:nowrap; text-align:center; border:1px solid var(--line-2); padding:5px 11px; border-radius:var(--r); background:var(--paper); }
.lm-shot.port{ aspect-ratio:4/5; }
.lm-shot.land{ aspect-ratio:3/2; }
.lm-fig{ display:flex; align-items:baseline; gap:12px; margin-top:13px; font-family:var(--font-mono); font-size:10.5px; letter-spacing:0.10em; text-transform:uppercase; color:var(--ink-3); }
.lm-fig .n{ color:var(--brass-d); }
.lm-fig .ratio{ margin-left:auto; color:var(--ink-3); opacity:.85; }
.lm-btn{ display:inline-flex; align-items:center; justify-content:center; gap:9px; font-family:var(--font-body); font-weight:600; font-size:15px; letter-spacing:0.01em; padding:16px 28px; border-radius:var(--r); white-space:nowrap; line-height:1; cursor:pointer; text-decoration:none; transition:background .16s, color .16s, border-color .16s, transform .16s; }
.lm-btn--fill{ background:var(--ink); color:var(--paper); border:1px solid var(--ink); }
.lm-btn--fill:hover{ background:#000; transform:translateY(-1px); }
.lm-btn--line{ border:1px solid var(--line-2); color:var(--ink); background:transparent; }
.lm-btn--line:hover{ border-color:var(--ink); }
@media (max-width:1040px){
  .lm-hero-in{ grid-template-columns:1fr; gap:48px; align-items:start; }
  .lm-hero-art{ max-width:520px; }
}
`;
