// src/modules/templates/blockMocks/index.ts
// Per-template block-mock registry (template-factory phase 2). TEST/DEV-ONLY
// consumers: the /dev blocks gallery, `renderParity.meridian.test.tsx`, the
// `templateConformance` editor-basics subset, and (phase 7) the screenshot parity
// harness. NOT imported by the app bundle or any `.published.*` renderer.
//
// Adding a template's mocks here (with `editBasics`) is what enrolls it in the
// editor-basics conformance subset + the parity harness — one place.

import type { TemplateId } from '@/types/service';
import { MERIDIAN_BLOCK_MOCKS, MERIDIAN_EDIT_BASICS } from './meridian';
import { HEARTH_BLOCK_MOCKS } from './hearth';
import { atelierSections } from './atelier';

/** One collection's per-item marker expectation (editor-basics). */
export interface CollectionExpectation {
  /** Collection element key (e.g. 'features'). */
  key: string;
  /**
   * The per-item marker key PREFIX used to COUNT item roots — one representative
   * field rendered once per item (e.g. 'features_title_'). `[data-element-key^=
   * prefix]` count must equal `items`.
   */
  countPrefix: string;
  /**
   * EVERY per-item marker key prefix this collection renders in preview (text +
   * button), used by the no-orphan check so per-item markers aren't flagged as
   * dead. Superset of `countPrefix`.
   */
  itemPrefixes: string[];
  /** Number of mock items ⇒ number of expected item roots. */
  items: number;
}

/** Editor-basics marker expectations for one section's preview render. */
export interface EditBasicsExpectation {
  /** Element keys that must each render exactly one text-primitive marker. */
  text: string[];
  /** Element keys that must each render exactly one button-primitive marker. */
  button: string[];
  /** Collections whose item roots are counted concretely. */
  collections: CollectionExpectation[];
}

/** A per-template, per-section mock the editor-basics + parity suites consume. */
export interface BlockMockSection {
  templateId: TemplateId;
  sectionType: string;
  layout: string;
  /** Store section id (unique across templates so one store can seed all). */
  sectionId: string;
  content: Record<string, any>;
  editBasics: EditBasicsExpectation;
}

function meridianSections(): BlockMockSection[] {
  return MERIDIAN_BLOCK_MOCKS.filter((m) => MERIDIAN_EDIT_BASICS[m.sectionType]).map((m) => ({
    templateId: 'meridian' as TemplateId,
    sectionType: m.sectionType,
    layout: m.layout,
    sectionId: `meridian-${m.sectionType}`,
    content: m.content,
    editBasics: MERIDIAN_EDIT_BASICS[m.sectionType],
  }));
}

function hearthSections(): BlockMockSection[] {
  return HEARTH_BLOCK_MOCKS.map((m) => ({
    templateId: 'hearth' as TemplateId,
    sectionType: m.sectionType,
    layout: m.layout,
    sectionId: `hearth-${m.sectionType}`,
    content: m.content,
    editBasics: m.editBasics,
  }));
}

/**
 * Templates enrolled in the editor-basics conformance subset + parity harness,
 * keyed by templateId. surge/vestria/lex/etc. are intentionally deferred (plan
 * Q6) — they carry no mocks here until their next touch.
 */
export const BLOCK_MOCKS: Partial<Record<TemplateId, BlockMockSection[]>> = {
  meridian: meridianSections(),
  hearth: hearthSections(),
  // atelier-skeleton-cutover: atelier shows the work-SKELETON blocks (the old
  // hand-written atelier mocks were retired with the old skin).
  atelier: atelierSections('atelier'),
};

/** Flat list of every enrolled section (for seeding one shared harness store). */
export const ALL_BLOCK_MOCK_SECTIONS: BlockMockSection[] = Object.values(BLOCK_MOCKS)
  .filter((v): v is BlockMockSection[] => Array.isArray(v))
  .flat();
