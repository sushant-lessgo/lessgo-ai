// src/modules/skeletons/work/blocks/About/styles.ts
// WorkAbout CSS (edit + published parity). `wk-about-` prefixed. Token-driven ONLY
// via CSS custom properties: SKIN `var(--wk-*)` + USER `var(--u-*, <default>)`.
// The "your story" section (GranthParichay donor): eyebrow + heading + bio, with an
// optional facts strip (value/label pairs).

// Shared var-gated rule-header grammar (Wave 2A). NEUTRAL default = byte-identical
// head; `sectionHeaderStyle:'rule'` → Atelier rule header. See Gallery/styles.
// NOTE: about's head is the LEFT grid cell (not a full-width band), so the rule +
// index render within that column — a scaled-down rule header (no `meta` third line).
import { RULE_HEAD } from '../Gallery/styles';

export const WORK_ABOUT_STYLES = `
.wk-about{ background:var(--u-bg, var(--wk-paper-2)); color:var(--u-fg, var(--wk-ink)); }
.wk-about__in{ width:100%; max-width:var(--wk-wrap); margin:0 auto; padding:calc(var(--wk-sec-y) * var(--u-space-y, 1)) var(--wk-gutter); display:grid; grid-template-columns:minmax(0, 1fr) minmax(0, 1.4fr); gap:clamp(24px,4vw,72px); align-items:var(--wk-about-align, start); }
/* Eyebrow (Wave 2B): var-gated between a plain uppercase label (defaults, byte-
   identical) and the Atelier atl-badge accent chip in split-portrait mode — the
   graceful accent stand-in for the (contract-absent) portrait badge. */
.wk-about__eyebrow{ font-family:var(--wk-ff-body); font-weight:600; font-size:11px; letter-spacing:0.16em; text-transform:uppercase; display:var(--wk-about-eyebrow-display, inline); background:var(--wk-about-eyebrow-bg, transparent); color:var(--wk-about-eyebrow-color, var(--wk-ink-mute)); padding:var(--wk-about-eyebrow-pad, 0); }
.wk-about__heading{ font-family:var(--wk-ff-display); font-weight:var(--wk-display-weight); font-size:clamp(1.8rem,4vw,3rem); line-height:1.04; letter-spacing:-0.02em; margin:12px 0 0; }
.wk-about__bio{ font-family:var(--wk-ff-body); font-size:calc(var(--wk-fs-body) * 1.06); line-height:1.7; color:var(--wk-ink-soft); opacity:var(--u-opacity, 1); margin:0; }
.wk-about__facts{ list-style:none; margin:26px 0 0; padding:0; display:grid; grid-template-columns:repeat(auto-fit, minmax(120px, 1fr)); gap:clamp(16px,2.4vw,32px); border-top:1px solid var(--wk-line); padding-top:22px; }
.wk-about__fact{ display:flex; flex-direction:column; gap:4px; }
.wk-about__fact-value{ font-family:var(--wk-ff-display); font-weight:var(--wk-display-weight); font-size:1.5rem; letter-spacing:-0.02em; color:var(--wk-accent); }
.wk-about__fact-label{ font-family:var(--wk-ff-body); font-size:12px; letter-spacing:0.04em; color:var(--wk-ink-mute); }
@media (max-width:720px){ .wk-about__in{ grid-template-columns:1fr; } }
${RULE_HEAD('wk-about')}`;
