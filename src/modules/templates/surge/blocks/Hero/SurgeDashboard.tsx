// Static decorative "live dashboard" — Surge's hero centerpiece. No hooks, no
// 'use client' → safe to render in BOTH the edit and published renderers. The
// numbers are fixed/illustrative (not editable copy); when the user uploads a
// hero_image the parent shows that image instead of this dashboard.
// Ported from Surge HTML (lines 871-910).

import React from 'react';

export function SurgeDashboard() {
  return (
    <div className="sg-dash" aria-hidden="true">
      <div className="sg-dash-bar">
        <span className="sg-dash-dots"><i /><i /><i /></span>
        <span className="sg-dash-tabs"><span className="on">Overview</span><span>Channels</span><span>Content</span></span>
        <span className="sg-dash-live"><span className="lv" />LIVE</span>
      </div>
      <div className="sg-kpi-row">
        <div className="sg-kpi"><div className="k-l">Impressions</div><div className="k-v">3.2M</div><div className="k-d">↗ +312%</div></div>
        <div className="sg-kpi"><div className="k-l">Followers</div><div className="k-v">24.6k</div><div className="k-d">↗ +18.4×</div></div>
        <div className="sg-kpi"><div className="k-l">Engagement</div><div className="k-v">8.4%</div><div className="k-d">↗ +5.1pt</div></div>
      </div>
      <div className="sg-chart-card">
        <div className="sg-chart-head"><span className="ct">Impressions · last 6 months</span><span className="cv">↗ trending up</span></div>
        <svg className="sg-trend" viewBox="0 0 320 96" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="sg-ag" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--accent)" stopOpacity="0.34" />
              <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0,82 L46,76 L92,80 L138,60 L184,52 L230,34 L276,24 L320,8 L320,96 L0,96 Z" fill="url(#sg-ag)" />
          <path d="M0,82 L46,76 L92,80 L138,60 L184,52 L230,34 L276,24 L320,8" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="320" cy="8" r="4" fill="var(--accent)" />
          <circle cx="320" cy="8" r="8" fill="var(--accent)" opacity="0.22" />
        </svg>
        <div className="sg-chart-x"><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span></div>
      </div>
      <div className="sg-mix">
        <div className="m-row"><span className="m-l">X / Twitter</span><span className="m-track"><i style={{ width: '48%' }} /></span><span className="m-v">48%</span></div>
        <div className="m-row"><span className="m-l">LinkedIn</span><span className="m-track"><i style={{ width: '27%', opacity: 0.82 }} /></span><span className="m-v">27%</span></div>
        <div className="m-row"><span className="m-l">SEO / organic</span><span className="m-track"><i style={{ width: '18%', opacity: 0.62 }} /></span><span className="m-v">18%</span></div>
        <div className="m-row"><span className="m-l">Newsletter</span><span className="m-track"><i style={{ width: '7%', opacity: 0.42 }} /></span><span className="m-v">7%</span></div>
      </div>
    </div>
  );
}

export function SurgeFloatChips() {
  return (
    <>
      <div className="sg-float-chip a"><span className="fi">↗</span><div><b>+312%</b><small>impressions / qtr</small></div></div>
      <div className="sg-float-chip b"><span className="fi">@</span><div><b>+24.6k</b><small>followers · 5 mo</small></div></div>
    </>
  );
}

export default SurgeDashboard;
