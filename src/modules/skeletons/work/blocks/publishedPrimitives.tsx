// src/modules/skeletons/work/blocks/publishedPrimitives.tsx
// SHARED published-mode primitives for every work-skeleton block core. Plain
// module (NO 'use client', no hooks) — server-safe, emits static tags.
// Counterpart to editPrimitives; injected into a core by the block's
// .published.tsx wrapper. All outbound links get target=_blank rel=noopener via
// externalLinkProps. granth `publishedPrimitives` clone + static `Logo` / `Nav`.

import React from 'react';
import { externalLinkProps } from '@/utils/resolveCtaHref';
import type {
  WorkPrimitives, WorkTxtProps, WorkImgProps, WorkLinkProps, WorkListProps,
  WorkLogoProps, WorkNavProps, WorkToggleProps,
} from './primitives';

const isHtml = (s?: string) => !!s && /<[^>]*>/.test(s);

export function makePublishedPrimitives(): WorkPrimitives {
  const Txt: React.FC<WorkTxtProps> = ({ value, as = 'span', className, style, placeholder }) => {
    const Tag = as as any;
    const shown = value || placeholder || '';
    if (!shown) return null;
    return isHtml(shown)
      ? <Tag className={className} style={style} dangerouslySetInnerHTML={{ __html: shown }} />
      : <Tag className={className} style={style}>{shown}</Tag>;
  };

  const Img: React.FC<WorkImgProps> = ({ src, alt, className, imgClassName, placeholder, eager }) => (
    <div className={className}>
      {src ? <img src={src} alt={alt || ''} className={imgClassName} loading={eager ? 'eager' : 'lazy'} decoding="async" /> : placeholder}
    </div>
  );

  const Link: React.FC<WorkLinkProps> = ({ hrefKey, href, className, ariaLabel, children }) => {
    const target = href || '#';
    // Analytics stamping: CTA anchors carry data-lessgo-cta + role so the beacon
    // fires cta_click. Nav/social LINK items are NOT stamped. Role derived from the
    // element key: `secondary_cta*` = secondary, other `*cta*` = primary.
    const isCta = /cta/i.test(hrefKey);
    const ctaAttrs = isCta
      ? { 'data-lessgo-cta': '', 'data-lessgo-cta-role': /secondary_cta/i.test(hrefKey) ? 'secondary' : 'primary' }
      : {};
    return (
      <a href={target} className={className} aria-label={ariaLabel} {...externalLinkProps(target)} {...ctaAttrs}>
        {children}
      </a>
    );
  };

  const List: React.FC<WorkListProps> = ({ items, render, className, itemClassName }) => (
    <div className={className}>
      {items.map((item, i) => (
        <div key={item.id ?? i} className={itemClassName}>{render(item, i)}</div>
      ))}
    </div>
  );

  const Logo: React.FC<WorkLogoProps> = ({ src, text, href, className, imgClassName, textClassName, alt }) => {
    const home = href || '/';
    return (
      <a href={home} className={className} data-wk-logo="">
        {src
          ? <img src={src} alt={alt || text || ''} className={imgClassName} loading="eager" decoding="async" />
          : <span className={textClassName}>{text || ''}</span>}
      </a>
    );
  };

  const Nav: React.FC<WorkNavProps> = ({ items, labelField = 'label', hrefField = 'href', className, itemClassName, linkClassName }) => (
    <nav className={className}>
      {items.map((item, i) => {
        const target = item?.[hrefField] || '#';
        return (
          <span key={item?.id ?? i} className={itemClassName}>
            <a href={target} className={linkClassName} {...externalLinkProps(target)}>
              {item?.[labelField] || ''}
            </a>
          </span>
        );
      })}
    </nav>
  );

  // Toggle: the visible chip is rendered by the block core from the flag value;
  // published renders only `children` (the annotated node) and NO edit control —
  // zero extra DOM vs the edit render's in-flow output (the edit-only flip button
  // is absolute/zero-layout).
  const Toggle: React.FC<WorkToggleProps> = ({ children }) => <>{children ?? null}</>;

  return { Txt, Img, Link, List, Logo, Nav, Toggle };
}
