// Writing (एक रचना / GranthFramedPage) CSS. The poem on a double-framed "page" card
// sitting on the paper-2 band. Ported from WRDirection1Granth.html (.poem/.page).

export const WRITING_STYLES = `
.gr-writing{ border-top:1px solid var(--hairline); border-bottom:1px solid var(--hairline); }
.gr-page{ max-width:560px; margin:0 auto; background:var(--paper); border:1px solid var(--hairline); padding:clamp(44px,7vw,80px) clamp(28px,6vw,72px); position:relative; text-align:center; }
.gr-page::before{ content:""; position:absolute; inset:10px; border:1px solid var(--hairline); pointer-events:none; }
.gr-writing__title{ font-family:var(--font-display); font-weight:400; font-size:1.7rem; margin:14px 0 34px; }
.gr-poem-body{ font-family:var(--font-display); font-size:clamp(1.1rem,2.2vw,1.28rem); line-height:2.15; white-space:pre-line; }
.gr-writing__sig{ margin-top:36px; color:var(--accent); font-size:1rem; font-family:var(--font-display); }
`;
