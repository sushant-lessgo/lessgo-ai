// src/modules/skeletons/work/blocks/Packages/styles.ts
// WorkPackages CSS (edit + published parity). `wk-packages-` prefixed. Token-driven
// ONLY via CSS custom properties: SKIN `var(--wk-*)` + USER `var(--u-*, <default>)`.
// A priced-services card grid (the conviction pillar — "on request" is a legal
// price answer). price_mode drives whether a "from" affix precedes the price line.

// Shared var-gated rule-header grammar (Wave 2A). NEUTRAL default = byte-identical
// stacked head; `sectionHeaderStyle:'rule'` → Atelier rule header. See Gallery/styles.
import { RULE_HEAD } from '../Gallery/styles';

export const WORK_PACKAGES_STYLES = `
.wk-packages{ background:var(--u-bg, var(--wk-paper)); color:var(--u-fg, var(--wk-ink)); }
.wk-packages__in{ width:100%; max-width:var(--wk-wrap); margin:0 auto; padding:calc(var(--wk-sec-y) * var(--u-space-y, 1)) var(--wk-gutter); }
.wk-packages__head{ margin-bottom:clamp(28px,4vw,56px); }
.wk-packages__eyebrow{ font-family:var(--wk-ff-body); font-weight:600; font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:var(--wk-ink-mute); }
.wk-packages__heading{ font-family:var(--wk-ff-display); font-weight:var(--wk-display-weight); font-size:clamp(1.9rem,4.4vw,3.4rem); line-height:1.02; letter-spacing:-0.02em; margin:10px 0 0; }
.wk-packages__lead{ font-family:var(--wk-ff-body); font-size:var(--wk-fs-body); line-height:var(--wk-lh-body); color:var(--wk-ink-soft); max-width:52ch; margin:14px 0 0; }
.wk-packages__grid{ display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:clamp(16px,2.4vw,30px); }
.wk-packages__card{ position:relative; display:flex; flex-direction:column; gap:14px; background:var(--wk-paper); border:1px solid var(--wk-line); border-radius:var(--u-radius, var(--wk-r)); padding:clamp(22px,2.6vw,34px); }
/* Per-tier image (Wave 2). Pulled flush to the card edges (counter the card
   padding) to match the designer .atl-pack-img. GRACEFUL-EMPTY: an image-less
   tier renders an EMPTY div (published Img with no src + no placeholder) — hidden
   via :empty so the card is byte-identical to today. In edit the div holds the
   picker affordance (never :empty), so the "add image" control stays reachable. */
.wk-packages__img{ margin:calc(-1 * clamp(22px,2.6vw,34px)) calc(-1 * clamp(22px,2.6vw,34px)) 0; border-radius:var(--u-radius, var(--wk-r)) var(--u-radius, var(--wk-r)) 0 0; overflow:hidden; }
.wk-packages__img:empty{ display:none; }
.wk-packages__img-el{ display:block; width:100%; aspect-ratio:3/2; object-fit:cover; }
/* "Most booked" chip (Wave 2). Absolute over the card top-left; anchors to the
   position:relative card. Rendered only when featured (graceful-empty). */
.wk-packages__flag{ position:absolute; top:0; left:0; z-index:2; background:var(--wk-accent); color:var(--wk-accent-ink,#fff); font-family:var(--wk-ff-body); font-weight:600; font-size:10px; letter-spacing:0.18em; text-transform:uppercase; padding:9px 14px; }
/* Section category label (Wave 2). Empty → the E.Txt renders nothing (no leak). */
.wk-packages__cat{ display:block; font-family:var(--wk-ff-body); font-weight:600; font-size:10px; letter-spacing:0.24em; text-transform:uppercase; color:var(--wk-accent); margin:12px 0 0; }
/* Dash-bullet "what's included" list (Wave 2). */
.wk-packages__bullets{ list-style:none; margin:2px 0 0; padding:16px 0 0; border-top:1px solid var(--wk-line); display:grid; gap:10px; }
.wk-packages__bullet{ display:grid; grid-template-columns:auto 1fr; gap:10px; font-family:var(--wk-ff-body); font-size:14px; line-height:1.5; color:var(--wk-ink-soft); }
.wk-packages__bullet::before{ content:"—"; color:var(--wk-accent); }
.wk-packages__name{ font-family:var(--wk-ff-display); font-weight:600; font-size:1.25rem; letter-spacing:-0.01em; }
.wk-packages__price{ display:flex; align-items:baseline; gap:8px; font-family:var(--wk-ff-display); font-weight:var(--wk-display-weight); font-size:var(--wk-pkg-price-fs, 1.7rem); letter-spacing:-0.02em; color:var(--wk-accent); }
.wk-packages__from{ font-family:var(--wk-ff-body); font-weight:600; font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:var(--wk-ink-mute); }
.wk-packages__desc{ font-family:var(--wk-ff-body); font-size:var(--wk-fs-body); line-height:var(--wk-lh-body); color:var(--wk-ink-soft); flex:1 1 auto; }
/* CTA (Wave 2B): var-gated between the list link-style (defaults, byte-identical)
   and the Atelier card — a full-width square accent button pinned to the card foot
   (margin-top:auto). Uses only the frozen cta_label field. */
.wk-packages__cta{ align-self:var(--wk-pkg-cta-align, flex-start); width:var(--wk-pkg-cta-w, auto); margin-top:var(--wk-pkg-cta-mt, 0); box-sizing:border-box; font-family:var(--wk-ff-body); font-weight:600; font-size:13px; letter-spacing:0.02em; text-align:var(--wk-pkg-cta-ta, left); color:var(--wk-pkg-cta-color, var(--wk-accent)); background:var(--wk-pkg-cta-bg, transparent); text-decoration:none; border-bottom:var(--wk-pkg-cta-bb, 1px solid var(--wk-accent)); border-radius:var(--u-radius, var(--wk-r)); padding:var(--wk-pkg-cta-pad, 0 0 2px); }
${RULE_HEAD('wk-packages', 'lead')}`;
