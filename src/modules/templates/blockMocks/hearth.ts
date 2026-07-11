// src/modules/templates/blockMocks/hearth.ts
// Canonical Hearth block mocks (template-factory phase 2). NEW this phase — hearth
// had no dev gallery / parity fixtures before. Content is hand-authored for the 7
// manifest-declared Hearth blocks (WarmNavHeader / PetalFramedHero /
// IconServiceCards / PullQuoteWithMark / TieredPackages / BookCallCTA /
// ContactFooterRich); it feeds the `templateConformance` editor-basics subset now
// and the phase-7 screenshot parity harness later.
//
// Each entry's `editBasics` is authored against the block's ACTUAL preview render
// path (verified against source): scalar keys that render as HearthEditable text,
// CTA keys that render as HearthEditable buttons (`isButton`), and collections
// whose per-item text/button fields carry a stable `<field>_<id>` marker key.
// Optional fields are all populated here so they render in preview (nothing is
// mock-excluded).

import type { EditBasicsExpectation } from './index';

export interface HearthMockEntry {
  sectionType: string;
  layout: string;
  content: Record<string, any>;
  editBasics: EditBasicsExpectation;
}

export const HEARTH_BLOCK_MOCKS: HearthMockEntry[] = [
  {
    sectionType: 'header',
    layout: 'WarmNavHeader',
    content: {
      logo_text: 'atelier hearth',
      cta_text: 'Book a call',
      logo_image: '',
      nav_items: [
        { id: 'h1', label: 'Work', href: '#work' },
        { id: 'h2', label: 'Services', href: '#services' },
        { id: 'h3', label: 'About', href: '#about' },
        { id: 'h4', label: 'Contact', href: '#contact' },
      ],
    },
    editBasics: {
      text: ['logo_text'],
      button: ['cta_text'],
      collections: [
        { key: 'nav_items', countPrefix: 'nav_items_label_', itemPrefixes: ['nav_items_label_'], items: 4 },
      ],
    },
  },
  {
    sectionType: 'hero',
    layout: 'PetalFramedHero',
    content: {
      eyebrow: 'Interior design studio',
      headline: 'Rooms that feel like <em>you</em>, only calmer.',
      lede: 'We design warm, liveable interiors for people who host — one long project, then a home you never want to leave.',
      cta_text: 'Book a call',
      cta_subtext: 'Free consult · no obligation',
      secondary_cta_text: 'See our work',
      meta: 'Booking Q3 2026',
      hero_image: '',
    },
    editBasics: {
      text: ['eyebrow', 'headline', 'lede', 'cta_subtext', 'meta'],
      button: ['cta_text', 'secondary_cta_text'],
      collections: [],
    },
  },
  {
    sectionType: 'services',
    layout: 'IconServiceCards',
    content: {
      eyebrow: 'Our approach',
      headline: 'What we do',
      lede: 'Three ways we take a room from bare to belonging.',
      services: [
        { id: 'sv1', icon: 'Sparkles', title: 'Full-home design', description: 'Concept to install, room by room, on one coherent thread.', cta_text: 'Learn more →' },
        { id: 'sv2', icon: 'Palette', title: 'Colour & material', description: 'A palette that holds together in every light, all year.', cta_text: 'Learn more →' },
        { id: 'sv3', icon: 'Ruler', title: 'Space planning', description: 'Flow, storage, and the small dimensions that make a room work.', cta_text: 'Learn more →' },
      ],
    },
    editBasics: {
      text: ['eyebrow', 'headline', 'lede'],
      button: [],
      collections: [
        { key: 'services', countPrefix: 'services_title_', itemPrefixes: ['services_title_', 'services_description_', 'services_cta_'], items: 3 },
      ],
    },
  },
  {
    sectionType: 'testimonials',
    layout: 'PullQuoteWithMark',
    content: {
      eyebrow: 'Kind words',
      quote: 'They read how we actually live and gave us back a home that finally fits. Every guest asks who did it.',
      author_name: 'Meera Kapoor',
      author_role: 'Homeowner',
      author_company: 'Bandra West',
      author_photo: '',
      meta: 'Full-home project · 2025',
    },
    editBasics: {
      text: ['eyebrow', 'quote', 'author_name', 'author_role', 'author_company', 'meta'],
      button: [],
      collections: [],
    },
  },
  {
    sectionType: 'packages',
    layout: 'TieredPackages',
    content: {
      eyebrow: 'Engagements',
      headline: 'Ways to work together',
      lede: 'Transparent scopes — pick the depth that fits your home.',
      packages: [
        {
          id: 'pk1', name: 'Consult', price_display: '$1,200', timeline: '1–2 weeks',
          features: ['One 3-hour walkthrough', 'Palette + layout direction', 'Shopping list'],
          cta_text: 'Book a call', is_featured: false,
        },
        {
          id: 'pk2', name: 'Single room', price_display: '$6,500', timeline: '4–6 weeks',
          features: ['Full concept + drawings', 'Sourcing + procurement', 'Install day on site'],
          cta_text: 'Book a call', is_featured: true,
        },
        {
          id: 'pk3', name: 'Full home', price_display: 'From $28k', timeline: '3–6 months',
          features: ['Every room, one thread', 'Contractor coordination', 'Styling + handover'],
          cta_text: 'Book a call', is_featured: false,
        },
      ],
    },
    editBasics: {
      text: ['eyebrow', 'headline', 'lede'],
      button: [],
      collections: [
        { key: 'packages', countPrefix: 'packages_name_', itemPrefixes: ['packages_name_', 'packages_price_', 'packages_timeline_', 'packages_feature_', 'packages_cta_'], items: 3 },
      ],
    },
  },
  {
    sectionType: 'cta',
    layout: 'BookCallCTA',
    content: {
      eyebrow: "Let's begin",
      headline: "Let's talk about your home.",
      lede: 'Tell us how you live and what is not working. We answer within a day.',
      cta_text: 'Book a call',
      secondary_cta_text: 'See our work',
      meta: 'We answer within a day.',
    },
    editBasics: {
      text: ['eyebrow', 'headline', 'lede', 'meta'],
      button: ['cta_text', 'secondary_cta_text'],
      collections: [],
    },
  },
  {
    sectionType: 'footer',
    layout: 'ContactFooterRich',
    content: {
      tagline: 'Warm, liveable interiors for people who host.',
      contact_email: 'hello@atelierhearth.com',
      contact_phone: '(415) 555-0142',
      address: 'Brooklyn, NY',
      copyright: '© 2026 Atelier Hearth',
      social_links: [
        { id: 'so1', platform: 'Instagram', href: '#' },
        { id: 'so2', platform: 'Pinterest', href: '#' },
        { id: 'so3', platform: 'Houzz', href: '#' },
      ],
    },
    editBasics: {
      text: ['tagline', 'contact_email', 'contact_phone', 'address', 'copyright'],
      button: [],
      collections: [
        { key: 'social_links', countPrefix: 'social_platform_', itemPrefixes: ['social_platform_'], items: 3 },
      ],
    },
  },
];
