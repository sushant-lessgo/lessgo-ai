// src/modules/skeletons/work/blocks/Header/styles.ts
// WorkHeader CSS (edit + published parity). `wk-header-` prefixed. Token-driven
// ONLY via CSS custom properties: SKIN tokens `var(--wk-*)` + USER style tokens
// `var(--u-*, <skeleton default>)`.
//
// FIVE ARRANGEMENTS (phase 6) — pure CSS re-flow of the SAME 3-child DOM (logo ·
// nav · right), keyed off `data-wk-header-layout` on the root. One parametric
// component (WorkHeader.core) drives all of them (internal dispatch), so edit ==
// published for every arrangement by construction. Ported from the Atelier "NAV"
// grammar + Kontur/Pulse `.nav` (brand · mid · right) systems.
//   WorkHeader          logo-left · nav-center · cta-right  (default; base rules)
//   WorkHeaderStart     logo-left · nav grouped left · cta-right
//   WorkHeaderCentered  centered logo · nav-left · cta-right (Atelier centered logo)
//   WorkHeaderSplit     logo-left · nav+cta grouped right   (Kontur/Pulse nav-right)
//   WorkHeaderMinimal   logo-left · cta-right only (nav hidden)
//
// STICKY (phase 6) — `data-wk-header-mode="fixed"` opts into position:fixed in BOTH
// renderers (the editor mirror is this CSS; the published `work.v1.js` adds the
// `.is-scrolled` shadow on scroll). `"static"` (default) is inert.

export const WORK_HEADER_STYLES = `
/* The bottom hairline is drawn by a pseudo-element inset 1px from the absolute
   bottom edge (NOT a band-edge \`border-bottom\`). A 1px line sitting exactly on the
   parity harness's screenshot crop boundary rounds to a different row between the
   two stacked bands (a pure crop artifact that pushed the dense header bands past
   3%); inset by 1px, the crop-edge row is uniform background and the divider renders
   consistently in both renderers. Visually identical to a bottom border. */
.wk-header{ position:relative; background:var(--u-bg, var(--wk-paper)); color:var(--u-fg, var(--wk-ink)); }
.wk-header::after{ content:""; position:absolute; left:0; right:0; bottom:1px; height:1px; background:var(--wk-line); }
.wk-header__in{ width:100%; max-width:var(--wk-wrap); margin:0 auto; box-sizing:border-box; height:80px; padding:0 var(--wk-gutter); display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:24px; }
.wk-header__logo{ display:inline-flex; align-items:center; gap:10px; text-decoration:none; color:inherit; font-family:var(--wk-ff-display); font-weight:var(--wk-display-weight); font-size:18px; letter-spacing:-0.01em; justify-self:start; }
.wk-header__logo img{ height:32px; width:auto; display:block; }
.wk-header__nav{ display:flex; align-items:center; gap:26px; justify-self:center; }
/* Style the nav link typography for BOTH renderers: published emits a bare anchor,
   the editor emits a .wk-link-edit span wrapper (no anchor) — target both so the
   edit nav text is not left at the default 16px (a width/height delta the centered
   arrangement would otherwise amplify into an edit-vs-published parity break). */
.wk-header__nav a, .wk-header__nav .wk-link-edit{ color:inherit; text-decoration:none; font-family:var(--wk-ff-body); font-weight:600; font-size:12px; letter-spacing:0.08em; text-transform:uppercase; opacity:0.82; }
.wk-header__nav a:hover, .wk-header__nav .wk-link-edit:hover{ opacity:1; }
.wk-header__right{ display:flex; align-items:center; gap:14px; justify-self:end; }
.wk-header__cta{ display:inline-flex; align-items:center; justify-content:center; font-family:var(--wk-ff-body); font-weight:600; font-size:12px; letter-spacing:0.04em; padding:11px 20px; background:var(--wk-accent); color:var(--wk-accent-ink,#fff); border:1.5px solid var(--wk-accent); border-radius:var(--u-radius, var(--wk-r)); text-decoration:none; white-space:nowrap; cursor:pointer; }

/* WorkHeaderStart — logo-left, nav grouped immediately to its right. */
.wk-header[data-wk-header-layout="WorkHeaderStart"] .wk-header__in{ grid-template-columns:auto 1fr auto; }
.wk-header[data-wk-header-layout="WorkHeaderStart"] .wk-header__nav{ justify-self:start; }

/* WorkHeaderCentered — centered wordmark, nav to the left, CTA to the right. The
   logo is absolutely centered (OUT of grid flow) so its position depends only on the
   container centre — never on the auto-column width symmetry or the row baseline,
   which are sub-pixel-sensitive to the editor's inline-editor content boxes (an
   edit↔published parity break the grid-placement approach otherwise amplified). */
.wk-header[data-wk-header-layout="WorkHeaderCentered"] .wk-header__in{ position:relative; grid-template-columns:1fr 1fr; }
.wk-header[data-wk-header-layout="WorkHeaderCentered"] .wk-header__logo{ position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); justify-self:auto; }
.wk-header[data-wk-header-layout="WorkHeaderCentered"] .wk-header__nav{ grid-column:1; justify-self:start; }
.wk-header[data-wk-header-layout="WorkHeaderCentered"] .wk-header__right{ grid-column:2; justify-self:end; }

/* WorkHeaderSplit — logo-left, nav + CTA grouped on the right (nav before CTA). */
.wk-header[data-wk-header-layout="WorkHeaderSplit"] .wk-header__in{ grid-template-columns:auto 1fr auto; }
.wk-header[data-wk-header-layout="WorkHeaderSplit"] .wk-header__nav{ justify-self:end; }

/* WorkHeaderMinimal — logo-left + CTA-right only; nav hidden. */
.wk-header[data-wk-header-layout="WorkHeaderMinimal"] .wk-header__nav{ display:none; }

/* STICKY / FIXED — design state (data-wk-header-mode). */
.wk-header[data-wk-header-mode="fixed"]{ position:fixed; top:0; left:0; right:0; z-index:50; }
.wk-header[data-wk-header-mode="fixed"].is-scrolled{ box-shadow:0 1px 0 var(--wk-line), 0 8px 24px rgba(0,0,0,0.06); }

@media(max-width:820px){ .wk-header__in{ grid-template-columns:1fr auto; } .wk-header__nav{ display:none; } }
`;
