// src/modules/audience/service/elementSchema.ts
// V2 element schemas for the service block set (Phase 2 / pilot scope).
// AUDIENCE-LEVEL (7.5d): these field shapes are shared by ALL service templates
// (the 6 block types have the same role-named fields regardless of template), so
// this lives at audience level — importing it must NOT drag any template module
// into the bundle. Reference: newServiceOnboarding.md §4.
//
// Schemas slot into the global `layoutElementSchema` registry so existing
// V2 helpers (getAllElements, getCardRequirements, applyAllSchemaDefaults) work
// unchanged. Layout names are PascalCase, distinct from v3 product blocks.
//
// Pilot blocks (7):
//   WarmNavHeader, PetalFramedHero, IconServiceCards, PullQuoteWithMark,
//   TieredPackages, BookCallCTA, ContactFooterRich.

import type { UIBlockSchemaV2 } from '@/modules/sections/layoutElementSchema';

export const serviceElementSchema: Record<string, UIBlockSchemaV2> = {
  // ===== Header =====
  WarmNavHeader: {
    sectionType: 'header',
    elements: {
      logo_text:        { type: 'string', requirement: 'required', fillMode: 'ai_generated', default: 'Studio' },
      cta_text:         { type: 'string', requirement: 'required', fillMode: 'ai_generated', default: 'Book a call' },
      logo_image:       { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
    },
    collections: {
      nav_items: {
        requirement: 'required',
        fillMode: 'ai_generated',
        constraints: { min: 2, max: 5 },
        fields: {
          id:    { type: 'string', fillMode: 'system' },
          label: { type: 'string', fillMode: 'ai_generated', default: '' },
          href:  { type: 'string', fillMode: 'ai_generated', default: '#' },
        },
      },
    },
  },

  // ===== Hero =====
  // Italic-accent convention: headline / lede may include <em>...</em> wrapping
  // 1-2 emphasized words. Renderer styles those as accent-deep italic Fraunces.
  PetalFramedHero: {
    sectionType: 'hero',
    elements: {
      eyebrow:           { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: '' },
      headline:          { type: 'string', requirement: 'required', fillMode: 'ai_generated', default: 'Brand identity that <em>stays with you</em>.' },
      lede:              { type: 'string', requirement: 'required', fillMode: 'ai_generated', default: '' },
      cta_text:          { type: 'string', requirement: 'required', fillMode: 'ai_generated', default: 'Book a call' },
      secondary_cta_text:{ type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: '' },
      hero_image:        { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      meta:              { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: '' },
    },
  },

  // ===== Services =====
  IconServiceCards: {
    sectionType: 'services',
    elements: {
      eyebrow:    { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: '' },
      headline:   { type: 'string', requirement: 'required', fillMode: 'ai_generated', default: 'What we do' },
      lede:       { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: '' },
    },
    collections: {
      services: {
        requirement: 'required',
        fillMode: 'ai_generated',
        constraints: { min: 3, max: 6 },
        fields: {
          id:          { type: 'string', fillMode: 'system' },
          title:       { type: 'string', fillMode: 'ai_generated', default: '' },
          description: { type: 'string', fillMode: 'ai_generated', default: '' },
          icon:        { type: 'string', fillMode: 'manual_preferred', default: 'Sparkles' },
          cta_text:    { type: 'string', fillMode: 'ai_generated', default: '' },
        },
      },
    },
  },

  // ===== Testimonials =====
  // quote may include <em>...</em>; mark glyph rendered separately.
  PullQuoteWithMark: {
    sectionType: 'testimonials',
    elements: {
      eyebrow:        { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: '' },
      quote:          { type: 'string', requirement: 'required', fillMode: 'ai_generated_needs_review', default: '' },
      author_name:    { type: 'string', requirement: 'required', fillMode: 'ai_generated_needs_review', default: '' },
      author_role:    { type: 'string', requirement: 'optional', fillMode: 'ai_generated_needs_review', default: '' },
      author_company: { type: 'string', requirement: 'optional', fillMode: 'ai_generated_needs_review', default: '' },
      author_photo:   { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      meta:           { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: '' },
    },
  },

  // ===== Testimonials (alt layout) — multi-review grid =====
  // Second `testimonials` layout (sectionType 'testimonials', same as
  // PullQuoteWithMark). A template that registers multiple testimonials blocks
  // (Surge) picks one at generation; render dispatch is by stored layout. quote
  // may include <em>. Quotes/authors are needs_review (real proof).
  ReviewGrid: {
    sectionType: 'testimonials',
    elements: {
      eyebrow:  { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: '' },
      headline: { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: '' },
    },
    collections: {
      // collection key ≠ section type 'testimonials' (avoids the elements-collapse trap).
      reviews: {
        requirement: 'required',
        fillMode: 'ai_generated_needs_review',
        constraints: { min: 1, max: 3 },
        fields: {
          id:             { type: 'string', fillMode: 'system' },
          quote:          { type: 'string', fillMode: 'ai_generated_needs_review', default: '' },
          author_name:    { type: 'string', fillMode: 'ai_generated_needs_review', default: '' },
          author_role:    { type: 'string', fillMode: 'ai_generated_needs_review', default: '' },
          author_company: { type: 'string', fillMode: 'ai_generated_needs_review', default: '' },
          author_photo:   { type: 'string', fillMode: 'manual_preferred', default: '' },
        },
      },
    },
  },

  // ===== Packages =====
  // Prices flagged ai_generated_needs_review per spec §4 (avoid hallucination).
  TieredPackages: {
    sectionType: 'packages',
    elements: {
      eyebrow:    { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: '' },
      headline:   { type: 'string', requirement: 'required', fillMode: 'ai_generated', default: 'Ways to work together' },
      lede:       { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: '' },
    },
    collections: {
      packages: {
        requirement: 'required',
        fillMode: 'ai_generated',
        constraints: { min: 1, max: 3 },
        fields: {
          id:            { type: 'string', fillMode: 'system' },
          name:          { type: 'string', fillMode: 'ai_generated', default: '' },
          price_display: { type: 'string', fillMode: 'ai_generated_needs_review', default: '' },
          timeline:      { type: 'string', fillMode: 'ai_generated', default: '' },
          features:      { type: 'string[]', fillMode: 'ai_generated', default: [], constraints: { min: 4, max: 7 } },
          cta_text:      { type: 'string', fillMode: 'ai_generated', default: 'Book a call' },
          is_featured:   { type: 'boolean', fillMode: 'ai_generated', default: false },
        },
      },
    },
  },

  // ===== CTA =====
  BookCallCTA: {
    sectionType: 'cta',
    elements: {
      eyebrow:           { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: '' },
      headline:          { type: 'string', requirement: 'required', fillMode: 'ai_generated', default: 'Let’s talk.' },
      lede:              { type: 'string', requirement: 'required', fillMode: 'ai_generated', default: '' },
      cta_text:          { type: 'string', requirement: 'required', fillMode: 'ai_generated', default: 'Book a call' },
      secondary_cta_text:{ type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: '' },
      meta:              { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: '' },
    },
  },

  // ===== Logos (Surge-only delta) =====
  // Text wordmarks, not images. Client names are proof → needs_review so the AI
  // proposes placeholders the founder verifies (never fabricated brands).
  LogoStrip: {
    sectionType: 'logos',
    elements: {
      label: { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: 'Trusted by founders at' },
    },
    collections: {
      // NOTE: collection key deliberately ≠ section type 'logos' — a same-name
      // collection makes gpt-4o-mini collapse `elements` into the bare array.
      brands: {
        requirement: 'required',
        fillMode: 'ai_generated_needs_review',
        constraints: { min: 3, max: 8 },
        fields: {
          id:   { type: 'string', fillMode: 'system' },
          name: { type: 'string', fillMode: 'ai_generated_needs_review', default: '' },
        },
      },
    },
  },

  // ===== About (Surge-only delta) =====
  // headline / lede may include <em>. stats values are proof → needs_review.
  AboutWithStats: {
    sectionType: 'about',
    elements: {
      eyebrow:  { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: '' },
      headline: { type: 'string', requirement: 'required', fillMode: 'ai_generated', default: 'A small senior team, <em>obsessed with the graph</em>' },
      lede:     { type: 'string', requirement: 'required', fillMode: 'ai_generated', default: '' },
      body:     { type: 'string', requirement: 'required', fillMode: 'ai_generated', default: '' },
    },
    collections: {
      tags: {
        requirement: 'optional',
        fillMode: 'ai_generated',
        constraints: { min: 0, max: 6 },
        fields: {
          id:    { type: 'string', fillMode: 'system' },
          label: { type: 'string', fillMode: 'ai_generated', default: '' },
        },
      },
      stats: {
        requirement: 'optional',
        fillMode: 'ai_generated_needs_review',
        constraints: { min: 0, max: 4 },
        fields: {
          id:       { type: 'string', fillMode: 'system' },
          value:    { type: 'string', fillMode: 'ai_generated_needs_review', default: '' },
          label:    { type: 'string', fillMode: 'ai_generated', default: '' },
          sublabel: { type: 'string', fillMode: 'ai_generated', default: '' },
        },
      },
    },
  },

  // ===== Case Studies (Surge-only delta) =====
  // The proof spine. Client names + metrics are PLACEHOLDERED, never fabricated
  // (needs_review): the copy prompt instructs `[Client]` / `+XX% [metric]` for the
  // founder to replace. `metrics` is a nested array of {value,label}.
  ResultCaseCards: {
    sectionType: 'casestudies',
    elements: {
      eyebrow:  { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: '' },
      headline: { type: 'string', requirement: 'required', fillMode: 'ai_generated', default: 'The proof is the <em>graph going up</em>' },
      lede:     { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: '' },
    },
    collections: {
      cases: {
        requirement: 'required',
        fillMode: 'ai_generated_needs_review',
        constraints: { min: 2, max: 4 },
        fields: {
          id:          { type: 'string', fillMode: 'system' },
          client:      { type: 'string', fillMode: 'ai_generated_needs_review', default: '[Client]' },
          client_meta: { type: 'string', fillMode: 'ai_generated', default: '' },
          tag:         { type: 'string', fillMode: 'ai_generated', default: '' },
          headline:    { type: 'string', fillMode: 'ai_generated', default: '' },
          metrics: {
            type: 'array',
            fillMode: 'ai_generated_needs_review',
            constraints: { min: 2, max: 3 },
            fields: {
              value: { type: 'string', fillMode: 'ai_generated_needs_review', default: '' },
              label: { type: 'string', fillMode: 'ai_generated', default: '' },
            },
          },
        },
      },
    },
  },

  // ===== Stats band (Surge-only delta) =====
  // Dark panel band. `value` may include <em> for the unit. Values are proof → needs_review.
  StatsBand: {
    sectionType: 'stats',
    elements: {
      eyebrow:  { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: '' },
      headline: { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: '' },
    },
    collections: {
      // collection key ≠ section type 'stats' (avoids the elements-collapse trap).
      metrics: {
        requirement: 'required',
        fillMode: 'ai_generated_needs_review',
        constraints: { min: 3, max: 4 },
        fields: {
          id:    { type: 'string', fillMode: 'system' },
          value: { type: 'string', fillMode: 'ai_generated_needs_review', default: '' },
          label: { type: 'string', fillMode: 'ai_generated', default: '' },
        },
      },
    },
  },

  // ===== Footer =====
  ContactFooterRich: {
    sectionType: 'footer',
    elements: {
      tagline:        { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: '' },
      contact_email:  { type: 'string', requirement: 'required', fillMode: 'manual_preferred', default: 'hello@example.com' },
      contact_phone:  { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      address:        { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      copyright:      { type: 'string', requirement: 'required', fillMode: 'ai_generated', default: '© Studio' },
    },
    collections: {
      social_links: {
        requirement: 'optional',
        fillMode: 'manual_preferred',
        constraints: { min: 0, max: 6 },
        fields: {
          id:       { type: 'string', fillMode: 'system' },
          platform: { type: 'string', fillMode: 'manual_preferred', default: '' },
          href:     { type: 'string', fillMode: 'manual_preferred', default: '' },
        },
      },
    },
  },
};

/**
 * Pilot layout names — single source of truth for tests + uiblock map.
 */
export const PILOT_LAYOUT_NAMES = {
  header:       'WarmNavHeader',
  hero:         'PetalFramedHero',
  services:     'IconServiceCards',
  testimonials: 'PullQuoteWithMark',
  packages:     'TieredPackages',
  cta:          'BookCallCTA',
  footer:       'ContactFooterRich',
  // Surge-only delta sections. Shared map (selectServiceUIBlocks reads it), but
  // only emitted when section selection is template-aware for Surge — Hearth/Lex
  // never select these, so they never render them. MUST stay in lockstep with
  // selectServiceSections' SURGE_MIDDLE_ORDER (watch-out: a missing key here makes
  // the section silently vanish via the `if (layout)` guard in selectServiceUIBlocks).
  logos:        'LogoStrip',
  about:        'AboutWithStats',
  casestudies:  'ResultCaseCards',
  stats:        'StatsBand',
} as const;

export type PilotSectionType = keyof typeof PILOT_LAYOUT_NAMES;
