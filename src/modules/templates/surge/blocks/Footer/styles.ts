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
.sg-footer__img { height: 30px; width: auto; max-width: 160px; object-fit: contain; flex: none; }
/* edit-only footer logo upload affordance (not rendered on published) */
.sg-footer__logo-edit { display: inline-flex; align-items: center; gap: 6px; margin-left: 8px; }
.sg-footer__logo-edit-btn { display: inline-flex; align-items: center; gap: 4px; font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.04em; color: oklch(0.72 0.01 265); border: 1px dashed var(--panel-line); border-radius: var(--r-xs); padding: 3px 8px; cursor: pointer; white-space: nowrap; }
.sg-footer__logo-edit-btn:hover { color: #fff; border-color: oklch(0.6 0.02 265); }
.sg-footer__logo-edit-x { background: transparent; border: none; color: oklch(0.6 0.02 265); font-family: var(--font-mono); font-size: 10.5px; cursor: pointer; }
.sg-footer__logo-edit-x:hover { color: #fff; }
.sg-footer__tagline { font-size: 14.5px; max-width: 34ch; margin: 0 0 18px; color: oklch(0.72 0.01 265); line-height: 1.5; }
.sg-footer__badge { display: inline-flex; align-items: center; gap: 8px; font-family: var(--font-mono); font-size: 11px; color: var(--pos); }
.sg-footer__badge .lv { width: 6px; height: 6px; border-radius: 50%; background: var(--pos); }

.sg-footer__col h4 { font-family: var(--font-mono); font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: oklch(0.62 0.02 265); margin: 0 0 16px; }
.sg-footer__col ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 11px; }
.sg-footer__col li { font-size: 14px; color: oklch(0.78 0.01 265); cursor: pointer; display: flex; align-items: center; gap: 8px; }
.sg-footer__col li:hover { color: #fff; }

.sg-footer__social-remove { background: transparent; border: none; color: oklch(0.6 0.02 265); font-size: 14px; cursor: pointer; line-height: 1; }
.sg-footer__social-add, .sg-footer__link-add { background: transparent; border: 1px dashed var(--panel-line); color: oklch(0.72 0.01 265); padding: 4px 10px; border-radius: var(--r-sm); font-family: var(--font-mono); font-size: 12px; cursor: pointer; }
.sg-footer__social-add:hover, .sg-footer__link-add:hover { color: #fff; border-color: oklch(0.6 0.02 265); }
/* edit-only footer link affordances (panel surface) */
.sg-footer__link-cfg { display: inline-flex; align-items: center; justify-content: center; background: transparent; border: none; color: oklch(0.6 0.02 265); cursor: pointer; padding: 0; }
.sg-footer__link-cfg:hover { color: #fff; }
.sg-footer__link-remove { background: transparent; border: none; color: oklch(0.6 0.02 265); font-size: 14px; line-height: 1; cursor: pointer; }
.sg-footer__link-remove:hover { color: #fff; }
.sg-footer__link-url { width: 120px; padding: 3px 6px; border-radius: var(--r-xs); border: 1px solid var(--panel-line); background: var(--panel-2); color: #fff; font-size: 11px; font-family: var(--font-mono); }
.sg-footer__link-url::placeholder { color: oklch(0.5 0.02 265); }

.sg-footer__bottom { display: flex; justify-content: space-between; align-items: center; max-width: var(--max-w); margin: 0 auto; padding-top: 22px; border-top: 1px solid var(--panel-line); font-family: var(--font-mono); font-size: 11px; color: oklch(0.6 0.02 265); flex-wrap: wrap; gap: 10px; }

/* WhatsApp floating button (shared chrome — appears on every page) */
.sg-wa-fab { position: fixed; right: clamp(16px,3vw,28px); bottom: clamp(16px,3vw,28px); z-index: 80; display: inline-flex; align-items: center; gap: 10px; padding: 12px 18px 12px 14px; background: #25D366; color: #fff; border-radius: 999px; font-family: var(--font-display); font-weight: 700; font-size: 14.5px; text-decoration: none; box-shadow: 0 14px 34px -12px rgba(37,211,102,0.55); transition: transform .16s ease, box-shadow .16s ease; }
.sg-wa-fab:hover { transform: translateY(-2px); box-shadow: 0 18px 40px -12px rgba(37,211,102,0.7); }
.sg-wa-fab svg { width: 24px; height: 24px; flex: none; }
.sg-wa-fab .sg-wa-label { white-space: nowrap; }
@media (max-width: 760px) { .sg-wa-fab { padding: 14px; } .sg-wa-fab .sg-wa-label { display: none; } }

/* edit-only WhatsApp widget config (not rendered on published) */
.sg-wa-edit { max-width: var(--max-w); margin: 24px auto 0; display: grid; gap: 8px; max-width: 380px; }
.sg-wa-edit strong { font-family: var(--font-mono); font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: oklch(0.62 0.02 265); }
.sg-wa-edit input { padding: 8px 10px; border-radius: var(--r-sm); border: 1px solid var(--panel-line); background: var(--panel-2); color: #fff; font-size: 13px; font-family: var(--font-body); }
.sg-wa-edit input::placeholder { color: oklch(0.55 0.02 265); }
`;
