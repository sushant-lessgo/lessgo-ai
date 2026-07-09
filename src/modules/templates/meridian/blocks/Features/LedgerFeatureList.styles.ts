// src/modules/templates/meridian/blocks/Features/LedgerFeatureList.styles.ts
// Shared CSS for the LedgerFeatureList variant (scale-09 phase 6). Plain module
// (NOT 'use client') imported by BOTH the edit + published renderers so they stay
// in lockstep (published/client-boundary rule). Ported from the designer handoff
// "Meridian Variant - Features (Ledger List).html" (.section/.ledger markup),
// tokens mapped onto Meridian's. Accent inherited via var(--accent). The only
// dynamic behavior is CSS :hover on rows (no JS) — same in both renderers.

export const LEDGER_FEATURE_LIST_STYLES = `
.mrd-ledger-sec { padding: var(--sec-pad-y) var(--sec-pad-x); max-width: 1340px; margin: 0 auto; position: relative; }
.mrd-ledger__eyebrow {
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--bone-3); display: inline-flex; align-items: center; gap: 10px;
}
.mrd-ledger__eyebrow::after { content: ""; width: 32px; height: 1px; background: var(--line-strong); display: inline-block; }
.mrd-ledger__title {
  font-family: var(--font-display); font-weight: 500; font-size: clamp(38px, 4vw, 52px);
  line-height: 1.05; letter-spacing: -0.025em; color: var(--bone); max-width: 22ch; margin: 22px 0 0;
}
.mrd-ledger__lede {
  font-family: var(--font-display); font-size: 19px; line-height: 1.5; color: var(--bone-2);
  max-width: 58ch; margin: 16px 0 0;
}

.mrd-ledger {
  margin-top: 56px;
  border-top: 1px solid var(--line-strong);
}
.mrd-ledger__row {
  display: grid;
  grid-template-columns: 78px 64px minmax(0, 1fr) minmax(0, 1.35fr) 128px;
  align-items: start;
  gap: 28px;
  padding: 30px 12px;
  border-bottom: 1px solid var(--line);
  position: relative;
  transition: background 140ms ease;
}
.mrd-ledger__row::before {
  content: ""; position: absolute; left: 0; top: -1px; bottom: -1px; width: 2px;
  background: var(--accent); transform: scaleY(0); transform-origin: top; transition: transform 160ms ease;
}
.mrd-ledger__row:hover { background: var(--accent-dim); }
.mrd-ledger__row:hover::before { transform: scaleY(1); }

.mrd-ledger__n {
  font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.08em; color: var(--bone-3);
  padding-top: 6px;
}
.mrd-ledger__glyph {
  width: 44px; height: 44px; border: 1px solid var(--line-strong); border-radius: var(--r-sm);
  display: grid; place-items: center; color: var(--accent);
}
.mrd-ledger__row-title {
  font-family: var(--font-display); font-weight: 500; font-size: clamp(20px, 2vw, 26px);
  line-height: 1.15; letter-spacing: -0.02em; color: var(--bone); margin: 2px 0 0;
}
.mrd-ledger__desc {
  font-family: var(--font-body); font-size: 15px; line-height: 1.6; color: var(--bone-2); margin: 4px 0 0; max-width: 52ch;
}
.mrd-ledger__link {
  font-family: var(--font-mono); font-size: 11.5px; letter-spacing: 0.02em; color: var(--bone-3);
  padding-top: 6px; text-align: right; white-space: nowrap; transition: color 140ms ease; text-decoration: none;
}
.mrd-ledger__row:hover .mrd-ledger__link { color: var(--accent); }

/* Edit-mode add/remove affordances (edit renderer only) */
.mrd-ledger__remove {
  position: absolute; top: 12px; right: 12px; width: 22px; height: 22px;
  background: transparent; border: 1px solid var(--line-strong); border-radius: 50%;
  color: var(--bone-3); font-size: 13px; line-height: 1; cursor: pointer; z-index: 2;
}
.mrd-ledger__add {
  display: block; width: 100%; margin-top: 16px; padding: 18px;
  border: 1px dashed var(--line-strong); background: transparent; color: var(--bone-3);
  font-family: var(--font-body); font-size: 14px; cursor: pointer; border-radius: var(--r-sm);
}
.mrd-ledger__add:hover { color: var(--accent); border-color: var(--accent); }

/* Responsive */
@media (max-width: 940px) {
  .mrd-ledger__row { grid-template-columns: 56px minmax(0, 1fr); gap: 8px 20px; padding: 26px 8px; }
  .mrd-ledger__n { grid-column: 1; grid-row: 1; }
  .mrd-ledger__glyph { grid-column: 1; grid-row: 2; margin-top: 4px; }
  .mrd-ledger__row-title { grid-column: 2; grid-row: 1; }
  .mrd-ledger__desc { grid-column: 2; grid-row: 2; }
  .mrd-ledger__link { grid-column: 2; grid-row: 3; text-align: left; padding-top: 12px; }
}
[data-variant="marketing"] .mrd-ledger__eyebrow { font-family: var(--font-body); font-size: 13px; letter-spacing: 0; text-transform: none; font-weight: 500; color: var(--bone-2); }
[data-variant="marketing"] .mrd-ledger__eyebrow::after { display: none; }
[data-variant="marketing"] .mrd-ledger__title { font-weight: 500; letter-spacing: -0.03em; }
[data-variant="marketing"] .mrd-ledger__desc { font-family: var(--font-body); }
[data-variant="marketing"] .mrd-ledger__link { font-family: var(--font-body); letter-spacing: 0; }
`;
