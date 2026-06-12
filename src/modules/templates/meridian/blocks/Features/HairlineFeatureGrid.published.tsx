// src/modules/templates/meridian/blocks/Features/HairlineFeatureGrid.published.tsx
// Server-safe published variant of HairlineFeatureGrid.

import React from 'react';
import * as Icons from 'lucide-react';

interface Feature {
  id?: string;
  title?: string;
  description?: string;
  icon?: string;
  link_text?: string;
}

interface HairlineFeatureGridPublishedProps {
  sectionId: string;
  eyebrow?: string;
  headline?: string;
  lede?: string;
  features?: Feature[];
}

function FeatureIcon({ name }: { name: string }) {
  const Component = (Icons as any)[name] || Icons.Layers;
  return <Component size={16} strokeWidth={1.25} />;
}

export default function HairlineFeatureGridPublished(props: HairlineFeatureGridPublishedProps) {
  const features = Array.isArray(props.features) ? props.features : [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="mrd-section">
        {props.eyebrow && <div className="mrd-eyebrow"><span>{props.eyebrow}</span></div>}
        {props.headline && (
          <h2 className="mrd-section-title" dangerouslySetInnerHTML={{ __html: props.headline }} />
        )}
        {props.lede && (
          <p className="mrd-section-lede" dangerouslySetInnerHTML={{ __html: props.lede }} />
        )}
        {features.length > 0 && (
          <div className="mrd-features-grid">
            {features.map((f, idx) => (
              <article key={f.id || idx} className="mrd-feature">
                <div className="mrd-feature__n">F-{String(idx + 1).padStart(2, '0')}</div>
                <div className="mrd-feature__glyph"><FeatureIcon name={f.icon || 'Layers'} /></div>
                {f.title && <h3 className="mrd-feature__title">{f.title}</h3>}
                {f.description && <p className="mrd-feature__body">{f.description}</p>}
                {f.link_text && <a className="mrd-feature__link" href="#">{f.link_text}</a>}
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

const STYLES = `
.mrd-section { padding: var(--sec-pad-y) var(--sec-pad-x); max-width: 1340px; margin: 0 auto; position: relative; }
.mrd-eyebrow {
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.14em;
  text-transform: uppercase; color: var(--bone-3);
  display: inline-flex; align-items: center; gap: 10px;
}
.mrd-eyebrow::after { content: ""; width: 32px; height: 1px; background: var(--line-strong); display: inline-block; }
.mrd-section-title {
  font-family: var(--font-display); font-weight: 500; font-size: 52px;
  line-height: 1.05; letter-spacing: -0.025em; color: var(--bone);
  max-width: 22ch; margin: 22px 0 0;
}
.mrd-section-lede {
  font-family: var(--font-display); font-size: 19px; line-height: 1.5;
  color: var(--bone-2); max-width: 58ch; margin: 16px 0 0;
}
.mrd-features-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px;
  background: var(--line); border: 1px solid var(--line);
  border-radius: var(--r-lg); margin-top: 64px; overflow: hidden;
}
@media (max-width: 900px) { .mrd-features-grid { grid-template-columns: 1fr; } }
.mrd-feature { background: var(--ink); padding: 32px 28px 56px; position: relative; min-height: 260px; }
.mrd-feature__n { font-family: var(--font-mono); font-size: 11px; color: var(--bone-3); letter-spacing: 0.1em; }
.mrd-feature__glyph {
  width: 28px; height: 28px; border: 1px solid var(--line-strong); border-radius: var(--r-sm);
  display: grid; place-items: center; margin: 24px 0 20px; color: var(--accent);
}
.mrd-feature__title {
  font-family: var(--font-display); font-weight: 500; font-size: 21px;
  letter-spacing: -0.015em; line-height: 1.2; margin: 0 0 8px; color: var(--bone);
}
.mrd-feature__body { font-size: 14px; color: var(--bone-2); line-height: 1.55; margin: 0; }
.mrd-feature__link {
  position: absolute; left: 28px; bottom: 28px;
  font-family: var(--font-mono); font-size: 11.5px; color: var(--bone-3);
  letter-spacing: 0.02em; text-decoration: none;
}
.mrd-feature__link:hover { color: var(--accent); }
[data-variant="marketing"] .mrd-eyebrow { font-family: var(--font-body); font-size: 13px; letter-spacing: 0; text-transform: none; font-weight: 500; color: var(--bone-2); }
[data-variant="marketing"] .mrd-eyebrow::after { display: none; }
[data-variant="marketing"] .mrd-section-title { font-weight: 500; font-size: 56px; letter-spacing: -0.03em; }
[data-variant="marketing"] .mrd-section-lede { font-size: 21px; color: var(--bone-2); max-width: 62ch; }
[data-variant="marketing"] .mrd-feature { padding: 36px 36px 56px; }
[data-variant="marketing"] .mrd-feature__link { font-family: var(--font-body); font-size: 13px; letter-spacing: 0; left: 36px; bottom: 28px; }
`;
