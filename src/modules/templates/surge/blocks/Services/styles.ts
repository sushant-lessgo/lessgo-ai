// Shared CSS for Surge services (edit + published parity). `sg-` prefixed.
// Also defines the shared section-head classes (.sg-sec-*) used by several Surge
// sections — kept identical everywhere they're duplicated. Ported from Surge HTML
// (sec-head 384-393; services-grid/.svc 409-426).

export const SERVICES_STYLES = `
.sg-section { max-width: var(--max-w); margin: 0 auto; padding: var(--sec-pad-y) var(--sec-pad-x); }
.sg-sec-head { max-width: 720px; margin-bottom: 44px; }
.sg-sec-eyebrow {
  font-family: var(--font-mono); font-size: 11px; font-weight: 700; letter-spacing: 0.13em;
  text-transform: uppercase; color: var(--accent-deep); display: inline-flex; align-items: center; gap: 8px; margin-bottom: 16px;
}
.sg-sec-eyebrow::before { content: "↗"; }
.sg-sec-title {
  font-family: var(--font-display); font-weight: 800; font-size: clamp(32px,4vw,50px);
  line-height: 1.02; letter-spacing: -0.035em; margin: 0; color: var(--ink);
}
.sg-sec-dek { font-size: 18px; color: var(--ink-2); margin: 16px 0 0; font-weight: 500; max-width: 60ch; }

.sg-services-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
.sg-svc {
  border: 1px solid var(--line); border-radius: var(--r-lg); padding: 26px 24px; background: var(--surface);
  transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease; position: relative; overflow: hidden;
  display: flex; flex-direction: column;
}
.sg-svc:hover { transform: translateY(-3px); box-shadow: var(--shadow-m); border-color: var(--line-2); }
.sg-svc__n { font-family: var(--font-mono); font-size: 11px; color: var(--ink-4); font-weight: 700; }
.sg-svc__ic {
  width: 44px; height: 44px; border-radius: var(--r-md); background: var(--accent-soft); color: var(--accent-deep);
  display: inline-flex; align-items: center; justify-content: center; font-family: var(--font-mono); font-weight: 700; font-size: 17px;
  margin: 14px 0 16px;
}
.sg-svc__title { font-family: var(--font-display); font-weight: 700; font-size: 20px; letter-spacing: -0.02em; margin: 0 0 8px; color: var(--ink); }
.sg-svc__desc { color: var(--ink-2); font-size: 14.5px; margin: 0 0 16px; line-height: 1.55; }
.sg-svc__cta { font-family: var(--font-display); font-weight: 700; font-size: 13.5px; color: var(--accent-deep); margin-top: auto; cursor: pointer; }
.sg-svc__remove {
  position: absolute; top: 10px; right: 10px; width: 24px; height: 24px; border-radius: 50%;
  background: var(--bg-1); border: 1px solid var(--line-2); color: var(--ink-2); font-size: 16px; line-height: 1; cursor: pointer;
  display: grid; place-items: center;
}
.sg-svc--add { background: transparent; border: 1px dashed var(--line-2); color: var(--ink-2); cursor: pointer; min-height: 180px; align-items: center; justify-content: center; font-family: var(--font-display); font-weight: 700; font-size: 14px; }
.sg-svc--add:hover { border-color: var(--accent); color: var(--accent-deep); }

@media (max-width: 1080px) { .sg-services-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 720px) { .sg-services-grid { grid-template-columns: 1fr; } }
`;
