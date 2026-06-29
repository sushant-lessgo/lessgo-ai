// Shared CSS for the Lumen About block (edit + published parity). `lm-` prefixed.
// Ported from Lumen HTML (.about-in lines ~254-262, plus shared .eyebrow/.fig/.ph/
// .btn). Block does NOT paint the section bg — the data-surface="paper-2" wrapper does.

export const ABOUT_STYLES = `
.lm-about-in{ display:grid; grid-template-columns:0.82fr 1.18fr; gap:clamp(40px,6vw,84px); align-items:center; max-width:var(--max-w); margin:0 auto; padding:var(--pad-y) var(--pad-x); }
.lm-about-portrait{ position:relative; }
.lm-about-portrait .lm-frameline{ position:absolute; inset:-12px; border:1px solid var(--brass); opacity:.3; pointer-events:none; }
.lm-about-portrait .lm-ph{ aspect-ratio:4/5; }
.lm-about-copy .lm-eyebrow{ margin-bottom:16px; }
.lm-about-copy h2{ font-family:var(--font-display); font-size:clamp(28px,3.6vw,44px); font-weight:400; letter-spacing:-0.012em; line-height:1.08; color:var(--ink); margin:0; }
.lm-about-copy p{ color:var(--ink-2); font-size:16px; line-height:1.68; max-width:54ch; margin:20px 0 0; }
.lm-about-sign{ font-family:var(--font-display); font-style:italic; font-size:26px; color:var(--ink); margin-top:24px; }
.lm-about-actions{ margin-top:30px; display:flex; flex-wrap:wrap; gap:12px; }

.lm-eyebrow{ font-family:var(--font-mono); font-weight:500; font-size:11px; letter-spacing:0.22em; text-transform:uppercase; color:var(--brass-d); display:inline-flex; align-items:center; gap:11px; }
.lm-eyebrow::before{ content:""; width:24px; height:1px; background:var(--line-2); }

.lm-ph{ position:relative; display:block; background:var(--paper-2); overflow:hidden; border:1px solid var(--line); background-image:repeating-linear-gradient(135deg, oklch(0.235 0.010 60 / 0.05) 0 1px, transparent 1px 13px); }
.lm-ph img{ display:block; width:100%; height:100%; object-fit:cover; }
.lm-ph .lm-ph-tag{ position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); font-family:var(--font-mono); font-size:10px; font-weight:500; letter-spacing:0.13em; text-transform:uppercase; color:var(--ink-3); white-space:nowrap; text-align:center; border:1px solid var(--line-2); padding:5px 11px; border-radius:var(--r); background:var(--paper); }

.lm-fig{ display:flex; align-items:baseline; gap:12px; margin-top:13px; font-family:var(--font-mono); font-size:10.5px; letter-spacing:0.10em; text-transform:uppercase; color:var(--ink-3); }
.lm-fig .lm-fig-n{ color:var(--brass-d); }
.lm-fig .lm-fig-ratio{ margin-left:auto; color:var(--ink-3); opacity:.85; }

.lm-btn{ display:inline-flex; align-items:center; justify-content:center; gap:9px; font-family:var(--font-body); font-weight:600; font-size:15px; letter-spacing:0.01em; padding:16px 28px; border-radius:var(--r); white-space:nowrap; line-height:1; cursor:pointer; transition:background .16s ease, color .16s ease, border-color .16s ease, transform .16s ease; }
.lm-btn-brass{ background:var(--brass); color:var(--ink); }
.lm-btn-brass:hover{ background:oklch(0.70 0.072 70); transform:translateY(-1px); }
.lm-btn-line{ border:1px solid var(--line-2); color:var(--ink); background:transparent; }
.lm-btn-line:hover{ border-color:var(--ink); }

@media (max-width:1040px){
  .lm-about-in{ grid-template-columns:1fr; gap:44px; }
  .lm-about-portrait{ max-width:440px; }
}
`;
