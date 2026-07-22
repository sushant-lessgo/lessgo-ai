// src/modules/templates/techpremium/blocks/Readout/TechPremiumReadout.tsx
// Signature "live-readout" card (CO₂/Temp/RH instrument panel), reused inside
// Hero / Explainer / Compatibility. Presentational + server-safe — the SAME
// component renders in edit and published (no hooks). Published value spans carry
// data-live; the shared naayom.v1.js ticks them (inert in edit, no asset loaded).
// Port of naayom.css `.readout`. tp-rd- scoped to avoid collisions.

import React from 'react';

export interface ReadoutMetric {
  key: string;        // "CO₂"
  value: string;      // "820"
  unit?: string;      // " ppm"
  live?: string;      // 'co2' | 'temp' | 'rh' | 'co2b' | 'tempb' | 'rhb' → data-live hook
}
export interface ReadoutData {
  statusLabel?: string;   // "Chamber 4"
  statusTone?: string;    // '' | 'teal'
  stage?: string;         // "Flowering · day 6"
  metrics?: ReadoutMetric[];
  caption?: string;       // "24h trend · live · 12s"
}

// Decorative static sparkline (the live feel comes from the ticking metrics).
const SPARK = (
  <svg className="tp-rd-spark" viewBox="0 0 220 34" preserveAspectRatio="none" aria-hidden="true">
    <polyline className="area" points="0,30 24,22 48,26 72,14 96,18 120,9 144,16 168,8 192,13 220,6 220,34 0,34" />
    <polyline points="0,30 24,22 48,26 72,14 96,18 120,9 144,16 168,8 192,13 220,6" />
  </svg>
);

export function TechPremiumReadout({ data }: { data?: ReadoutData }) {
  if (!data) return null;
  const metrics = Array.isArray(data.metrics) ? data.metrics.slice(0, 3) : [];
  if (!metrics.length) return null;
  return (
    <div className="tp-rd">
      <div className="tp-rd-top">
        <span className="tp-rd-loc">
          <span className={`tp-rd-pill${data.statusTone === 'teal' ? ' teal' : ''}`}><span className="tp-rd-dot" /></span>
          {data.statusLabel && <b>{data.statusLabel}</b>}
        </span>
        {data.stage && <span>{data.stage}</span>}
      </div>
      <div className="tp-rd-grid">
        {metrics.map((m, i) => (
          <div key={i} className="tp-rd-metric">
            <div className="tp-rd-k">{m.key}</div>
            <div className="tp-rd-v" {...(m.live ? { 'data-live': m.live } : {})}>
              {m.value}<small>{m.unit || ''}</small>
            </div>
          </div>
        ))}
      </div>
      {data.caption && (
        <div className="tp-rd-foot">
          {SPARK}
          <span className="tp-rd-meta">{data.caption}</span>
        </div>
      )}
    </div>
  );
}

// Included by every block that renders a readout (append to the block's STYLES).
export const READOUT_STYLES = `
.tp-rd { background:var(--paper); border:1px solid var(--line-2); border-radius:var(--r-lg); box-shadow:0 18px 48px -28px color-mix(in oklch, var(--forest) 50%, transparent), 0 2px 8px -4px color-mix(in oklch, var(--forest) 25%, transparent); overflow:hidden; width:100%; color:var(--ink); }
.tp-rd-top { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:11px 16px; border-bottom:1px solid var(--line); font-family:var(--font-mono); font-size:11px; font-weight:500; letter-spacing:0.10em; text-transform:uppercase; color:var(--ink-2); }
.tp-rd-loc { display:inline-flex; align-items:center; gap:9px; }
.tp-rd-loc b { color:var(--ink); font-weight:600; }
.tp-rd-pill { display:inline-flex; align-items:center; padding:4px 7px; border-radius:999px; color:var(--ok); background:var(--ok-bg); border:1px solid oklch(0.66 0.15 150 / 0.30); }
.tp-rd-pill .tp-rd-dot { width:6px; height:6px; border-radius:50%; background:var(--ok); box-shadow:0 0 0 3px var(--ok-bg); }
.tp-rd-pill.teal { color:var(--teal); background:var(--teal-dim); border-color:oklch(0.70 0.095 192 / 0.30); }
.tp-rd-pill.teal .tp-rd-dot { background:var(--teal); box-shadow:0 0 0 3px var(--teal-dim); }
.tp-rd-grid { display:grid; grid-template-columns:repeat(3,1fr); }
.tp-rd-metric { padding:16px 16px 14px; border-right:1px solid var(--line); }
.tp-rd-metric:last-child { border-right:0; }
.tp-rd-k { font-family:var(--font-mono); font-size:10px; font-weight:500; letter-spacing:0.16em; text-transform:uppercase; color:var(--ink-3); }
.tp-rd-v { font-family:var(--font-mono); font-weight:600; font-size:26px; letter-spacing:-0.02em; color:var(--ink); margin-top:4px; line-height:1; }
.tp-rd-v small { font-size:13px; font-weight:500; color:var(--ink-3); letter-spacing:0; }
.tp-rd-foot { padding:10px 16px 14px; border-top:1px solid var(--line); display:flex; align-items:center; gap:12px; }
.tp-rd-spark { flex:1; height:34px; }
.tp-rd-spark polyline { fill:none; stroke:var(--lime-d); stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
.tp-rd-spark .area { fill:var(--lime-dim); stroke:none; }
.tp-rd-meta { font-family:var(--font-mono); font-size:9.5px; letter-spacing:0.1em; text-transform:uppercase; color:var(--ink-3); text-align:right; line-height:1.4; }
`;
