// src/modules/templates/techpremium/blocks/Compatibility/TechPremiumCompatibility.published.tsx
// Server-safe published variant of TechPremiumCompatibility. The readout reuses the
// shared TechPremiumReadout (server-safe) and renders only when metrics are present.

import React from 'react';
import { STYLES } from './styles';
import { TechPremiumReadout, type ReadoutMetric } from '../Readout/TechPremiumReadout';

interface Chip { id?: string; text?: string }
interface Metric { id?: string; key?: string; value?: string; unit?: string; live?: string }
interface Props {
  sectionId: string;
  eyebrow?: string;
  headline?: string;
  lede?: string;
  readout_status?: string;
  readout_tone?: string;
  readout_stage?: string;
  readout_caption?: string;
  chips?: Chip[];
  readout_metrics?: Metric[];
}

export default function TechPremiumCompatibilityPublished(props: Props) {
  const chips = Array.isArray(props.chips) ? props.chips : [];
  const metrics = Array.isArray(props.readout_metrics) ? props.readout_metrics : [];

  const readoutData = metrics.length > 0 ? {
    statusLabel: props.readout_status,
    statusTone: props.readout_tone,
    stage: props.readout_stage,
    caption: props.readout_caption,
    metrics: metrics.map((m): ReadoutMetric => ({ key: m.key || '', value: m.value || '', unit: m.unit, live: m.live })),
  } : null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="tp-sec">
        <div className="tp-sec__inner">
          <div className="tp-compat-in">
            <div className="tp-compat-copy">
              {props.eyebrow && <span className="tp-eyebrow">{props.eyebrow}</span>}
              {props.headline && <h2 dangerouslySetInnerHTML={{ __html: props.headline }} />}
              {props.lede && <p className="tp-lede" dangerouslySetInnerHTML={{ __html: props.lede }} />}
              {chips.length > 0 && (
                <div className="tp-compat-chips">
                  {chips.map((c, idx) => (
                    <span key={c.id || idx} className="tp-compat-chip">
                      <span className="tp-d" />
                      <span>{c.text}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
            {readoutData && (
              <div className="tp-compat-readout">
                <TechPremiumReadout data={readoutData} />
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
