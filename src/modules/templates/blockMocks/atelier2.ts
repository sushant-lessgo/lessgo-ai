// src/modules/templates/blockMocks/atelier2.ts
// Work-skeleton (Atelier skin, dev id `atelier2`) block mocks — TEST/DEV-ONLY.
// Feeds the /dev/blocks/atelier2 gallery (edit + published bands) and seeds the
// shared harness store (ALL_BLOCK_MOCK_SECTIONS). NOT imported by the app bundle
// or any `.published.*` renderer.
//
// Phase 4: the FULL pilot Home slice — header · hero · work/gallery · proof ·
// contact · footer. Content is Kundius-derived (fixtures/kundiusBrief.ts groups +
// golden hero copy), mapped onto the FROZEN work-core contracts. Photography is
// image-led, so image slots ship EMPTY (the cores render their placeholders) —
// the eyeball compares layout/copy parity, not stock art.
//
// Phase 6: EVERY built layout variant is enrolled as its OWN stage section (the
// stage supports repeated sectionTypes) → the sampled parity grid = layouts × both
// renderers. Header arrangements share ONE component (internal dispatch); the
// arrangement is carried in `content.layout` so the PUBLISHED band (which the stage
// feeds flat props, no content map) reads it via the `layout` prop fallback, exactly
// as the editor band reads it from the seeded store — so both bands re-flow to the
// same arrangement. The alternate proof SHAPES carry their OWN collection (logos /
// metrics) since they read a different collection than testimonials.
//
// NOTE: atelier2 is NOT enrolled in `assertEditorBasics` (conformance.test.ts), so
// `editBasics` here is informational (authored plausibly, not asserted this phase).

import type { TemplateId } from '@/types/service';
import type { BlockMockSection } from './index';

