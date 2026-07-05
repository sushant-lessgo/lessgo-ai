// About (परिचय) CSS. Ported from template-design/WRDirection1Granth.html (.about/.facts). Section
// sits on paper-2 (data-surface) with hairline top/bottom rules. `gr-` prefixed.

export const ABOUT_STYLES = `
.gr-about{ border-top:1px solid var(--hairline); border-bottom:1px solid var(--hairline); }
.gr-about__eyebrow{ text-align:center; }
.gr-about__heading{ text-align:center; margin-bottom:10px; }
.gr-about__bio{ font-family:var(--font-body); font-size:var(--fs-body); line-height:var(--lh-body); }
.gr-about__bio p + p{ margin-top:1.4em; }
.gr-facts{ display:flex; justify-content:center; gap:0; flex-wrap:wrap; margin-top:52px; text-align:center; }
.gr-fact{ padding:0 34px; }
.gr-fact + .gr-fact{ border-left:1px solid var(--hairline); }
.gr-fact__value{ display:block; font-size:1.5rem; font-weight:400; color:var(--accent); font-family:var(--font-display); line-height:1.2; }
.gr-fact__label{ display:block; font-size:.9rem; color:var(--ink-soft); font-family:var(--font-caption); letter-spacing:.06em; margin-top:2px; }
@media (max-width:720px){ .gr-fact{ padding:0 20px; } }
`;
