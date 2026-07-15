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
import { atelier2Sections } from './atelier2';

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

// ── Atelier block mocks (atelier-template phase 11) ──────────────────────────
// Hand-authored per-section mocks for the 8 manifest-declared Atelier blocks,
// feeding the `templateConformance` editor-basics subset now + the phase-12
// screenshot/content parity harness later. Enrolled via `assertEditorBasics
// ('atelier')` in conformance.test.ts (the mocks are the substance — that helper
// green-passes VACUOUSLY on an empty entry).
//
// ⚠️ TWO Atelier-specific facts drive how `editBasics` is authored (verified
// against source, NOT copied from meridian/hearth blindly):
//
//   1. SCHEMA GATE (RESOLVED in phase 11b) — the edit blocks read content through
//      `useAtelierBlock` → `extractLayoutContent(elements, getSchemaDefaults(layout),
//      …)`, which iterates ONLY the layout's `serviceElementSchema` keys (+
//      collections as array keys). In phase 11 the atelier "chrome" keys
//      (`more_text`, `badge_text`, About `cta_text`, Quote `headline`, Contact
//      `location`/`instagram`, Footer `closer_*`/`contact_location`/`index_heading`/
//      `elsewhere_heading`/`legal_text`, …) were NOT in the schema → extraction
//      DROPPED them → cores rendered their hardcoded design placeholder as live
//      text, and edits reverted (persist-then-dropped). Phase 11b added every one
//      to the `Atelier*` layouts in `serviceElementSchema`, so the values below now
//      SURVIVE extraction — persistable, fillable, and rendered as the mock value
//      (not the placeholder). Collections `footer_links`/`press_items`/`quotes`/
//      `slides` are likewise schema-backed now (footer_links is exercised below;
//      press_items/quotes/slides render only in page/multi/slider mode).
//
//   2. DOT-FORMAT COLLECTION KEYS — atelier collection item fields are keyed
//      `<coll>.<id>.<field>` (the platform SelectionSystem treats the LAST dot
//      segment as the field). A start-anchored `countPrefix` (`[data-element-key^=
//      "works."]`) therefore matches EVERY per-item text/button marker, so `items`
//      = cards × markers-per-item (nav/social = 1/item; works = 2/item title+
//      caption; packages = 4/item summary+name+price+cta). This differs from
//      meridian/hearth's field-first `<coll>_<field>_<id>` keys (which isolate one
//      field/item); atelier can't reorder to that format without breaking the
//      shared SelectionSystem/contentActions dot-path parsers.
const ATELIER_BLOCK_MOCKS: Array<{
  sectionType: string;
  layout: string;
  sectionId: string;
  content: Record<string, any>;
  editBasics: EditBasicsExpectation;
}> = [
  {
    sectionType: 'header',
    layout: 'AtelierNavHeader',
    sectionId: 'atelier-header',
    content: {
      logo_text: 'Atelier Kontur',
      cta_text: 'Start a project',
      cta_href: '#contact',
      logo_image: '',
      nav_items: [
        { id: 'an1', label: 'Work', href: '#work' },
        { id: 'an2', label: 'Experiences', href: '#experiences' },
        { id: 'an3', label: 'About', href: '#about' },
        { id: 'an4', label: 'Contact', href: '#contact' },
      ],
    },
    editBasics: {
      text: ['logo_text'],
      button: ['cta_text'],
      collections: [
        { key: 'nav_items', countPrefix: 'nav_items.', itemPrefixes: ['nav_items.'], items: 4 },
      ],
    },
  },
  {
    sectionType: 'hero',
    layout: 'AtelierHero',
    sectionId: 'atelier-hero',
    content: {
      eyebrow: 'Portfolio · Commissions',
      headline: 'Seen. Chosen. <em>Remembered.</em>',
      lede: 'A body of work that does the persuading for you.',
      cta_text: 'Start a project',
      cta_href: '#contact',
      secondary_cta_text: 'See the work',
      secondary_cta_href: '#work',
    },
    editBasics: {
      // slides is not a schema collection → renders the static no-content fallback
      // slide (no image markers); no collection to count here.
      text: ['eyebrow', 'headline', 'lede'],
      button: ['cta_text', 'secondary_cta_text'],
      collections: [],
    },
  },
  {
    sectionType: 'work',
    layout: 'AtelierWorkGallery',
    sectionId: 'atelier-work',
    content: {
      eyebrow: 'Selected work',
      headline: 'Selected <em>work</em>',
      lede: 'A short cut of recent commissions.',
      works: [
        { id: 'aw1', title: 'Bloom Atelier', caption: 'Editorial', image: '' },
        { id: 'aw2', title: 'Northlight', caption: 'Portrait', image: '' },
        { id: 'aw3', title: 'Ceramica', caption: 'Product', image: '' },
        { id: 'aw4', title: 'The Long Table', caption: 'Interiors', image: '' },
      ],
      // more_text/more_href are non-schema (dropped) but rendered unconditionally.
      more_text: 'View the full portfolio →',
      more_href: '#work',
    },
    editBasics: {
      // more_text is the non-schema unconditional teaser link → still a marker.
      text: ['eyebrow', 'headline', 'lede', 'more_text'],
      button: [],
      // works via EditableImageCollection: title + caption per item = 2 markers ×
      // 4 items = 8 (add/remove/reorder affordances carry no data-element-key).
      collections: [
        { key: 'works', countPrefix: 'works.', itemPrefixes: ['works.'], items: 8 },
      ],
    },
  },
  // packages at 2 / 3 / 4 cards — exercises the tiered-package capacity on the
  // editor side (complements the blockManifest minCards:2/maxCards:4). Each card
  // renders 4 markers (summary + name + price_display text, cta_text button).
  ...([2, 3, 4] as const).map((n) => ({
    sectionType: 'packages',
    layout: 'AtelierPackages',
    sectionId: `atelier-packages-${n}`,
    content: {
      eyebrow: 'Experiences',
      headline: 'Ways to work together',
      lede: 'Transparent scopes — pick the depth that fits.',
      packages: Array.from({ length: n }, (_, i) => ({
        id: `ap${n}${i + 1}`,
        name: ['Single Session', 'Half Day', 'Full Day', 'Bespoke'][i],
        price_display: ['From €250', 'From €680', 'From €1,200', 'On request'][i],
        summary: ['The Essential', 'The Signature', 'The Story', 'The Commission'][i],
        features: ['90-minute session', '20 edited images', 'Online gallery'],
        cta_text: 'See details',
        is_featured: i === 1,
        image: '',
      })),
    },
    editBasics: {
      text: ['eyebrow', 'headline', 'lede'],
      button: [],
      collections: [
        { key: 'packages', countPrefix: 'packages.', itemPrefixes: ['packages.'], items: n * 4 },
      ],
    },
  })),
  {
    sectionType: 'about',
    layout: 'AtelierAbout',
    sectionId: 'atelier-about',
    content: {
      eyebrow: 'About',
      headline: 'The hands behind <em>the work.</em>',
      body: 'A short introduction — who makes the work and what clients hire them for.',
      body2: 'A second paragraph adds the craft detail and the way of working.',
      signature: 'Maker Name',
      about_image: '',
      // non-schema chrome (dropped by extraction; render unconditionally as markers)
      badge_text: 'Maker · City',
      cta_text: 'Start a project',
      cta_href: '#contact',
    },
    editBasics: {
      // teaser mode (mode is non-schema → undefined → no press/studio blocks).
      // badge_text + cta_text are non-schema unconditional chrome markers.
      text: ['badge_text', 'eyebrow', 'headline', 'body', 'body2', 'signature'],
      button: ['cta_text'],
      collections: [],
    },
  },
  {
    sectionType: 'quote',
    layout: 'AtelierQuoteBand',
    sectionId: 'atelier-quote',
    content: {
      eyebrow: 'Kind words',
      // headline is non-schema for the quote band but rendered unconditionally.
      headline: 'What clients say',
      quote: 'The work carried our whole launch — we just showed it.',
      author_name: 'A. Client',
      author_role: 'Studio Bloom, Amsterdam',
    },
    editBasics: {
      // quotes collection is non-schema → single-quote fallback path renders.
      text: ['eyebrow', 'headline', 'quote', 'author_name', 'author_role'],
      button: [],
      collections: [],
    },
  },
  {
    sectionType: 'contact',
    layout: 'AtelierContact',
    sectionId: 'atelier-contact',
    content: {
      form_id: '',
      eyebrow: 'Details',
      headline: 'Or reach out <em>directly.</em>',
      lede: 'Email is answered daily; calls by appointment.',
      email: 'hello@atelierkontur.example',
      phone: '+31 6 0000 0000',
      // non-schema detail rows (dropped; rendered unconditionally as markers)
      location: 'Amsterdam · serving NL',
      instagram: '@atelierkontur',
    },
    editBasics: {
      // the lead form (formNode) renders plain <input>/<label> — no edit-primitive
      // markers. location + instagram are non-schema unconditional chrome markers.
      text: ['eyebrow', 'headline', 'lede', 'location', 'phone', 'email', 'instagram'],
      button: [],
      collections: [],
    },
  },
  {
    sectionType: 'footer',
    layout: 'AtelierFooter',
    sectionId: 'atelier-footer',
    content: {
      brand_text: 'Atelier Kontur',
      tagline: 'Photography and commissions for brands that want to be remembered.',
      contact_email: 'hello@atelierkontur.example',
      contact_phone: '+31 6 0000 0000',
      copyright: '© 2026 Atelier Kontur',
      whatsapp_number: '',
      social_links: [
        { id: 'as1', platform: 'Instagram', href: '#' },
        { id: 'as2', platform: 'Behance', href: '#' },
        { id: 'as3', platform: 'LinkedIn', href: '#' },
      ],
      // chrome (phase 11b: now schema-backed → persistable/fillable): closer band +
      // column headings + legal render as markers with these values. footer_links is
      // now a schema collection → its items render label markers (counted below).
      closer_eyebrow: 'Ready when you are',
      closer_headline: 'Let’s make <em>yours.</em>',
      closer_cta_text: 'Start a project',
      closer_cta_href: '#contact',
      contact_location: 'Amsterdam, NL',
      index_heading: 'Index',
      elsewhere_heading: 'Elsewhere',
      legal_text: 'Privacy · Terms',
      footer_links: [
        { id: 'af1', label: 'Work', href: '#work' },
        { id: 'af2', label: 'About', href: '#about' },
      ],
    },
    editBasics: {
      text: [
        'closer_eyebrow', 'closer_headline', 'brand_text', 'tagline',
        'contact_location', 'contact_phone', 'contact_email',
        'index_heading', 'elsewhere_heading', 'copyright', 'legal_text',
      ],
      button: ['closer_cta_text'],
      // both plain-List schema collections: 1 marker/item (footer_links.label,
      // social_links.platform). footer_links is schema-backed as of phase 11b.
      collections: [
        { key: 'footer_links', countPrefix: 'footer_links.', itemPrefixes: ['footer_links.'], items: 2 },
        { key: 'social_links', countPrefix: 'social_links.', itemPrefixes: ['social_links.'], items: 3 },
      ],
    },
  },
];

function atelierSections(): BlockMockSection[] {
  return ATELIER_BLOCK_MOCKS.map((m) => ({
    templateId: 'atelier' as TemplateId,
    sectionType: m.sectionType,
    layout: m.layout,
    sectionId: m.sectionId,
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
  atelier: atelierSections(),
  // Work-skeleton Atelier skin (dev id). Phase 3: hero only. atelier2Sections is
  // self-tagged with templateId, so it slots in directly.
  atelier2: atelier2Sections(),
};

/** Flat list of every enrolled section (for seeding one shared harness store). */
export const ALL_BLOCK_MOCK_SECTIONS: BlockMockSection[] = Object.values(BLOCK_MOCKS)
  .filter((v): v is BlockMockSection[] => Array.isArray(v))
  .flat();
