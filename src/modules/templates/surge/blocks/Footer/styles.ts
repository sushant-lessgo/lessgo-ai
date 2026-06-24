// Shared CSS for the Surge footer (edit + published parity). All classes `sg-`
// prefixed. Ported from Surge HTML .footer (lines 498-510). Footer's data-surface
// is `panel` (dark slate) — so text is light here, no background painted by the block.

export const FOOTER_STYLES = `
.sg-footer { padding: 64px var(--sec-pad-x) 30px; font-family: var(--font-body); color: oklch(0.78 0.01 265); }
.sg-footer__top { display: grid; grid-template-columns: 1.6fr 1fr 1fr 1fr; gap: 36px; max-width: var(--max-w); margin: 0 auto 40px; }
@media (max-width: 1080px) { .sg-footer__top { grid-template-columns: 1fr 1fr; } }
@media (max-width: 720px) { .sg-footer__top { grid-template-columns: 1fr 1fr; } }

.sg-footer__brand-row { display: inline-flex; align-items: center; gap: 10px; font-family: var(--font-display); font-weight: 800; font-size: 19px; letter-spacing: -0.02em; color: #fff; margin-bottom: 16px; }
.sg-footer__mark { width: 26px; height: 26px; border-radius: var(--r-xs); background: var(--panel-2); display: inline-flex; align-items: center; justify-content: center; flex: none; }
.sg-footer__mark::before { content: "↗"; color: var(--accent); font-weight: 800; font-size: 16px; line-height: 1; }
.sg-footer__tagline { font-size: 14.5px; max-width: 34ch; margin: 0 0 18px; color: oklch(0.72 0.01 265); line-height: 1.5; }
.sg-footer__badge { display: inline-flex; align-items: center; gap: 8px; font-family: var(--font-mono); font-size: 11px; color: var(--pos); }
.sg-footer__badge .lv { width: 6px; height: 6px; border-radius: 50%; background: var(--pos); }

.sg-footer__col h4 { font-family: var(--font-mono); font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: oklch(0.62 0.02 265); margin: 0 0 16px; }
.sg-footer__col ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 11px; }
.sg-footer__col li { font-size: 14px; color: oklch(0.78 0.01 265); cursor: pointer; display: flex; align-items: center; gap: 8px; }
.sg-footer__col li:hover { color: #fff; }

.sg-footer__social-remove { background: transparent; border: none; color: oklch(0.6 0.02 265); font-size: 14px; cursor: pointer; line-height: 1; }
.sg-footer__social-add { background: transparent; border: 1px dashed var(--panel-line); color: oklch(0.72 0.01 265); padding: 4px 10px; border-radius: var(--r-sm); font-family: var(--font-mono); font-size: 12px; cursor: pointer; }

.sg-footer__bottom { display: flex; justify-content: space-between; align-items: center; max-width: var(--max-w); margin: 0 auto; padding-top: 22px; border-top: 1px solid var(--panel-line); font-family: var(--font-mono); font-size: 11px; color: oklch(0.6 0.02 265); flex-wrap: wrap; gap: 10px; }
`;
