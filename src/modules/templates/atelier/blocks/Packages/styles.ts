// Atelier Packages CSS — the `packages` capability's evidence section. Ported from
// the approved design (styles.css EXPERIENCES; atl-* → lg-atelier-). Grid auto-fit
// minmax(300px,1fr) survives 2 / 3 / 4 cards. Cards consume the --card-* knob
// baselines (cardStyle: hairline default | flat). Surface = paper / paper-2.

import { HATCH_PLACEHOLDER_CSS } from '../shared/styles';

export const PACKAGES_STYLES = `
${HATCH_PLACEHOLDER_CSS}
.lg-atelier-rule{ display:flex; flex-wrap:wrap; align-items:baseline; gap:10px 20px; border-top:2px solid var(--ink); padding-top:18px; margin-bottom:calc(clamp(28px,4vw,50px) * var(--space)); }
[data-surface="dark"] .lg-atelier-rule{ border-top-color:var(--paper); }
.lg-atelier-rule__idx{ font-family:var(--ff-display); font-weight:600; font-size:14px; color:var(--accent-deep); }
.lg-atelier-rule h2{ font-size:clamp(30px,4.6vw,62px); font-weight:600; letter-spacing:-0.03em; }
.lg-atelier-rule__meta{ margin-left:auto; font-weight:500; font-size:12px; letter-spacing:0.14em; text-transform:uppercase; color:var(--ink-mute); max-width:30ch; text-align:right; line-height:1.6; }

.lg-atelier-packs{ display:grid; grid-template-columns:repeat(auto-fit, minmax(min(300px,100%), 1fr)); gap:calc(26px * var(--space)); align-items:stretch; }
.lg-atelier-pack{ display:flex; flex-direction:column; background:var(--card-bg); border:var(--card-bd); }
.lg-atelier-pack-img{ position:relative; aspect-ratio:3/2; overflow:hidden; }
.lg-atelier-pack-img__img{ position:relative; display:block; width:100%; height:100%; }
.lg-atelier-pack-img__img img{ width:100%; height:100%; object-fit:cover; display:block; }
.lg-atelier-flag{ position:absolute; top:0; left:0; z-index:2; background:var(--accent); color:#fff; font-weight:600; font-size:10px; letter-spacing:0.18em; text-transform:uppercase; padding:9px 14px; }
.lg-atelier-pack-body{ padding:calc(28px * var(--space)) calc(28px * var(--space)) calc(32px * var(--space)); display:flex; flex-direction:column; gap:calc(15px * var(--space)); flex:1; }
.lg-atelier-pack-cat{ font-weight:600; font-size:10px; letter-spacing:0.24em; text-transform:uppercase; color:var(--accent-deep); }
.lg-atelier-pack h3{ font-family:var(--ff-display); font-size:clamp(24px,2.4vw,30px); font-weight:600; letter-spacing:-0.025em; margin:0; line-height:0.98; }
.lg-atelier-price{ font-family:var(--ff-display); font-weight:600; font-size:clamp(32px,3vw,42px); letter-spacing:-0.03em; line-height:1; }
.lg-atelier-pack-features{ list-style:none; margin:4px 0 0; padding:calc(18px * var(--space)) 0 0; border-top:1px solid var(--line); display:grid; gap:calc(10px * var(--space)); }
.lg-atelier-pack-features li{ display:grid; grid-template-columns:auto 1fr; gap:10px; font-size:14px; line-height:1.5; color:var(--ink-soft); }
.lg-atelier-pack-features li::before{ content:"—"; color:var(--accent-deep); }
.lg-atelier-pack-foot{ margin-top:auto; padding-top:calc(22px * var(--space)); }
.lg-atelier-pack-foot .lg-atelier-btn{ width:100%; }
`;
