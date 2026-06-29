// Server-safe published variant of the Surge packages block.

import React from 'react';
import { resolveCtaHref, externalLinkProps } from '@/utils/resolveCtaHref';
import { PKG_STYLES } from './styles';

interface PackageTier {
  id?: string;
  name?: string;
  price_display?: string;
  timeline?: string;
  features?: string[];
  cta_text?: string;
  is_featured?: boolean;
}

interface TieredPackagesPublishedProps {
  sectionId: string;
  eyebrow?: string;
  headline?: string;
  lede?: string;
  packages?: PackageTier[];
  content?: any;
}

export default function TieredPackagesPublished(props: TieredPackagesPublishedProps) {
  const packages = Array.isArray(props.packages) ? props.packages : [];
  const md = props.content?.[props.sectionId]?.elementMetadata;
  const forms = props.content?.forms;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PKG_STYLES }} />
      <section className="sg-pkg">
        <div className="sg-pkg__head">
          {props.eyebrow && <div className="sg-sec-eyebrow">{props.eyebrow}</div>}
          {props.headline && (
            <h2 className="sg-sec-title" dangerouslySetInnerHTML={{ __html: props.headline }} />
          )}
          {props.lede && (
            <p className="sg-sec-dek" dangerouslySetInnerHTML={{ __html: props.lede }} />
          )}
        </div>
        <div className="sg-pkg__grid">
          {packages.map((p, idx) => {
            const featuresList = Array.isArray(p.features) ? p.features : [];
            return (
              <article key={p.id || idx} className={`sg-pkg__card${p.is_featured ? ' is-featured' : ''}`}>
                {p.name && <div className="sg-pkg__name">{p.name}</div>}
                {p.price_display && <div className="sg-pkg__amount">{p.price_display}</div>}
                {p.timeline && <div className="sg-pkg__per">{p.timeline}</div>}
                {featuresList.length > 0 && (
                  <ul className="sg-pkg__features">
                    {featuresList.map((feat, i) => (
                      <li key={i}>{feat}</li>
                    ))}
                  </ul>
                )}
                {p.cta_text && (() => {
                  const pkgHref = resolveCtaHref(md?.[`packages_cta_${p.id}`]?.buttonConfig, forms, '#contact');
                  return (
                    <a
                      href={pkgHref}
                      {...externalLinkProps(pkgHref)}
                      className={`sg-btn ${p.is_featured ? 'sg-btn--primary' : 'sg-btn--soft'} sg-pkg__cta`}
                    >
                      {p.cta_text}
                    </a>
                  );
                })()}
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
