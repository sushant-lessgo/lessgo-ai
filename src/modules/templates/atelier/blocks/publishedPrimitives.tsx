// src/modules/templates/atelier/blocks/publishedPrimitives.tsx
// SHARED published-mode primitives for every Atelier block core. Plain module (NO
// 'use client', no hooks) — server-safe, emits static tags. Counterpart to
// editPrimitives; injected into a core by the block's .published.tsx wrapper.
// All outbound links get target=_blank rel=noopener via externalLinkProps.

import React from 'react';
import { externalLinkProps } from '@/utils/resolveCtaHref';
import { resolveAlt } from '@/modules/editing/altText';
import type {
  AtelierPrimitives, AtelierTxtProps, AtelierImgProps, AtelierLinkProps, AtelierListProps,
} from './primitives';

const isHtml = (s?: string) => !!s && /<[^>]*>/.test(s);

function parsePath(key: string): { coll: string; id: string; field: string } | null {
  const i = key.indexOf('.');
  if (i < 0) return null;
  const j = key.indexOf('.', i + 1);
  if (j < 0) return null;
  return { coll: key.slice(0, i), id: key.slice(i + 1, j), field: key.slice(j + 1) };
}

export interface PublishedPrimitiveOptions {
  elementMetadata?: Record<string, { alt?: string | Record<string, string> }>;
}

export function makePublishedPrimitives(opts: PublishedPrimitiveOptions = {}): AtelierPrimitives {
  const { elementMetadata } = opts;
  const Txt: React.FC<AtelierTxtProps> = ({ value, as = 'span', className, style, placeholder }) => {
    const Tag = as as any;
    const shown = value || placeholder || '';
    if (!shown) return null;
    return isHtml(shown)
      ? <Tag className={className} style={style} dangerouslySetInnerHTML={{ __html: shown }} />
      : <Tag className={className} style={style}>{shown}</Tag>;
  };

  const Img: React.FC<AtelierImgProps> = ({ elementKey, src, alt, className, imgClassName, placeholder, eager }) => {
    const path = parsePath(elementKey);
    const metaAlt = path ? elementMetadata?.[path.coll]?.alt : elementMetadata?.[elementKey]?.alt;
    const resolvedAlt = resolveAlt(metaAlt, path?.id, alt);
    return (
      <div className={className}>
        {src ? <img src={src} alt={resolvedAlt} className={imgClassName} loading={eager ? 'eager' : 'lazy'} decoding="async" /> : placeholder}
      </div>
    );
  };

  const Link: React.FC<AtelierLinkProps> = ({ hrefKey, href, className, ariaLabel, children }) => {
    const target = href || '#';
    // Analytics stamping (scale-04): CTA anchors carry data-lessgo-cta + role.
    // Nav LINK items (hrefKey `nav_items.*`) are NOT stamped.
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

  const List: React.FC<AtelierListProps> = ({ items, render, className, itemClassName }) => (
    <div className={className}>
      {items.map((item, i) => (
        <div key={item.id ?? i} className={itemClassName}>{render(item, i)}</div>
      ))}
    </div>
  );

  return { Txt, Img, Link, List };
}
