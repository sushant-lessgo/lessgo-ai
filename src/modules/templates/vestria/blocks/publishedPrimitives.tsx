// src/modules/templates/vestria/blocks/publishedPrimitives.tsx
// SHARED published-mode primitives for every Vestria block core. Plain module (NO
// 'use client', no hooks) — server-safe, emits static tags. Counterpart to
// editPrimitives; injected into a core by the block's .published.tsx wrapper.
// All outbound links get target=_blank rel=noopener via externalLinkProps.

import React from 'react';
import { externalLinkProps } from '@/utils/resolveCtaHref';
import type {
  VestriaPrimitives, VestriaTxtProps, VestriaImgProps, VestriaLinkProps, VestriaListProps,
} from './primitives';

const isHtml = (s?: string) => !!s && /<[^>]*>/.test(s);

export function makePublishedPrimitives(): VestriaPrimitives {
  const Txt: React.FC<VestriaTxtProps> = ({ value, as = 'span', className, style, placeholder }) => {
    const Tag = as as any;
    const shown = value || placeholder || '';
    if (!shown) return null;
    return isHtml(shown)
      ? <Tag className={className} style={style} dangerouslySetInnerHTML={{ __html: shown }} />
      : <Tag className={className} style={style}>{shown}</Tag>;
  };

  const Img: React.FC<VestriaImgProps> = ({ src, alt, className, imgClassName, placeholder, eager }) => (
    <div className={className}>
      {src ? <img src={src} alt={alt || ''} className={imgClassName} loading={eager ? 'eager' : 'lazy'} decoding="async" /> : placeholder}
    </div>
  );

  const Link: React.FC<VestriaLinkProps> = ({ hrefKey, href, className, ariaLabel, children }) => {
    const target = href || '#';
    // Analytics stamping (scale-04): CTA anchors carry data-lessgo-cta + role so the
    // beacon fires cta_click. Nav LINK items (hrefKey `nav_items.*`) are NOT stamped.
    // Role derived from the element key: `secondary_cta*` = secondary, other `*cta*` = primary.
    const isCta = /cta/i.test(hrefKey) && !/^nav_items/.test(hrefKey);
    const ctaAttrs = isCta
      ? { 'data-lessgo-cta': '', 'data-lessgo-cta-role': /secondary_cta/i.test(hrefKey) ? 'secondary' : 'primary' }
      : {};
    return (
      <a href={target} className={className} aria-label={ariaLabel} {...externalLinkProps(target)} {...ctaAttrs}>
        {children}
      </a>
    );
  };

  const List: React.FC<VestriaListProps> = ({ items, render, className, itemClassName }) => (
    <div className={className}>
      {items.map((item, i) => (
        <div key={item.id ?? i} className={itemClassName}>{render(item, i)}</div>
      ))}
    </div>
  );

  return { Txt, Img, Link, List };
}
