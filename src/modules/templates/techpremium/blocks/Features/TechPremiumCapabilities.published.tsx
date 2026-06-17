// src/modules/templates/techpremium/blocks/Features/TechPremiumCapabilities.published.tsx
// Server-safe published variant of TechPremiumCapabilities.

import React from 'react';
import * as Icons from 'lucide-react';

interface Feature {
  id?: string;
  title?: string;
  description?: string;
  icon?: string;
  link_text?: string;
}

interface TechPremiumCapabilitiesPublishedProps {
  sectionId: string;
  eyebrow?: string;
  headline?: string;
  lede?: string;
  features?: Feature[];
}

function CapIcon({ name }: { name: string }) {
  const Component = (Icons as any)[name] || Icons.Activity;
  return <Component size={21} strokeWidth={1.6} />;
}

export default function TechPremiumCapabilitiesPublished(props: TechPremiumCapabilitiesPublishedProps) {
  const features = Array.isArray(props.features) ? props.features : [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="tp-sec">
        <div className="tp-sec__inner">
          <div className="tp-sec-head">
            {props.eyebrow && <span className="tp-eyebrow">{props.eyebrow}</span>}
            {props.headline && (
              <h2 className="tp-sec-head__h2" dangerouslySetInnerHTML={{ __html: props.headline }} />
            )}
            {props.lede && (
              <p className="tp-sec-head__lede" dangerouslySetInnerHTML={{ __html: props.lede }} />
            )}
          </div>

          {features.length > 0 && (
            <div className="tp-cap-grid">
              {features.map((f, idx) => (
                <article key={f.id || idx} className="tp-cap">
                  <span className="tp-cap__ico"><CapIcon name={f.icon || 'Activity'} /></span>
                  {f.title && <h3 className="tp-cap__h3">{f.title}</h3>}
                  {f.description && <p className="tp-cap__p">{f.description}</p>}
                  {f.link_text && <a className="tp-cap__link" href="#">{f.link_text}</a>}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

const STYLES = `
.tp-sec { padding: var(--pad-y) var(--pad-x); }
.tp-sec__inner { max-width: var(--max-w); margin: 0 auto; }
.tp-sec-head { max-width: 64ch; display: flex; flex-direction: column; gap: 16px; margin-bottom: 48px; }
.tp-eyebrow { font-family:var(--font-mono); font-weight:500; font-size:11.5px; letter-spacing:0.20em; text-transform:uppercase; color:var(--lime-d); display:inline-flex; align-items:center; gap:10px; align-self:flex-start; }
.tp-eyebrow::before { content:""; width:22px; height:1px; background:var(--line-2); }
.tp-sec-head__h2 { font-family:var(--font-display); font-weight:600; font-size:clamp(30px,4vw,46px); letter-spacing:-0.018em; line-height:1.1; color:var(--ink); margin:0; }
.tp-sec-head__lede { font-family:var(--font-body); font-size:18px; line-height:1.7; color:var(--ink-2); margin:0; max-width:60ch; }
.tp-cap-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:var(--line); border:1px solid var(--line); border-radius:var(--r-lg); overflow:hidden; }
.tp-cap { background:var(--paper); padding:30px 28px; display:flex; flex-direction:column; gap:14px; transition:background .16s ease; }
.tp-cap:hover { background:var(--paper-2); }
.tp-cap__ico { width:40px; height:40px; border-radius:9px; border:1px solid var(--line-2); display:grid; place-items:center; color:var(--forest); }
.tp-cap__h3 { font-family:var(--font-display); font-weight:600; font-size:18px; letter-spacing:-0.018em; line-height:1.2; color:var(--ink); margin:0; }
.tp-cap__p { margin:0; color:var(--ink-2); font-size:14.5px; line-height:1.6; }
.tp-cap__link { font-family:var(--font-mono); font-size:11.5px; letter-spacing:0.04em; color:var(--lime-d); text-decoration:none; }
.tp-cap__link:hover { color:var(--forest); }
@media (max-width:760px){ .tp-cap-grid { grid-template-columns:1fr 1fr; } }
@media (max-width:520px){ .tp-cap-grid { grid-template-columns:1fr; } }
`;
