// Tests for autoMapLinkHrefs — nav/footer link derivation (F7 + F24).
// Common law: nav must derive from what the page/site actually HAS, never from
// AI authorship or template defaults.
//   • F7  single-page nav: dead section anchors (to sections not on the page) are
//     dropped; only anchors the page actually has survive.
//   • F24 multipage footer: the site-nav column is synced to the full sitemap, so
//     a page added at the gate (that the AI never authored a footer link for)
//     appears alongside the header.

import { describe, it, expect } from 'vitest';
import { autoMapLinkHrefs, type SitePageLink } from './parseCopy';
import type { SectionCopy } from '@/types/generation';

const sec = (elements: Record<string, unknown>): SectionCopy => ({ elements } as any);

describe('autoMapLinkHrefs — F7 single-page dead anchors', () => {
  it('drops nav anchors to sections that do not exist on the page', () => {
    // Page has only header, hero, leadform, features, cta, testimonials, footer.
    const present = new Set(['header', 'hero', 'leadform', 'features', 'cta', 'testimonials', 'footer']);
    const sections: Record<string, SectionCopy> = {
      header: sec({
        nav_items: [
          { id: 'n1', label: 'Features', href: '#features' }, // exists → keep
          { id: 'n2', label: 'Pricing', href: '#pricing' }, // dead → drop
          { id: 'n3', label: 'About', href: '#about' }, // dead → drop
          { id: 'n4', label: 'Support', href: '#support' }, // dead → drop
        ],
      }),
    };

    autoMapLinkHrefs(sections, present);

    const nav = (sections.header.elements as any).nav_items as any[];
    expect(nav.map((n) => n.href)).toEqual(['#features']);
    expect(nav.map((n) => n.label)).toEqual(['Features']);
  });

  it('keeps real live targets untouched and maps unset links by label', () => {
    const present = new Set(['header', 'hero', 'features', 'pricing', 'footer']);
    const sections: Record<string, SectionCopy> = {
      header: sec({
        nav_items: [
          { id: 'n1', label: 'Docs', href: 'https://docs.example.com' }, // external → keep verbatim
          { id: 'n2', label: 'Get started', href: '#form-section' }, // special anchor → keep
          { id: 'n3', label: 'Pricing', href: '#' }, // unset → derive to existing #pricing
          { id: 'n4', label: 'Deals', href: '#' }, // unset, no match → left as '#'
        ],
      }),
    };

    autoMapLinkHrefs(sections, present);

    const nav = (sections.header.elements as any).nav_items as any[];
    expect(nav.map((n) => n.href)).toEqual([
      'https://docs.example.com',
      '#form-section',
      '#pricing',
      '#',
    ]);
  });
});

describe('autoMapLinkHrefs — F24 multipage footer site-nav sync', () => {
  const sitePages: SitePageLink[] = [
    { title: 'Home', pathSlug: '/' },
    { title: 'About Us', pathSlug: '/about' },
    { title: 'Product Catalogue', pathSlug: '/products' },
    { title: 'Industries', pathSlug: '/industries' }, // added at the gate
    { title: 'Contact Us', pathSlug: '/contact' },
  ];

  it('appends gate-added pages to the footer quick-links column', () => {
    const present = new Set(['header', 'hero', 'footer']);
    const sections: Record<string, SectionCopy> = {
      footer: sec({
        link_columns: [
          {
            id: 'c1',
            heading: 'Quick Links',
            links: [
              // AI authored a partial site nav — labels match sitemap page titles,
              // so mapLink resolves them to page paths. Industries is MISSING.
              { id: 'l1', label: 'Home', href: '/' },
              { id: 'l2', label: 'About Us', href: '#' },
              { id: 'l3', label: 'Product Catalogue', href: '#' },
              { id: 'l4', label: 'Contact Us', href: '#' },
            ],
          },
          {
            id: 'c2',
            heading: 'Legal',
            links: [{ id: 'l5', label: 'Privacy Policy', href: '/privacy' }],
          },
        ],
      }),
    };

    autoMapLinkHrefs(sections, present, sitePages);

    const cols = (sections.footer.elements as any).link_columns as any[];
    const navCol = cols[0].links.map((l: any) => l.href);
    // Every non-home sitemap page is now present, including /industries.
    expect(navCol).toContain('/about');
    expect(navCol).toContain('/products');
    expect(navCol).toContain('/industries');
    expect(navCol).toContain('/contact');

    // The Legal column (no page-path site nav) is left untouched.
    const legalCol = cols[1].links.map((l: any) => l.href);
    expect(legalCol).toEqual(['/privacy']);
  });

  it('is idempotent — a second pass adds no duplicates', () => {
    const present = new Set(['header', 'hero', 'footer']);
    const sections: Record<string, SectionCopy> = {
      footer: sec({
        link_columns: [
          {
            id: 'c1',
            heading: 'Quick Links',
            links: [{ id: 'l1', label: 'About Us', href: '/about' }],
          },
        ],
      }),
    };

    autoMapLinkHrefs(sections, present, sitePages);
    const afterFirst = (sections.footer.elements as any).link_columns[0].links.length;
    autoMapLinkHrefs(sections, present, sitePages);
    const afterSecond = (sections.footer.elements as any).link_columns[0].links.length;

    expect(afterSecond).toBe(afterFirst);
  });

  it('does not invent a site-nav column when none exists', () => {
    // A footer whose only column is decorative (no page-path links) is left alone.
    const present = new Set(['header', 'hero', 'footer']);
    const sections: Record<string, SectionCopy> = {
      footer: sec({
        footer_columns: [
          {
            id: 'c1',
            heading: 'Product',
            links: [{ id: 'l1', label: 'Feature A', href: '#' }],
          },
        ],
      }),
    };

    autoMapLinkHrefs(sections, present, sitePages);

    const links = (sections.footer.elements as any).footer_columns[0].links;
    expect(links).toHaveLength(1);
    expect(links[0].href).toBe('#');
  });
});
