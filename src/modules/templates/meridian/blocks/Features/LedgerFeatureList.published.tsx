// src/modules/templates/meridian/blocks/Features/LedgerFeatureList.published.tsx
// Server-safe published variant of LedgerFeatureList (scale-09 phase 6). Same flat
// props / markup / CSS as the edit renderer (shared LEDGER_FEATURE_LIST_STYLES).

import React from 'react';
import * as Icons from 'lucide-react';
import { LEDGER_FEATURE_LIST_STYLES } from './LedgerFeatureList.styles';

interface Feature {
  id?: string;
  title?: string;
  description?: string;
  icon?: string;
  link_text?: string;
}

interface LedgerFeatureListPublishedProps {
  sectionId: string;
  eyebrow?: string;
  headline?: string;
  lede?: string;
  features?: Feature[];
}

function FeatureIcon({ name }: { name: string }) {
  const Component = (Icons as any)[name] || Icons.Layers;
  return <Component size={18} strokeWidth={1.25} />;
}

export default function LedgerFeatureListPublished(props: LedgerFeatureListPublishedProps) {
  const features = Array.isArray(props.features) ? props.features : [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: LEDGER_FEATURE_LIST_STYLES }} />
      <section className="mrd-ledger-sec">
        {props.eyebrow && <div className="mrd-ledger__eyebrow"><span>{props.eyebrow}</span></div>}
        {props.headline && (
          <h2 className="mrd-ledger__title" dangerouslySetInnerHTML={{ __html: props.headline }} />
        )}
        {props.lede && (
          <p className="mrd-ledger__lede" dangerouslySetInnerHTML={{ __html: props.lede }} />
        )}
        {features.length > 0 && (
          <div className="mrd-ledger">
            {features.map((f, idx) => (
              <article key={f.id || idx} className="mrd-ledger__row">
                <div className="mrd-ledger__n">F-{String(idx + 1).padStart(2, '0')}</div>
                <div className="mrd-ledger__glyph"><FeatureIcon name={f.icon || 'Layers'} /></div>
                {/* Grid-child cells rendered UNCONDITIONALLY so the fixed 5-col
                    grid stays structurally stable regardless of empty fields —
                    matches the edit renderer (which always renders these) and
                    prevents auto-placement column shift. Link is a hrefless span
                    (parity with the edit side's non-navigating span). */}
                <h3 className="mrd-ledger__row-title">{f.title || ''}</h3>
                <p className="mrd-ledger__desc">{f.description || ''}</p>
                <span className="mrd-ledger__link">{f.link_text || ''}</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
