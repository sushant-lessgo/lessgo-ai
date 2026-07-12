// Shared Atelier block CSS fragments (plain module — imported by block styles.ts
// files; NEVER exported from a 'use client' file). The global lg-atelier-
// utilities (wrap/pad/display/tag/btn/eyebrow-block/stitch) live in tokens.ts
// serializeBaseTokens — this file holds only cross-block fragments.

/** Hatched image placeholder — used by any block with an empty manual_preferred
 *  image slot. */
export const HATCH_PLACEHOLDER_CSS = `
.lg-atelier-ph{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
  background:repeating-linear-gradient(135deg,var(--paper-2),var(--paper-2) 9px,transparent 9px,transparent 18px),var(--paper); }
.lg-atelier-ph span{ font-family:var(--ff-mono); font-size:0.66rem; letter-spacing:0.12em; text-transform:uppercase; color:var(--ink-soft); opacity:.6; }
[data-surface="dark"] .lg-atelier-ph,[data-surface="dark-2"] .lg-atelier-ph{
  background:repeating-linear-gradient(135deg,oklch(0.95 0.01 78 / 0.06),oklch(0.95 0.01 78 / 0.06) 9px,transparent 9px,transparent 18px),var(--dark); }
[data-surface="dark"] .lg-atelier-ph span,[data-surface="dark-2"] .lg-atelier-ph span{ color:var(--on-dark-soft); }
`;
