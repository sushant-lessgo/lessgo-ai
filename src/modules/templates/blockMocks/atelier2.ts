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
];

export function atelier2Sections(): BlockMockSection[] {
  return ATELIER2_BLOCK_MOCKS.map((m) => ({ templateId: 'atelier2' as TemplateId, ...m }));
}
