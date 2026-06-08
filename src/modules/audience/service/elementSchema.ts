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
} as const;

export type PilotSectionType = keyof typeof PILOT_LAYOUT_NAMES;