const ATELIER2_BLOCK_MOCKS: Omit<BlockMockSection, 'templateId'>[] = [
  {
    sectionType: 'header',
    layout: 'WorkHeader',
    sectionId: 'atelier2-header',
    content: {
      logo_text: 'Kristina Kundius',
      cta_label: 'Start Your Project',
      cta_href: '#contact',
      nav_links: [
        { id: 'wn1', label: 'Work', href: '#work' },
        { id: 'wn2', label: 'About', href: '#about' },
        { id: 'wn3', label: 'Contact', href: '#contact' },
      ],
    },
    editBasics: {
      text: ['logo_text'],
      button: ['cta_label'],
      collections: [
        { key: 'nav_links', countPrefix: 'nav_links.', itemPrefixes: ['nav_links.'], items: 3 },
      ],
    },
  },
  {
    sectionType: 'hero',
    layout: 'WorkHeroSlider',
    sectionId: 'atelier2-hero',
    content: {
      role_line: 'Professional Photographer',
      name: 'Kristina <em>Kundius</em>',
      quote: 'A body of work that does the persuading for you — browse it, then let’s make yours.',
      portrait_image: '',
      cta_label: 'Start Your Project',
      cta_href: '#contact',
      socials: [
        { id: 'as1', network: 'instagram', label: 'Instagram', href: '#' },
        { id: 'as2', network: 'linkedin', label: 'LinkedIn', href: '#' },
      ],
    },
    editBasics: {
      text: ['role_line', 'name', 'quote'],
      button: ['cta_label'],
      collections: [
        { key: 'socials', countPrefix: 'socials.', itemPrefixes: ['socials.'], items: 2 },
      ],
    },
  },
  {
    sectionType: 'work',
    layout: 'WorkGalleryGrid',
    sectionId: 'atelier2-work',
    content: {
      eyebrow: 'Selected work',
      heading: 'The work',
      lead: 'Portfolio headshots and brand photography for companies that want to be remembered.',
      // Group REFERENCES (category covers) — NOT a flat photo list (AC L120).
      // Mapped from kundiusWorkFacts.groups (the four priced services).
      groups: [
        { id: 'wg1', name: 'Full brand package', cover_image: '', href: '#work' },
        { id: 'wg2', name: 'Brand photoshoot', cover_image: '', href: '#work' },
        { id: 'wg3', name: 'Portrait & business shoot', cover_image: '', href: '#work' },
        { id: 'wg4', name: 'Event photography (per hour)', cover_image: '', href: '#work' },
      ],
    },
    editBasics: {
      text: ['eyebrow', 'heading', 'lead'],
      button: [],
      collections: [
        { key: 'groups', countPrefix: 'groups.', itemPrefixes: ['groups.'], items: 8 },
      ],
    },
  },
  {
    sectionType: 'proof',
    layout: 'WorkProofTestimonials',
    sectionId: 'atelier2-proof',
    content: {
      eyebrow: 'Kind words',
      heading: 'What clients say',
      awards_line: '',
      quotes: [
        { id: 'wq1', text: 'Kristina made our whole team look like the brand we want to be.', source: 'Head of Brand · Enterprise client' },
        { id: 'wq2', text: 'The shots carried our launch — we barely had to say a word.', source: 'Marketing Lead · Corporate' },
      ],
    },
    editBasics: {
      text: ['eyebrow', 'heading'],
      button: [],
      collections: [
        { key: 'quotes', countPrefix: 'quotes.', itemPrefixes: ['quotes.'], items: 4 },
      ],
    },
  },
  {
    sectionType: 'contact',
    layout: 'WorkContact',
    sectionId: 'atelier2-contact',
    content: {
      eyebrow: 'Get in touch',
      heading: 'Let’s work together',
      lead: 'Tell me about the project — I reply within one working day. WhatsApp and email also welcome.',
      contact_method: 'form',
      form_ref: '',
      cta_label: 'Message me',
    },
    editBasics: {
      // form path → the lead form (formNode) renders plain <input>/<label> (no
      // edit-primitive markers); the copy fields are the counted markers.
      text: ['eyebrow', 'heading', 'lead'],
      button: [],
      collections: [],
    },
  },
  {
    sectionType: 'footer',
    layout: 'WorkFooter',
    sectionId: 'atelier2-footer',
    content: {
      eyebrow: 'Get in touch',
      heading: 'Let’s make yours.',
      note: 'Portfolio headshots and brand photography, Netherlands — serving enterprise brands.',
      copyright: '© 2026 Kristina Kundius',
      socials: [
        { id: 'fs1', network: 'Instagram', href: '#' },
        { id: 'fs2', network: 'LinkedIn', href: '#' },
      ],
    },
    editBasics: {
      text: ['eyebrow', 'heading', 'note', 'copyright'],
      button: [],
      collections: [
        { key: 'socials', countPrefix: 'socials.', itemPrefixes: ['socials.'], items: 2 },
      ],
    },
  },

  // ── Phase 6 layout library — every built variant as its own stage section ──────

  // Header arrangements (internal dispatch → `content.layout` carries the arrangement
  // for the published band). Same header content as the default.
  ...(['WorkHeaderStart', 'WorkHeaderCentered', 'WorkHeaderSplit', 'WorkHeaderMinimal'] as const).map((ln) => ({
    sectionType: 'header',
    layout: ln,
    sectionId: `atelier2-header-${ln.replace('WorkHeader', '').toLowerCase()}`,
    content: {
      logo_text: 'Kristina Kundius',
      cta_label: 'Start Your Project',
      cta_href: '#contact',
      // Read by the PUBLISHED header wrapper (flat-props fallback for the stage).
      layout: ln,
      nav_links: [
        { id: `${ln}n1`, label: 'Work', href: '#work' },
        { id: `${ln}n2`, label: 'About', href: '#about' },
        { id: `${ln}n3`, label: 'Contact', href: '#contact' },
      ],
    },
    editBasics: {
      text: ['logo_text'],
      button: ['cta_label'],
      collections: [
        { key: 'nav_links', countPrefix: 'nav_links.', itemPrefixes: ['nav_links.'], items: 3 },
      ],
    },
  })),

  // Hero arrangements (distinct components; same hero content contract).
  ...(['WorkHeroImage', 'WorkHeroSplit', 'WorkHeroCenter'] as const).map((ln) => ({
    sectionType: 'hero',
    layout: ln,
    sectionId: `atelier2-hero-${ln.replace('WorkHero', '').toLowerCase()}`,
    content: {
      role_line: 'Professional Photographer',
      name: 'Kristina <em>Kundius</em>',
      quote: 'A body of work that does the persuading for you — browse it, then let’s make yours.',
      portrait_image: '',
      cta_label: 'Start Your Project',
      cta_href: '#contact',
      socials: [
        { id: `${ln}s1`, network: 'instagram', label: 'Instagram', href: '#' },
        { id: `${ln}s2`, network: 'linkedin', label: 'LinkedIn', href: '#' },
      ],
    },
    editBasics: {
      text: ['role_line', 'name', 'quote'],
      button: ['cta_label'],
      collections: [
        { key: 'socials', countPrefix: 'socials.', itemPrefixes: ['socials.'], items: 2 },
      ],
    },
  })),

  // Gallery arrangements (distinct components; same `groups` group-reference contract).
  ...(['WorkGalleryMasonry', 'WorkGalleryStrip'] as const).map((ln) => ({
    sectionType: 'work',
    layout: ln,
    sectionId: `atelier2-work-${ln.replace('WorkGallery', '').toLowerCase()}`,
    content: {
      eyebrow: 'Selected work',
      heading: 'The work',
      lead: 'Portfolio headshots and brand photography for companies that want to be remembered.',
      groups: [
        { id: `${ln}g1`, name: 'Full brand package', cover_image: '', href: '#work' },
        { id: `${ln}g2`, name: 'Brand photoshoot', cover_image: '', href: '#work' },
        { id: `${ln}g3`, name: 'Portrait & business shoot', cover_image: '', href: '#work' },
        { id: `${ln}g4`, name: 'Event photography (per hour)', cover_image: '', href: '#work' },
      ],
    },
    editBasics: {
      text: ['eyebrow', 'heading', 'lead'],
      button: [],
      collections: [
        { key: 'groups', countPrefix: 'groups.', itemPrefixes: ['groups.'], items: 4 },
      ],
    },
  })),

  // Proof SHAPE — client logos (reads the `logos` collection).
  {
    sectionType: 'proof',
    layout: 'WorkProofLogos',
    sectionId: 'atelier2-proof-logos',
    content: {
      eyebrow: 'Trusted by',
      heading: 'Selected clients',
      logos: [
        { id: 'pl1', name: 'Northwind', image: '' },
        { id: 'pl2', name: 'Meridian', image: '' },
        { id: 'pl3', name: 'Bloom', image: '' },
        { id: 'pl4', name: 'Ceramica', image: '' },
      ],
    },
    editBasics: {
      text: ['eyebrow', 'heading'],
      button: [],
      collections: [
        { key: 'logos', countPrefix: 'logos.', itemPrefixes: ['logos.'], items: 4 },
      ],
    },
  },

  // Proof SHAPE — results/metrics (reads the `metrics` collection).
  {
    sectionType: 'proof',
    layout: 'WorkProofResults',
    sectionId: 'atelier2-proof-results',
    content: {
      eyebrow: 'The numbers',
      heading: 'Results that speak',
      metrics: [
        { id: 'pr1', value: '120+', label: 'Brands photographed' },
        { id: 'pr2', value: '98%', label: 'Would book again' },
        { id: 'pr3', value: '48h', label: 'Typical turnaround' },
      ],
    },
    editBasics: {
      text: ['eyebrow', 'heading'],
      button: [],
      collections: [
        { key: 'metrics', countPrefix: 'metrics.', itemPrefixes: ['metrics.'], items: 3 },
      ],
    },
  },

  // ── Phase 7 section coverage — packages · about · faq · results ────────────

  // Packages — the conviction pillar. Mixed price_mode (exact / from / on-request)
  // exercises the price-display logic in ONE section.
  {
    sectionType: 'packages',
    layout: 'WorkPackages',
    sectionId: 'atelier2-packages',
    content: {
      eyebrow: 'Packages',
      heading: 'Ways to work together',
      lead: 'Clear, honest pricing — pick the scope that fits your brand.',
      packages: [
        { id: 'pk1', name: 'Full brand package', price_mode: 'from', price_line: '€2,400', description: 'A complete shoot day plus a curated library for every channel.', cta_label: 'Enquire →' },
        { id: 'pk2', name: 'Brand photoshoot', price_mode: 'exact', price_line: '€1,200', description: 'A focused half-day covering your core brand imagery.', cta_label: 'Enquire →' },
        { id: 'pk3', name: 'Portrait & business shoot', price_mode: 'on-request', price_line: 'On request', description: 'Team headshots and executive portraits, scoped to your size.', cta_label: 'Enquire →' },
      ],
    },
    editBasics: {
      text: ['eyebrow', 'heading', 'lead'],
      button: [],
      collections: [
        { key: 'packages', countPrefix: 'packages.', itemPrefixes: ['packages.'], items: 3 },
      ],
    },
  },

  // About — the story. Two-column with an optional facts strip.
  {
    sectionType: 'about',
    layout: 'WorkAbout',
    sectionId: 'atelier2-about',
    content: {
      eyebrow: 'About',
      heading: 'The person behind the lens',
      bio: 'I photograph brands the way I wish more of them were seen — honestly, warmly, and with an eye for the small details that make a company feel human. Over the last decade I have worked with enterprise teams across the Netherlands to build image libraries they actually reach for.',
      facts: [
        { id: 'af1', value: '10+ yrs', label: 'Behind the camera' },
        { id: 'af2', value: '120+', label: 'Brands photographed' },
        { id: 'af3', value: 'NL', label: 'Based & working' },
      ],
    },
    editBasics: {
      text: ['eyebrow', 'heading', 'bio'],
      button: [],
      collections: [
        { key: 'facts', countPrefix: 'facts.', itemPrefixes: ['facts.'], items: 3 },
      ],
    },
  },

  // FAQ — static question/answer list (optional section).
  {
    sectionType: 'faq',
    layout: 'WorkFaq',
    sectionId: 'atelier2-faq',
    content: {
      eyebrow: 'FAQ',
      heading: 'Questions, answered',
      items: [
        { id: 'fq1', question: 'How far ahead should I book?', answer: 'Two to four weeks is typical, though I can often accommodate shorter timelines for existing clients.' },
        { id: 'fq2', question: 'Do you travel?', answer: 'Yes — anywhere in the Netherlands is included, and further afield is quoted transparently.' },
        { id: 'fq3', question: 'How do we use the images?', answer: 'You receive a full commercial licence for your brand across web, social, and print.' },
      ],
    },
    editBasics: {
      text: ['eyebrow', 'heading'],
      button: [],
      collections: [
        { key: 'items', countPrefix: 'items.', itemPrefixes: ['items.'], items: 3 },
      ],
    },
  },

  // Results — standalone big-number outcomes (optional section).
  {
    sectionType: 'results',
    layout: 'WorkResults',
    sectionId: 'atelier2-results',
    content: {
      eyebrow: 'Outcomes',
      heading: 'What the work returns',
      lead: 'The measurable difference a considered image library makes.',
      metrics: [
        { id: 'rm1', value: '3×', label: 'More engagement on launch posts' },
        { id: 'rm2', value: '98%', label: 'Would book again' },
        { id: 'rm3', value: '48h', label: 'Typical delivery' },
      ],
    },
    editBasics: {
      text: ['eyebrow', 'heading'],
      button: [],
      collections: [
        { key: 'metrics', countPrefix: 'metrics.', itemPrefixes: ['metrics.'], items: 3 },
      ],
    },
  },
];

export function atelier2Sections(): BlockMockSection[] {
  return ATELIER2_BLOCK_MOCKS.map((m) => ({ templateId: 'atelier2' as TemplateId, ...m }));
}
