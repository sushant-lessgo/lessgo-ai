// Footer (जुड़िए / GranthFollowFooter) CSS. Centred follow block + social row + fine
// print. Ported from WRDirection1Granth.html (footer). Social classes duplicated
// (also in Hero) so the footer is self-contained.

export const FOOTER_STYLES = `
.gr-footer{ border-top:1px solid var(--hairline); padding:clamp(64px,9vw,100px) 0 48px; text-align:center; }
.gr-footer__heading{ font-family:var(--font-display); font-weight:400; font-size:clamp(1.5rem,3vw,2rem); margin-top:8px; }
.gr-footer__note{ color:var(--ink-soft); margin-top:8px; font-family:var(--font-body); font-size:var(--fs-body); line-height:var(--lh-body); }
.gr-footer__socials{ display:flex; gap:22px; justify-content:center; margin-top:34px; flex-wrap:wrap; }
.gr-footer__fine{ margin-top:64px; font-family:var(--font-caption); font-size:.75rem; letter-spacing:.1em; color:var(--ink-soft); }
.gr-footer .gr-social-item{ display:inline-flex; }
.gr-footer .gr-social-a{ color:var(--ink-soft); transition:color .2s; display:inline-flex; }
.gr-footer .gr-social-a:hover{ color:var(--accent); }
.gr-footer .gr-social-a svg{ width:19px; height:19px; fill:currentColor; }
`;
