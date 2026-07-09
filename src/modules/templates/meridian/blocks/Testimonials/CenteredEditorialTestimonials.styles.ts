// src/modules/templates/meridian/blocks/Testimonials/CenteredEditorialTestimonials.styles.ts
// Shared CSS for the CenteredEditorialTestimonials variant (scale-09 phase 6).
// Plain module (NOT 'use client') imported by BOTH renderers → lockstep parity
// (published/client-boundary rule). Ported from the designer handoff "Meridian
// Variant - Testimonials (Centered Editorial).html" (.section/.te-* markup),
// tokens mapped onto Meridian's. Accent inherited via var(--accent). CSS-only.
// Optional bands (stats / logos) and the supporting grid render conditionally on
// collection length — handled in the components, not here.

export const CENTERED_EDITORIAL_TESTIMONIALS_STYLES = `
.mrd-te-sec { padding: var(--sec-pad-y) var(--sec-pad-x); max-width: 1340px; margin: 0 auto; position: relative; }

.mrd-te__head { text-align: center; max-width: 60ch; margin: 0 auto; }
.mrd-te__eyebrow {
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--bone-3); display: inline-flex; align-items: center; gap: 10px; justify-content: center;
}
.mrd-te__eyebrow::before,
.mrd-te__eyebrow::after { content: ""; width: 28px; height: 1px; background: var(--line-strong); display: inline-block; }
.mrd-te__title {
  font-family: var(--font-display); font-weight: 500; font-size: clamp(34px, 3.6vw, 48px);
  line-height: 1.08; letter-spacing: -0.025em; color: var(--bone); margin: 20px auto 0; max-width: 20ch;
}

.mrd-te__featured { max-width: 34ch; margin: 64px auto 0; text-align: center; position: relative; }
.mrd-te__mark {
  font-family: var(--font-display); font-size: 64px; line-height: 0.7; color: var(--accent);
  letter-spacing: -0.03em; display: block; margin-bottom: 18px;
}
.mrd-te__quote {
  margin: 0; font-family: var(--font-display); font-weight: 400;
  font-size: clamp(26px, 3vw, 38px); line-height: 1.28; letter-spacing: -0.02em; color: var(--bone);
}
.mrd-te__who {
  display: inline-flex; align-items: center; gap: 12px; margin-top: 32px;
  padding-top: 22px; border-top: 1px solid var(--line);
}
.mrd-te__avatar {
  width: 38px; height: 38px; border-radius: 50%;
  background: linear-gradient(135deg, var(--ink-2), var(--bone-3)); border: 1px solid var(--line-strong); flex-shrink: 0;
}
.mrd-te__who-meta { text-align: left; }
.mrd-te__name { font-family: var(--font-display); font-size: 15px; color: var(--bone); font-weight: 500; }
.mrd-te__role { font-family: var(--font-mono); font-size: 11px; color: var(--bone-3); margin-top: 2px; }

.mrd-te__support { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; max-width: 900px; margin: 56px auto 0; }
.mrd-te__card {
  border: 1px solid var(--line); border-radius: var(--r-lg); padding: 26px 26px 22px;
  background: var(--ink); display: flex; flex-direction: column; position: relative;
}
.mrd-te__card .mrd-te__quote { font-size: 17px; line-height: 1.45; letter-spacing: -0.01em; flex: 1; }
.mrd-te__card .mrd-te__who { display: flex; margin-top: 20px; }
.mrd-te__card .mrd-te__avatar { width: 32px; height: 32px; }
.mrd-te__card .mrd-te__name { font-size: 13.5px; }
.mrd-te__card .mrd-te__role { font-size: 10.5px; }

.mrd-te__stats {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: var(--line);
  border-top: 1px solid var(--line); border-bottom: 1px solid var(--line);
  max-width: 900px; margin: 64px auto 0;
}
.mrd-te__stat { background: var(--ink); padding: 30px 20px; text-align: center; position: relative; }
.mrd-te__stat-k { font-family: var(--font-display); font-weight: 500; font-size: clamp(34px, 3.4vw, 44px); letter-spacing: -0.02em; color: var(--bone); line-height: 1; }
.mrd-te__stat-k em { font-style: normal; color: var(--accent); }
.mrd-te__stat-l { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--bone-3); margin-top: 10px; }

.mrd-te__logos {
  display: grid; grid-template-columns: repeat(6, 1fr); gap: 0;
  border-top: 1px solid var(--line); border-bottom: 1px solid var(--line);
  max-width: 1100px; margin: 56px auto 0;
}
.mrd-te__logo {
  padding: 24px 0; text-align: center; font-family: var(--font-display); font-weight: 600;
  font-size: 15px; letter-spacing: -0.01em; color: var(--bone-2); border-right: 1px solid var(--line); position: relative;
}
.mrd-te__logo:last-child { border-right: 0; }

/* Edit-mode add/remove affordances (edit renderer only) */
.mrd-te__remove {
  position: absolute; top: 8px; right: 8px; width: 20px; height: 20px;
  background: transparent; border: 1px solid var(--line-strong); border-radius: 50%;
  color: var(--bone-3); font-size: 12px; line-height: 1; cursor: pointer; z-index: 2;
}
.mrd-te__add {
  border: 1px dashed var(--line-strong); background: transparent; color: var(--bone-3);
  font-family: var(--font-body); font-size: 13px; cursor: pointer; border-radius: var(--r-sm);
  display: grid; place-items: center; padding: 22px; min-height: 120px;
}
.mrd-te__add:hover { color: var(--accent); border-color: var(--accent); }
.mrd-te__add--sm { min-height: 0; padding: 14px; font-size: 12px; }

/* Responsive */
@media (max-width: 940px) {
  .mrd-te__support { grid-template-columns: 1fr; }
  .mrd-te__logos { grid-template-columns: repeat(3, 1fr); }
  .mrd-te__logos .mrd-te__logo:nth-child(3) { border-right: 0; }
}
@media (max-width: 560px) {
  .mrd-te__stats { grid-template-columns: 1fr; }
  .mrd-te__logos { grid-template-columns: repeat(2, 1fr); }
  .mrd-te__logos .mrd-te__logo:nth-child(2n) { border-right: 0; }
}
`;
