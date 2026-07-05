// src/modules/audience/writer/elementSchema.ts
// ===================================================================
// WRITER audience (bespoke §13) — Granth template. Hindi-literary profile sites.
// 6 Granth-named layouts, isolated to the `granth` template (seeded only, never
// section-selected/AI-generated). Globally-unique `Granth*` names so product/
// service schema can't shadow them (§3g #3). Everything `manual_preferred` — the
// AI fills NONE of it; content comes from the writer seed (granthSeed.ts).
//
// Merged into the global layoutElementSchema (see layoutElementSchema.ts). Hindi-
// only — NO bilingual `_nl` twin fields (unlike Lumen). Retirement = delete this
// file + its spread + the resolveGranthBlock/registry/types entries.
// ===================================================================

import type { UIBlockSchemaV2 } from '@/modules/sections/layoutElementSchema';

export const writerElementSchema: Record<string, UIBlockSchemaV2> = {
  // ===== HERO (identity) =====
  GranthArchedHero: {
    sectionType: 'hero',
    elements: {
      role_line:      { type: 'string', requirement: 'required', fillMode: 'manual_preferred', default: '' },
      name:           { type: 'string', requirement: 'required', fillMode: 'manual_preferred', default: '' },
      quote:          { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      portrait_image: { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      cta_label:      { type: 'string', requirement: 'required', fillMode: 'manual_preferred', default: 'पुस्तकें देखें' },
      cta_href:       { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '#books' },
    },
    collections: {
      socials: {
        requirement: 'optional',
        fillMode: 'manual_preferred',
        constraints: { min: 0, max: 6 },
        fields: {
          id:      { type: 'string', fillMode: 'system' },
          network: { type: 'string', fillMode: 'manual_preferred', default: 'facebook' },
          href:    { type: 'string', fillMode: 'manual_preferred', default: '' },
        },
      },
    },
  },

  // ===== ABOUT (परिचय) =====
  GranthParichay: {
    sectionType: 'about',
    elements: {
      eyebrow: { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: 'परिचय' },
      heading: { type: 'string', requirement: 'required', fillMode: 'manual_preferred', default: '' },
      bio:     { type: 'string', requirement: 'required', fillMode: 'manual_preferred', default: '' },
    },
    collections: {
      facts: {
        requirement: 'optional',
        fillMode: 'manual_preferred',
        constraints: { min: 0, max: 4 },
        fields: {
          id:    { type: 'string', fillMode: 'system' },
          value: { type: 'string', fillMode: 'manual_preferred', default: '' },
          label: { type: 'string', fillMode: 'manual_preferred', default: '' },
        },
      },
    },
  },

  // ===== BOOKS (पुस्तकें) =====
  GranthJacketShelf: {
    sectionType: 'books',
    elements: {
      eyebrow:     { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: 'पुस्तकें' },
      heading:     { type: 'string', requirement: 'required', fillMode: 'manual_preferred', default: '' },
      lead:        { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      author_mark: { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      buy_label:   { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: 'Amazon पर ख़रीदें →' },
    },
    collections: {
      items: {
        requirement: 'required',
        fillMode: 'manual_preferred',
        constraints: { min: 2, max: 8 },
        fields: {
          id:          { type: 'string', fillMode: 'system' },
          title:       { type: 'string', fillMode: 'manual_preferred', default: '' },
          kind:        { type: 'string', fillMode: 'manual_preferred', default: '' },
          year:        { type: 'string', fillMode: 'manual_preferred', default: '' },
          blurb:       { type: 'string', fillMode: 'manual_preferred', default: '' },
          buy_url:     { type: 'string', fillMode: 'manual_preferred', default: '' },
          cover_image: { type: 'string', fillMode: 'manual_preferred', default: '' },
        },
      },
    },
  },

  // ===== WRITING (एक रचना) — optional section =====
  GranthFramedPage: {
    sectionType: 'writing',
    elements: {
      label:     { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: 'एक रचना' },
      title:     { type: 'string', requirement: 'required', fillMode: 'manual_preferred', default: '' },
      poem:      { type: 'string', requirement: 'required', fillMode: 'manual_preferred', default: '' },
      signature: { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
    },
  },

  // ===== PRAISE (सम्मान और चर्चा) — optional section =====
  GranthCriticsGrid: {
    sectionType: 'praise',
    elements: {
      eyebrow:     { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: 'सम्मान और चर्चा' },
      heading:     { type: 'string', requirement: 'required', fillMode: 'manual_preferred', default: '' },
      awards_line: { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
    },
    collections: {
      quotes: {
        requirement: 'optional',
        fillMode: 'manual_preferred',
        constraints: { min: 0, max: 3 },
        fields: {
          id:     { type: 'string', fillMode: 'system' },
          text:   { type: 'string', fillMode: 'manual_preferred', default: '' },
          source: { type: 'string', fillMode: 'manual_preferred', default: '' },
        },
      },
    },
  },

  // ===== FOOTER (जुड़िए) =====
  GranthFollowFooter: {
    sectionType: 'footer',
    elements: {
      eyebrow:   { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: 'जुड़िए' },
      heading:   { type: 'string', requirement: 'required', fillMode: 'manual_preferred', default: '' },
      note:      { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      copyright: { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
    },
    collections: {
      socials: {
        requirement: 'optional',
        fillMode: 'manual_preferred',
        constraints: { min: 0, max: 6 },
        fields: {
          id:      { type: 'string', fillMode: 'system' },
          network: { type: 'string', fillMode: 'manual_preferred', default: 'facebook' },
          href:    { type: 'string', fillMode: 'manual_preferred', default: '' },
        },
      },
    },
  },
};
