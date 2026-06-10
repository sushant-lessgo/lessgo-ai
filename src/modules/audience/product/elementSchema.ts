// src/modules/audience/product/elementSchema.ts
// V2 element schemas for the Meridian product block set (P2 / pilot scope).
// AUDIENCE-LEVEL (mirrors audience/service/elementSchema.ts): these field shapes
// are the product-line copy contract, shared by ALL product templates regardless
// of visual template. Importing this must NOT drag any template module into the
// bundle (firewall): it imports ZERO template code — pure data.
//
// Schemas slot into the global `layoutElementSchema` registry so existing V2
// helpers (getSchemaDefaults, applyAllSchemaDefaults, getAllElements) work
// unchanged. Layout names are PascalCase, distinct from service + v3 product.
//
// Pilot blocks (7):
//   MeridianNavHeader, TerminalHero, HairlineFeatureGrid, ProofWithLogoRail,
//   ThreeTierPricing, ArcCTA, HairlineFooter.
//
// fillMode rules (spec): copy → ai_generated; numbers/prices/stats/quotes →
// ai_generated_needs_review; images/icons/logos → manual_preferred; ids → system.

import type { UIBlockSchemaV2 } from '@/modules/sections/layoutElementSchema';

export const meridianElementSchema: Record<string, UIBlockSchemaV2> = {
  // ===== Header =====
  MeridianNavHeader: {
    sectionType: 'header',
    elements: {
      logo_text:   { type: 'string', requirement: 'required', fillMode: 'ai_generated', default: 'meridian' },
      cta_text:    { type: 'string', requirement: 'required', fillMode: 'ai_generated', default: 'Start free' },
      signin_text: { type: 'string', requirement: 'required', fillMode: 'ai_generated', default: 'Sign in' },
      logo_image:  { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
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
  // Accent convention: headline may include <em>...</em> wrapping 1-2 emphasized
  // words — rendered upright + accent-colored (the [data-palette] em rule), NOT italic.
  TerminalHero: {
    sectionType: 'hero',
    elements: {
      status_text:        { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: '' },
      audience_tag:       { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: '' },
      headline:           { type: 'string', requirement: 'required', fillMode: 'ai_generated', default: 'Ship on Friday. Sleep on <em>Saturday</em>' },
      lede:               { type: 'string', requirement: 'required', fillMode: 'ai_generated', default: '' },
      cta_text:           { type: 'string', requirement: 'required', fillMode: 'ai_generated', default: 'Start building' },
      secondary_cta_text: { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: '' },
      caption:            { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: '' },
    },
    collections: {
      stats: {
        requirement: 'optional',
        fillMode: 'ai_generated',
        constraints: { min: 0, max: 4 },
        fields: {
          id:    { type: 'string', fillMode: 'system' },
          value: { type: 'string', fillMode: 'ai_generated_needs_review', default: '' },
          label: { type: 'string', fillMode: 'ai_generated', default: '' },
        },
      },
    },
  },

  // ===== Features =====
  HairlineFeatureGrid: {
    sectionType: 'features',
    elements: {
      eyebrow:  { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: '' },
      headline: { type: 'string', requirement: 'required', fillMode: 'ai_generated', default: 'Everything you need' },
      lede:     { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: '' },
    },
    collections: {
      features: {
        requirement: 'required',
        fillMode: 'ai_generated',
        constraints: { min: 3, max: 6 },
        fields: {
          id:          { type: 'string', fillMode: 'system' },
          title:       { type: 'string', fillMode: 'ai_generated', default: '' },
          description: { type: 'string', fillMode: 'ai_generated', default: '' },
          icon:        { type: 'string', fillMode: 'manual_preferred', default: 'Layers' },
          link_text:   { type: 'string', fillMode: 'ai_generated', default: 'read ↗' },
        },
      },
    },
  },

  // ===== Testimonials =====
  // First testimonial renders as the raised (.lg) card. quote may include <em>.
  ProofWithLogoRail: {
    sectionType: 'testimonials',
    elements: {
      eyebrow:  { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: '' },
      headline: { type: 'string', requirement: 'required', fillMode: 'ai_generated', default: 'Loved by fast teams' },
    },
    collections: {
      testimonials: {
        requirement: 'required',
        fillMode: 'ai_generated',
        constraints: { min: 1, max: 3 },
        fields: {
          id:          { type: 'string', fillMode: 'system' },
          quote:       { type: 'string', fillMode: 'ai_generated_needs_review', default: '' },
          author_name: { type: 'string', fillMode: 'ai_generated_needs_review', default: '' },
          author_role: { type: 'string', fillMode: 'ai_generated_needs_review', default: '' },
        },
      },
      logos: {
        requirement: 'optional',
        fillMode: 'manual_preferred',
        constraints: { min: 0, max: 6 },
        fields: {
          id:   { type: 'string', fillMode: 'system' },
          name: { type: 'string', fillMode: 'manual_preferred', default: '' },
        },
      },
    },
  },

  // ===== Pricing =====
  // Mirrors TieredPackages: nested features:string[] + featured flag (.mid badge).
  // Prices flagged ai_generated_needs_review (avoid hallucination).
  ThreeTierPricing: {
    sectionType: 'pricing',
    elements: {
      eyebrow:  { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: '' },
      headline: { type: 'string', requirement: 'required', fillMode: 'ai_generated', default: 'Simple, usage-based pricing' },
      lede:     { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: '' },
    },
    collections: {
      tiers: {
        requirement: 'required',
        fillMode: 'ai_generated',
        constraints: { min: 2, max: 3 },
        fields: {
          id:       { type: 'string', fillMode: 'system' },
          plan:     { type: 'string', fillMode: 'ai_generated', default: '' },
          amount:   { type: 'string', fillMode: 'ai_generated_needs_review', default: '' },
          per:      { type: 'string', fillMode: 'ai_generated', default: '' },
          pitch:    { type: 'string', fillMode: 'ai_generated', default: '' },
          features: { type: 'string[]', fillMode: 'ai_generated', default: [], constraints: { min: 3, max: 6 } },
          cta_text: { type: 'string', fillMode: 'ai_generated', default: 'Start free' },
          featured: { type: 'boolean', fillMode: 'ai_generated', default: false },
        },
      },
    },
  },

  // ===== CTA =====
  // headline may include <em>. The arc + grid are decorative static CSS.
  ArcCTA: {
    sectionType: 'cta',
    elements: {
      eyebrow:            { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: '' },
      headline:           { type: 'string', requirement: 'required', fillMode: 'ai_generated', default: 'Your next deploy takes <em>18 seconds</em>.' },
      body:               { type: 'string', requirement: 'required', fillMode: 'ai_generated', default: '' },
      cta_text:           { type: 'string', requirement: 'required', fillMode: 'ai_generated', default: 'Start free' },
      secondary_cta_text: { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: '' },
    },
  },

  // ===== Footer =====
  // Nested-array columns→links — modeled on the native SegmentedFAQTabs precedent
  // (CollectionDef field of type:'array' with its own fields). Newsletter is static
  // markup with editable placeholder/cta text (no forms wiring in P2).
  HairlineFooter: {
    sectionType: 'footer',
    elements: {
      wordmark:              { type: 'string', requirement: 'required', fillMode: 'ai_generated', default: 'meridian' },
      tag:                   { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: '' },
      newsletter_placeholder:{ type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: 'you@company.com' },
      newsletter_cta:        { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: 'subscribe' },
      copyright:             { type: 'string', requirement: 'required', fillMode: 'ai_generated', default: '© Meridian' },
      location:              { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: '' },
    },
    collections: {
      footer_columns: {
        requirement: 'required',
        fillMode: 'ai_generated',
        constraints: { min: 1, max: 5 },
        fields: {
          id:      { type: 'string', fillMode: 'system' },
          heading: { type: 'string', fillMode: 'ai_generated', default: '' },
          links: {
            type: 'array',
            fillMode: 'ai_generated',
            constraints: { min: 1, max: 6 },
            fields: {
              id:    { type: 'string', fillMode: 'system' },
              label: { type: 'string', fillMode: 'ai_generated', default: '' },
              href:  { type: 'string', fillMode: 'ai_generated', default: '#' },
            },
          },
        },
      },
    },
  },
};

/**
 * Pilot layout names — single source of truth for tests + gallery + block map.
 */
export const MERIDIAN_LAYOUT_NAMES = {
  header:       'MeridianNavHeader',
  hero:         'TerminalHero',
  features:     'HairlineFeatureGrid',
  testimonials: 'ProofWithLogoRail',
  pricing:      'ThreeTierPricing',
  cta:          'ArcCTA',
  footer:       'HairlineFooter',
} as const;

export type MeridianSectionType = keyof typeof MERIDIAN_LAYOUT_NAMES;
