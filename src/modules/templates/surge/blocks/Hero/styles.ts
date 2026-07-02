// Shared CSS for the Surge hero (edit + published parity). All classes `sg-`
// prefixed. Ported from Surge HTML (lines 293-377). The block does NOT paint a
// full-bleed section bg — the data-surface wrapper does.

export const HERO_STYLES = `
.sg-hero { padding: clamp(48px,7vw,84px) var(--sec-pad-x) clamp(40px,5vw,64px); position: relative; overflow: hidden; }
.sg-hero::before {
  content: ""; position: absolute; inset: -10% -10% auto auto; width: 60%; height: 120%;
  background: radial-gradient(circle at 70% 30%, var(--accent-soft), transparent 62%); opacity: 0.7; pointer-events: none;
}
.sg-hero__grid { display: grid; grid-template-columns: 1.02fr 1.1fr; gap: clamp(32px,4vw,64px); align-items: center; position: relative; max-width: var(--max-w); margin: 0 auto; }
.sg-hero__content { max-width: 560px; }
.sg-pill {
  display: inline-flex; align-items: center; gap: 8px; font-family: var(--font-mono);
  font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--accent-deep); background: var(--accent-soft); padding: 7px 13px; border-radius: var(--r-pill); margin-bottom: 22px;
}
.sg-pill .sg-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--pos); box-shadow: 0 0 0 3px var(--pos-soft); }
.sg-hero__display {
  font-family: var(--font-display); font-weight: 800; font-size: clamp(40px,5.6vw,74px);
  line-height: 0.98; letter-spacing: -0.04em; margin: 0; color: var(--ink);
}
.sg-hero__lede { font-size: 18.5px; line-height: 1.55; color: var(--ink-2); margin: 22px 0 28px; font-weight: 500; max-width: 46ch; }
.sg-hero__actions { display: flex; flex-direction: column; gap: 18px; }
.sg-hero__cta-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
.sg-hero__trust { display: flex; align-items: center; gap: 14px; font-size: 13.5px; color: var(--ink-3); font-weight: 500; }
.sg-hero__trust b { color: var(--ink); }

.sg-btn {
  display: inline-flex; align-items: center; gap: 8px; justify-content: center;
  font-family: var(--font-display); font-weight: 700; font-size: 15px; letter-spacing: -0.01em;
  padding: 13px 22px; border-radius: var(--r-sm); white-space: nowrap; cursor: pointer; text-decoration: none;
  border: 0; transition: transform 140ms ease, background 140ms ease, box-shadow 140ms ease;
}
.sg-btn--primary { background: var(--accent); color: var(--accent-on); box-shadow: var(--shadow-accent); }
.sg-btn--primary:hover { transform: translateY(-1px); background: var(--accent-deep); }
.sg-btn--ghost { background: transparent; color: var(--ink); box-shadow: inset 0 0 0 1.5px var(--line-2); }
.sg-btn--ghost:hover { box-shadow: inset 0 0 0 1.5px var(--ink); }

/* DASHBOARD centerpiece */
.sg-dash-wrap { position: relative; }
.sg-dash {
  background: var(--panel); border-radius: var(--r-lg); padding: 18px; color: oklch(0.92 0.01 265);
  box-shadow: var(--shadow-l), 0 0 0 1px var(--panel-line); position: relative;
}
.sg-dash__photo { border-radius: var(--r-lg); background-size: cover; background-position: center; min-height: 420px; box-shadow: var(--shadow-l), 0 0 0 1px var(--panel-line); }
.sg-dash-bar { display: flex; align-items: center; gap: 10px; padding: 2px 4px 14px; border-bottom: 1px solid var(--panel-line); }
.sg-dash-dots { display: flex; gap: 6px; }
.sg-dash-dots i { width: 9px; height: 9px; border-radius: 50%; background: var(--panel-line); }
.sg-dash-tabs { display: flex; gap: 6px; margin-left: 8px; }
.sg-dash-tabs span { font-family: var(--font-mono); font-size: 10.5px; font-weight: 500; color: oklch(0.62 0.02 265); padding: 4px 9px; border-radius: var(--r-xs); }
.sg-dash-tabs span.on { background: var(--panel-2); color: oklch(0.95 0.01 265); }
.sg-dash-live { margin-left: auto; font-family: var(--font-mono); font-size: 10px; color: var(--pos); display: flex; align-items: center; gap: 6px; }
.sg-dash-live .lv { width: 6px; height: 6px; border-radius: 50%; background: var(--pos); box-shadow: 0 0 0 3px oklch(0.66 0.16 152 / 0.25); }
.sg-kpi-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin: 16px 0; }
.sg-kpi { background: var(--panel-2); border-radius: var(--r-md); padding: 13px 14px; }
.sg-kpi .k-l { font-family: var(--font-mono); font-size: 9.5px; letter-spacing: 0.08em; text-transform: uppercase; color: oklch(0.62 0.02 265); }
.sg-kpi .k-v { font-family: var(--font-display); font-weight: 800; font-size: 26px; letter-spacing: -0.03em; margin: 5px 0 4px; color: #fff; font-variant-numeric: tabular-nums; }
.sg-kpi .k-d { font-family: var(--font-mono); font-size: 10.5px; font-weight: 500; color: var(--pos); display: inline-flex; align-items: center; gap: 4px; }
.sg-chart-card { background: var(--panel-2); border-radius: var(--r-md); padding: 14px 16px 8px; }
.sg-chart-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 6px; }
.sg-chart-head .ct { font-family: var(--font-display); font-weight: 700; font-size: 13.5px; color: #fff; }
.sg-chart-head .cv { font-family: var(--font-mono); font-size: 10.5px; color: var(--pos); }
.sg-trend { width: 100%; height: 96px; display: block; }
.sg-chart-x { display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 9px; color: oklch(0.55 0.02 265); padding: 6px 2px 2px; }
.sg-mix { margin-top: 12px; display: grid; gap: 9px; }
.sg-mix .m-row { display: grid; grid-template-columns: 92px 1fr 38px; gap: 10px; align-items: center; }
.sg-mix .m-l { font-family: var(--font-mono); font-size: 11px; color: oklch(0.78 0.01 265); }
.sg-mix .m-track { height: 8px; border-radius: var(--r-pill); background: var(--panel); overflow: hidden; }
.sg-mix .m-track i { display: block; height: 100%; border-radius: var(--r-pill); background: var(--accent); }
.sg-mix .m-v { font-family: var(--font-mono); font-size: 11px; color: #fff; text-align: right; }
.sg-float-chip {
  position: absolute; z-index: 5; background: var(--surface);
  box-shadow: var(--shadow-m), 0 0 0 1px var(--line); border-radius: var(--r-md);
  padding: 11px 14px; display: flex; align-items: center; gap: 11px;
}
.sg-float-chip .fi { width: 34px; height: 34px; border-radius: var(--r-sm); display: inline-flex; align-items: center; justify-content: center; font-family: var(--font-mono); font-weight: 700; font-size: 15px; background: var(--accent-soft); color: var(--accent-deep); }
.sg-float-chip b { display: block; font-family: var(--font-display); font-weight: 800; font-size: 15px; letter-spacing: -0.01em; line-height: 1.1; color: var(--ink); }
.sg-float-chip small { font-size: 11px; color: var(--ink-3); font-family: var(--font-mono); }
.sg-float-chip.a { top: -18px; left: -26px; }
.sg-float-chip.a .fi { background: var(--pos-soft); color: oklch(0.45 0.13 152); }
.sg-float-chip.b { bottom: 26px; right: -24px; }

@media (max-width: 1080px) {
  .sg-hero__grid { grid-template-columns: 1fr; }
  .sg-dash-wrap { max-width: 520px; }
  .sg-float-chip { display: none; }
}
`;
