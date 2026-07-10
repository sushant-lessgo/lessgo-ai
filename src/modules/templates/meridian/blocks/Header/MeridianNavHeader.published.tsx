// src/modules/templates/meridian/blocks/Header/MeridianNavHeader.published.tsx
// Server-safe published variant of MeridianNavHeader. No hooks, no edit affordances.

import React from 'react';
import { resolveCtaHref, resolveDestination } from '@/utils/resolveCtaHref';
import type { Link } from '@/types/destination';
import { isLink } from '@/types/destination';

interface NavItem {
  id?: string;
  label?: string;
  href?: string | Link;
}

// Dual-read a nav link's target: legacy raw string href passes through verbatim
// (old pages byte-identical); a new Link object resolves via the dumb resolver.
function resolveLinkHref(value: string | Link | undefined): string {
  if (typeof value === 'string') return value || '#';
  if (isLink(value)) return resolveDestination(value.dest) || '#';
  return '#';
}

interface MeridianNavHeaderPublishedProps {
  sectionId: string;
  logo_text?: string;
  cta_text?: string;
  signin_text?: string;
  logo_image?: string;
  nav_items?: NavItem[];
  content?: any;
}

export default function MeridianNavHeaderPublished(props: MeridianNavHeaderPublishedProps) {
  const logoText = props.logo_text || 'meridian';
  const ctaText = props.cta_text || 'Start free';
  const signinText = props.signin_text || 'Sign in';
  const navItems = Array.isArray(props.nav_items) ? props.nav_items : [];

  const md = props.content?.[props.sectionId]?.elementMetadata;
  const forms = props.content?.forms;
  const ctaHref = resolveCtaHref(md?.cta_text?.buttonConfig, forms, '#cta');
  const signinHref = resolveCtaHref(md?.signin_text?.buttonConfig, forms, '#signin');
  // Sign in is wayfinding (existing-user login) by default — no beacon attrs, so it
  // never pollutes the CTA click breakdown (F7). An EXPLICITLY configured CTA on this
  // element (cta/buttonConfig metadata) is a user decision and keeps beacon attrs (D15).
  const signinRole: string | undefined =
    md?.signin_text?.cta?.role ?? md?.signin_text?.buttonConfig?.ctaType;
  const signinCtaAttrs = signinRole
    ? { 'data-lessgo-cta': '', 'data-lessgo-cta-role': signinRole }
    : {};

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <nav className="mrd-nav">
        <div className="mrd-nav__left">
          <div className="mrd-brand">
            {props.logo_image ? (
              <img className="mrd-brand-img" src={props.logo_image} alt="" />
            ) : (
              <div className="mrd-brand-mark" aria-hidden="true" />
            )}
            <span>{logoText}</span>
          </div>
          {navItems.length > 0 && (
            <div className="mrd-nav-links">
              {navItems.map((item, idx) => (
                <a key={item.id || idx} className="mrd-nav-link" href={resolveLinkHref(item.href)}>
                  {item.label || ''}
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="mrd-nav-right">
          <a className="mrd-btn mrd-btn--quiet mrd-btn--sm" href={signinHref} {...signinCtaAttrs}>{signinText}</a>
          <a className="mrd-btn mrd-btn--primary mrd-btn--sm mrd-btn--arrow" href={ctaHref} data-lessgo-cta="" data-lessgo-cta-role="primary">{ctaText}</a>
        </div>
      </nav>
    </>
  );
}

const STYLES = `
.mrd-nav {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px var(--sec-pad-x);
  border-bottom: 1px solid var(--line);
  background: color-mix(in oklch, var(--ink) 80%, transparent);
  backdrop-filter: blur(8px);
  font-family: var(--font-body);
}
.mrd-nav__left { display: flex; align-items: center; gap: 28px; }
.mrd-brand {
  display: flex; align-items: center; gap: 10px;
  font-family: var(--font-display); font-weight: 600; font-size: 15px;
  letter-spacing: -0.01em; color: var(--bone);
}
.mrd-brand-mark {
  width: 22px; height: 22px; border: 1px solid var(--bone);
  border-radius: 5px; position: relative; flex-shrink: 0;
}
.mrd-brand-mark::after {
  content: ""; position: absolute; inset: 4px;
  background: var(--accent); border-radius: 2px;
}
.mrd-brand-img { width: 22px; height: 22px; border-radius: 5px; object-fit: cover; }
.mrd-nav-links { display: flex; align-items: center; gap: 28px; font-size: 13.5px; }
.mrd-nav-link { color: var(--bone-2); text-decoration: none; }
.mrd-nav-link:hover { color: var(--bone); }
.mrd-nav-right { display: flex; align-items: center; gap: 10px; }
.mrd-btn {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: var(--font-display); font-weight: 500; font-size: 13.5px;
  letter-spacing: -0.005em; border-radius: var(--r-md); padding: 10px 14px;
  transition: all 140ms ease; border: 1px solid transparent; text-decoration: none;
}
.mrd-btn--sm { padding: 7px 11px; font-size: 12.5px; }
.mrd-btn--primary { background: var(--accent); color: var(--accent-ink); }
.mrd-btn--primary:hover { filter: brightness(1.06); }
.mrd-btn--quiet { color: var(--bone-2); }
.mrd-btn--quiet:hover { color: var(--bone); }
.mrd-btn--arrow::after { content: "→"; font-family: var(--font-mono); font-size: 13px; }
[data-variant="marketing"] .mrd-btn { border-radius: 12px; font-family: var(--font-body); font-weight: 500; }
[data-variant="marketing"] .mrd-btn--arrow::after { font-family: var(--font-body); }
`;
