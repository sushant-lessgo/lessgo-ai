// Hero-specific CSS (edit + published parity). `gr-` prefixed. Shared utilities
// (gr-wrap, gr-orn, gr-btn, gr-caption*, gr-display) are injected globally by the
// theme (tokens.ts serializeBaseTokens). Block does NOT paint a full-bleed section
// bg — the data-surface wrapper does. Ported from WRDirection1Granth.html (.hero).

export const HERO_STYLES = `
.gr-hero{ padding:clamp(70px,9vw,110px) 0 clamp(60px,8vw,96px); text-align:center; }
.gr-hero .gr-role{ margin-bottom:22px; }
.gr-hero__name{ margin:0 0 8px; }
.gr-frame{ width:min(240px,58vw); aspect-ratio:4/5; margin:40px auto 0; position:relative; border-radius:999px 999px 8px 8px; overflow:hidden; background:var(--paper-2); }
.gr-frame::after{ content:""; position:absolute; inset:10px; border:1px solid var(--hairline); border-radius:999px 999px 4px 4px; pointer-events:none; z-index:2; }
.gr-frame img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:block; }
.gr-portrait-ph{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:var(--ink-soft); }
.gr-portrait-ph svg{ width:62%; height:auto; opacity:.5; }
.gr-quote{ margin:44px auto 0; max-width:34ch; color:var(--accent); font-family:var(--font-display); font-size:clamp(1.15rem,2.4vw,1.4rem); line-height:1.9; }
.gr-cta-row{ display:flex; gap:18px; justify-content:center; flex-wrap:wrap; margin-top:44px; align-items:center; }
.gr-cta-label{ display:inline; }
.gr-socials{ display:flex; gap:22px; justify-content:center; margin-top:40px; flex-wrap:wrap; }
.gr-social-item{ display:inline-flex; }
.gr-social-a{ color:var(--ink-soft); transition:color .2s; display:inline-flex; }
.gr-social-a:hover{ color:var(--accent); }
.gr-social-a svg{ width:19px; height:19px; fill:currentColor; }
`;
