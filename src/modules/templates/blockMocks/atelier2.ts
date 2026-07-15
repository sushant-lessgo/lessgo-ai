// src/modules/templates/blockMocks/atelier2.ts
// Work-skeleton (Atelier skin, dev id `atelier2`) block mocks — TEST/DEV-ONLY.
// Feeds the /dev/blocks/atelier2 gallery (edit + published bands) and seeds the
// shared harness store (ALL_BLOCK_MOCK_SECTIONS). NOT imported by the app bundle
// or any `.published.*` renderer.
//
// Phase 3: HERO only (WorkHeroSlider). Content is real Kundius hero copy (golden
// kundius.home.json) mapped onto the FROZEN work-core hero contract
// (role_line · name · quote · portrait_image · cta_label · cta_href · socials),
// SINGLE slide (one portrait_image) per the parity convention. Remaining sections
// enroll in phase 4.
//
// NOTE: atelier2 is NOT enrolled in `assertEditorBasics` (conformance.test.ts), so
// `editBasics` here is informational (authored plausibly, not asserted this phase).

import type { TemplateId } from '@/types/service';
import type { BlockMockSection } from './index';

const ATELIER2_BLOCK_MOCKS: Omit<BlockMockSection, 'templateId'>[] = [
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
];

export function atelier2Sections(): BlockMockSection[] {
  return ATELIER2_BLOCK_MOCKS.map((m) => ({ templateId: 'atelier2' as TemplateId, ...m }));
}
