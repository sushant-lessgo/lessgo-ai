// src/modules/templates/meridian/blocks/Hero/EditorialPhotoHero.styles.ts
// Shared CSS for the EditorialPhotoHero variant (scale-09 phase 6). Plain module
// (NOT 'use client') so BOTH the edit (.tsx) and published (.published.tsx)
// renderers import the SAME string — the published/client-boundary rule. Ported
// from the designer handoff "Meridian Variant - Hero (Editorial Photo).html"
// (.hero-ep markup), inline styles mapped onto Meridian's tokens. Accent is
// inherited via var(--accent) — never hardcoded. CSS-only (no JS).

export const EDITORIAL_PHOTO_HERO_STYLES = `
.mrd-hep {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 0.86fr) minmax(0, 1.14fr);
  min-height: 640px;
  max-width: 1340px; margin: 0 auto;
  overflow: hidden;
}
.mrd-hep__copy {
  padding: clamp(48px, 5vw, 76px) clamp(32px, 3.5vw, 56px);
  display: flex; flex-direction: column; justify-content: center;
  border-right: 1px solid var(--line);
  position: relative;
}
.mrd-hep__copy::before {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background:
    linear-gradient(var(--line-soft) 1px, transparent 1px) 0 0 / 100% 88px,
    linear-gradient(90deg, var(--line-soft) 1px, transparent 1px) 0 0 / 88px 100%;
  -webkit-mask-image: radial-gradient(ellipse at 20% 30%, black 10%, transparent 70%);
  mask-image: radial-gradient(ellipse at 20% 30%, black 10%, transparent 70%);
}
.mrd-hep__top { position: relative; display: flex; align-items: center; gap: 14px; margin-bottom: 30px; flex-wrap: wrap; }
.mrd-hep__status {
  font-family: var(--font-mono); font-size: 11.5px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--bone-3);
  display: inline-flex; align-items: center; gap: 10px;
}
.mrd-hep__dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 12px var(--accent); }
.mrd-hep__tag {
  font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--bone-2); border: 1px solid var(--line); border-radius: var(--r-pill); padding: 5px 12px;
}
.mrd-hep__headline {
  position: relative;
  font-family: var(--font-display); font-weight: 600;
  font-size: clamp(44px, 4.6vw, 76px); line-height: 0.96; letter-spacing: -0.035em;
  margin: 0; max-width: 16ch; color: var(--bone);
}
.mrd-hep__headline em { color: var(--accent); font-style: normal; }
.mrd-hep__lede {
  position: relative;
  font-family: var(--font-display); font-weight: 400; font-size: clamp(18px, 1.4vw, 21px); line-height: 1.5;
  color: var(--bone-2); max-width: 46ch; margin: 28px 0 0;
}
.mrd-hep__actions { position: relative; display: flex; align-items: center; gap: 12px; margin-top: 40px; flex-wrap: wrap; }
.mrd-hep__cta-wrap { display: flex; flex-direction: column; gap: 8px; }
.mrd-hep__cta-sub { font-family: var(--font-mono); font-size: 11px; color: var(--bone-3); letter-spacing: 0.02em; padding-left: 2px; }

.mrd-hep__media { position: relative; min-height: 640px; padding: 20px; }
.mrd-hep__frame {
  position: absolute; inset: 20px;
  border: 1px solid var(--line-strong); border-radius: var(--r-lg); overflow: hidden;
}
.mrd-hep__frame::after {
  content: ""; position: absolute; inset: 12px; z-index: 2; pointer-events: none; opacity: 0.55;
  background:
    linear-gradient(var(--accent),var(--accent)) left top/18px 1.5px no-repeat,
    linear-gradient(var(--accent),var(--accent)) left top/1.5px 18px no-repeat,
    linear-gradient(var(--accent),var(--accent)) right bottom/18px 1.5px no-repeat,
    linear-gradient(var(--accent),var(--accent)) right bottom/1.5px 18px no-repeat;
}
.mrd-hep__img {
  position: absolute; inset: 0;
  background:
    repeating-linear-gradient(135deg, var(--ink-1), var(--ink-1) 11px, var(--ink-2) 11px, var(--ink-2) 22px);
  display: grid; place-items: center;
}
.mrd-hep__img img { width: 100%; height: 100%; object-fit: cover; display: block; }
.mrd-hep__slot-lbl {
  font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.06em; color: var(--bone-3);
  background: color-mix(in oklch, var(--ink) 78%, transparent); border: 1px solid var(--line);
  padding: 8px 14px; border-radius: var(--r-sm); text-align: center; max-width: 80%;
}
.mrd-hep__slot-lbl b { color: var(--bone-2); font-weight: 500; }
.mrd-hep__caption {
  position: absolute; left: 32px; bottom: 32px; z-index: 3;
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.04em; color: var(--bone-2);
  background: color-mix(in oklch, var(--ink) 72%, transparent);
  border: 1px solid var(--line); border-radius: var(--r-sm);
  padding: 7px 12px; -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);
  display: inline-flex; align-items: center; gap: 9px;
}
.mrd-hep__caption::before { content: ""; width: 5px; height: 5px; border-radius: 50%; background: var(--accent); }

/* Edit-mode photo controls (edit renderer only — no runtime cost on publish) */
.mrd-hep__photo-edit { position: absolute; top: 32px; left: 32px; z-index: 4; display: inline-flex; align-items: center; gap: 6px; }
.mrd-hep__photo-btn { display: inline-flex; align-items: center; gap: 4px; font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.04em; color: var(--accent-ink); background: var(--accent); border-radius: var(--r-sm); padding: 6px 11px; cursor: pointer; white-space: nowrap; }
.mrd-hep__photo-x { background: transparent; border: 1px solid var(--line-strong); border-radius: var(--r-sm); color: var(--bone-3); font-family: var(--font-mono); font-size: 10.5px; padding: 5px 9px; cursor: pointer; }

/* Buttons (identical to TerminalHero's .mrd-btn set — accent-inherited) */
.mrd-btn {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: var(--font-display); font-weight: 500; font-size: 13.5px;
  letter-spacing: -0.005em; border-radius: var(--r-md); padding: 10px 14px;
  transition: all 140ms ease; border: 1px solid transparent; cursor: pointer; text-decoration: none;
  white-space: nowrap;
}
.mrd-btn--lg { padding: 14px 20px; font-size: 15px; border-radius: var(--r-md); }
.mrd-btn--primary { background: var(--accent); color: var(--accent-ink); }
.mrd-btn--primary:hover { filter: brightness(1.06); }
.mrd-btn--ghost { color: var(--bone); border-color: var(--line); background: transparent; }
.mrd-btn--ghost:hover { border-color: var(--line-strong); background: var(--ink-1); }
.mrd-btn--arrow::after { content: "→"; font-family: var(--font-mono); font-size: 13px; }

/* Responsive */
@media (max-width: 940px) {
  .mrd-hep { grid-template-columns: 1fr; min-height: 0; }
  .mrd-hep__copy { border-right: 0; border-bottom: 1px solid var(--line); }
  .mrd-hep__media { min-height: 420px; }
}
@media (max-width: 560px) {
  .mrd-hep__media { min-height: 320px; padding: 12px; }
  .mrd-hep__frame { inset: 12px; }
  .mrd-hep__caption { left: 22px; bottom: 22px; }
  .mrd-hep__photo-edit { left: 22px; top: 22px; }
  .mrd-hep__actions { flex-direction: column; align-items: flex-start; }
}
`;
