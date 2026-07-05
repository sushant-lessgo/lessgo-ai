// Praise (सम्मान और चर्चा / GranthCriticsGrid) CSS. Two-column critic quotes with a
// gold ❝ mark + hairline awards line. Ported from WRDirection1Granth.html (.praise).

export const PRAISE_STYLES = `
.gr-praise__eyebrow{ text-align:center; }
.gr-praise__heading{ text-align:center; margin-bottom:56px; }
.gr-praise-grid{ display:grid; grid-template-columns:1fr 1fr; gap:48px; max-width:860px; margin:0 auto; }
.gr-praise-quote{ font-family:var(--font-display); font-size:1.2rem; line-height:1.95; }
.gr-praise-quote::before{ content:"❝"; display:block; color:var(--gold); font-size:2rem; line-height:1; margin-bottom:14px; }
.gr-praise-text{ display:block; }
.gr-praise-cite{ display:block; margin-top:16px; font-style:normal; font-family:var(--font-caption); font-size:.85rem; letter-spacing:.06em; color:var(--ink-soft); }
.gr-awards{ margin-top:64px; text-align:center; color:var(--ink-soft); font-family:var(--font-caption); font-size:.92rem; letter-spacing:.05em; }
.gr-awards em{ font-style:normal; color:var(--gold); padding:0 12px; }
@media (max-width:720px){ .gr-praise-grid{ grid-template-columns:1fr; } }
`;
