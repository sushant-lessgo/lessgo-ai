// src/modules/audience/service/elementSchema.ts
// V2 element schemas for the service block set (Phase 2 / pilot scope).
// AUDIENCE-LEVEL (7.5d): these field shapes are shared by ALL service templates
// (the 6 block types have the same role-named fields regardless of template), so
// this lives at audience level — importing it must NOT drag any template module
// into the bundle. Reference: docs/architecture/newServiceOnboarding.md §4.
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
      cta_subtext:       { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: '' }, // scale-05: small muted line under primary CTA
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
      whatsapp_number:  { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      whatsapp_label:   { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      whatsapp_prefill: { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      links_heading:    { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: 'Studio' },
      logo_image:       { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
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
      // Editable footer nav column ("Studio"). Empty by default → the block falls
      // back to DEFAULT_FOOTER_LINKS so the footer stays 4-up out of the box.
      footer_links: {
        requirement: 'optional',
        fillMode: 'manual_preferred',
        constraints: { min: 0, max: 6 },
        fields: {
          id:    { type: 'string', fillMode: 'system' },
          label: { type: 'string', fillMode: 'manual_preferred', default: '' },
          href:  { type: 'string', fillMode: 'manual_preferred', default: '#' },
        },
      },
    },
  },

  // ===================================================================
  // ===== LUMEN (bespoke §13) — Kundius Photography ====================
  // 9 Lumen-named layouts, isolated to the `lumen` template (seeded only,
  // never section-selected). Globally-unique names so product schema can't
  // shadow them (PO #2). Bilingual = independent twin `_nl` fields (everything
  // is `manual_preferred`; Lumen bypasses AI generation entirely). Retirement =
  // delete this whole block + the resolveLumenBlock/registry/types entries.
  // `dutch_tagline` on service cards is an always-visible NL subtitle, NOT a twin.
  // ===================================================================
  LumenNav: {
    sectionType: 'header',
    elements: {
      logo_text:     { type: 'string', requirement: 'required', fillMode: 'manual_preferred', default: 'Studio' },
      logo_text_nl:  { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      brand_sub:     { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      brand_sub_nl:  { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      logo_image:    { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      cta_text:      { type: 'string', requirement: 'required', fillMode: 'manual_preferred', default: 'Request a quote' },
      cta_text_nl:   { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
    },
    collections: {
      nav_items: {
        requirement: 'required',
        fillMode: 'manual_preferred',
        constraints: { min: 2, max: 6 },
        fields: {
          id:       { type: 'string', fillMode: 'system' },
          label:    { type: 'string', fillMode: 'manual_preferred', default: '' },
          label_nl: { type: 'string', fillMode: 'manual_preferred', default: '' },
          href:     { type: 'string', fillMode: 'manual_preferred', default: '#' },
        },
      },
    },
  },

  LumenHero: {
    sectionType: 'hero',
    elements: {
      eyebrow:               { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      eyebrow_nl:            { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      headline:              { type: 'string', requirement: 'required', fillMode: 'manual_preferred', default: 'The version of your company that <em>wins the room.</em>' },
      headline_nl:           { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      lede:                  { type: 'string', requirement: 'required', fillMode: 'manual_preferred', default: '' },
      lede_nl:               { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      cta_text:              { type: 'string', requirement: 'required', fillMode: 'manual_preferred', default: 'See recent work' },
      cta_text_nl:           { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      secondary_cta_text:    { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      secondary_cta_text_nl: { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      who_text:              { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      who_text_nl:           { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      badge_text:            { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      badge_text_nl:         { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      fig_caption:           { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      fig_caption_nl:        { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      fig_number:            { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: 'Fig. 01' },
      fig_ratio:             { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '4:5' },
      hero_image:            { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
    },
  },

  LumenLogos: {
    sectionType: 'logos',
    elements: {
      label:    { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      label_nl: { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
    },
    collections: {
      brands: {
        requirement: 'required',
        fillMode: 'manual_preferred',
        constraints: { min: 2, max: 8 },
        fields: {
          id:      { type: 'string', fillMode: 'system' },
          name:    { type: 'string', fillMode: 'manual_preferred', default: '' },
          name_nl: { type: 'string', fillMode: 'manual_preferred', default: '' },
        },
      },
    },
  },

  LumenPricedServiceCards: {
    sectionType: 'services',
    elements: {
      eyebrow:     { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      eyebrow_nl:  { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      headline:    { type: 'string', requirement: 'required', fillMode: 'manual_preferred', default: 'Four ways to <em>photograph your business.</em>' },
      headline_nl: { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      lede:        { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      lede_nl:     { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
    },
    collections: {
      services: {
        requirement: 'required',
        fillMode: 'manual_preferred',
        constraints: { min: 1, max: 6 },
        fields: {
          id:            { type: 'string', fillMode: 'system' },
          name:          { type: 'string', fillMode: 'manual_preferred', default: '' },
          name_nl:       { type: 'string', fillMode: 'manual_preferred', default: '' },
          // Always-visible Dutch subtitle on the card (NOT an NL twin — both show).
          dutch_tagline: { type: 'string', fillMode: 'manual_preferred', default: '' },
          price:         { type: 'string', fillMode: 'manual_preferred', default: '' },
          price_unit:    { type: 'string', fillMode: 'manual_preferred', default: '' },
          price_unit_nl: { type: 'string', fillMode: 'manual_preferred', default: '' },
          pitch:         { type: 'string', fillMode: 'manual_preferred', default: '' },
          pitch_nl:      { type: 'string', fillMode: 'manual_preferred', default: '' },
          cta_text:      { type: 'string', fillMode: 'manual_preferred', default: '' },
          cta_text_nl:   { type: 'string', fillMode: 'manual_preferred', default: '' },
          deliverables: {
            type: 'array',
            fillMode: 'manual_preferred',
            constraints: { min: 1, max: 6 },
            fields: {
              id:      { type: 'string', fillMode: 'system' },
              text:    { type: 'string', fillMode: 'manual_preferred', default: '' },
              text_nl: { type: 'string', fillMode: 'manual_preferred', default: '' },
            },
          },
        },
      },
    },
  },

  LumenShootProcess: {
    sectionType: 'process',
    elements: {
      eyebrow:     { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      eyebrow_nl:  { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      headline:    { type: 'string', requirement: 'required', fillMode: 'manual_preferred', default: 'Simple to book, easy on the day.' },
      headline_nl: { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      lede:        { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      lede_nl:     { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
    },
    collections: {
      steps: {
        requirement: 'required',
        fillMode: 'manual_preferred',
        constraints: { min: 2, max: 5 },
        fields: {
          id:             { type: 'string', fillMode: 'system' },
          step_number:    { type: 'string', fillMode: 'manual_preferred', default: '' },
          title:          { type: 'string', fillMode: 'manual_preferred', default: '' },
          title_nl:       { type: 'string', fillMode: 'manual_preferred', default: '' },
          description:    { type: 'string', fillMode: 'manual_preferred', default: '' },
          description_nl: { type: 'string', fillMode: 'manual_preferred', default: '' },
        },
      },
    },
  },

  LumenCategoryGallery: {
    sectionType: 'portfolio',
    elements: {
      eyebrow:     { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      eyebrow_nl:  { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      headline:    { type: 'string', requirement: 'required', fillMode: 'manual_preferred', default: 'The portfolio, by <em>category.</em>' },
      headline_nl: { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      lede:        { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      lede_nl:     { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
    },
    collections: {
      categories: {
        requirement: 'required',
        fillMode: 'manual_preferred',
        constraints: { min: 1, max: 8 },
        fields: {
          id:             { type: 'string', fillMode: 'system' },
          group:          { type: 'string', fillMode: 'manual_preferred', default: '' },
          group_nl:       { type: 'string', fillMode: 'manual_preferred', default: '' },
          name:           { type: 'string', fillMode: 'manual_preferred', default: '' },
          name_nl:        { type: 'string', fillMode: 'manual_preferred', default: '' },
          index_label:    { type: 'string', fillMode: 'manual_preferred', default: '' },
          index_label_nl: { type: 'string', fillMode: 'manual_preferred', default: '' },
          ratio:          { type: 'string', fillMode: 'manual_preferred', default: 'land' },
          fig:            { type: 'string', fillMode: 'manual_preferred', default: '' },
          cover_image:    { type: 'string', fillMode: 'manual_preferred', default: '' },
          images: {
            type: 'array',
            fillMode: 'manual_preferred',
            constraints: { min: 0, max: 24 },
            fields: {
              id:  { type: 'string', fillMode: 'system' },
              src: { type: 'string', fillMode: 'manual_preferred', default: '' },
            },
          },
        },
      },
    },
  },

  LumenPhotographerAbout: {
    sectionType: 'about',
    elements: {
      eyebrow:               { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      eyebrow_nl:            { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      headline:              { type: 'string', requirement: 'required', fillMode: 'manual_preferred', default: 'I’m a corporate photographer in <em>your city.</em>' },
      headline_nl:           { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      body:                  { type: 'string', requirement: 'required', fillMode: 'manual_preferred', default: '' },
      body_nl:               { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      body2:                 { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      body2_nl:              { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      signature:             { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      cta_text:              { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      cta_text_nl:           { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      secondary_cta_text:    { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      secondary_cta_text_nl: { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      fig_caption:           { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      fig_caption_nl:        { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      fig_number:            { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: 'Fig. 08' },
      about_image:           { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
    },
  },

  LumenContactForm: {
    sectionType: 'contact',
    elements: {
      // Points at a seeded MVPForm in content.forms (fields name/email/message);
      // form.v1.js POSTs to /api/forms/submit. Seeded by buildLumenHomeFinalContent.
      form_id:          { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      eyebrow:          { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      eyebrow_nl:       { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      headline:         { type: 'string', requirement: 'required', fillMode: 'manual_preferred', default: 'Let’s book your <em>shoot.</em>' },
      headline_nl:      { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      lede:             { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      lede_nl:          { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      based_in_label:   { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: 'Based in' },
      based_in_label_nl:{ type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      based_in:         { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      based_in_nl:      { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      phone:            { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      email:            { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      whatsapp_number:  { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      whatsapp_label:   { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: 'WhatsApp' },
      whatsapp_label_nl:{ type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      book_call_url:    { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      book_call_label:  { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: 'Book a call' },
      book_call_label_nl:{ type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      name_label:       { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: 'Name' },
      name_label_nl:    { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      name_ph:          { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: 'Your name' },
      name_ph_nl:       { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      email_label:      { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: 'Email' },
      email_label_nl:   { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      email_ph:         { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: 'you@company.com' },
      email_ph_nl:      { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      message_label:    { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: 'Message' },
      message_label_nl: { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      message_ph:       { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      message_ph_nl:    { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      submit_text:      { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: 'Send enquiry' },
      submit_text_nl:   { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      form_note:        { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      form_note_nl:     { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
    },
  },

  LumenFooter: {
    sectionType: 'footer',
    elements: {
      brand_text:      { type: 'string', requirement: 'required', fillMode: 'manual_preferred', default: 'Studio' },
      brand_text_nl:   { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      brand_sub:       { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      brand_sub_nl:    { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      tagline:         { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      tagline_nl:      { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      contact_line:    { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      contact_line_nl: { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      contact_phone:   { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      contact_email:   { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      copyright:       { type: 'string', requirement: 'required', fillMode: 'manual_preferred', default: '© Studio' },
      copyright_nl:    { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      whatsapp_number: { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      whatsapp_label:  { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      whatsapp_label_nl:{ type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      whatsapp_prefill:{ type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      book_call_url:   { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
    },
    collections: {
      footer_columns: {
        requirement: 'optional',
        fillMode: 'manual_preferred',
        constraints: { min: 0, max: 4 },
        fields: {
          id:         { type: 'string', fillMode: 'system' },
          heading:    { type: 'string', fillMode: 'manual_preferred', default: '' },
          heading_nl: { type: 'string', fillMode: 'manual_preferred', default: '' },
          links: {
            type: 'array',
            fillMode: 'manual_preferred',
            constraints: { min: 0, max: 8 },
            fields: {
              id:       { type: 'string', fillMode: 'system' },
              label:    { type: 'string', fillMode: 'manual_preferred', default: '' },
              label_nl: { type: 'string', fillMode: 'manual_preferred', default: '' },
              href:     { type: 'string', fillMode: 'manual_preferred', default: '#' },
            },
          },
        },
      },
      legal_links: {
        requirement: 'optional',
        fillMode: 'manual_preferred',
        constraints: { min: 0, max: 4 },
        fields: {
          id:       { type: 'string', fillMode: 'system' },
          label:    { type: 'string', fillMode: 'manual_preferred', default: '' },
          label_nl: { type: 'string', fillMode: 'manual_preferred', default: '' },
          href:     { type: 'string', fillMode: 'manual_preferred', default: '#' },
        },
      },
    },
  },

  // ===== Shared template-agnostic LeadForm (scale-05) =====
  // Injected deterministically by seedGoalForm for M1 goals; NOT AI-generated.
  // Mirror of the meridianElementSchema entry so the composed layoutElementSchema
  // resolves `SharedLeadForm` on the service path too (editor gating + publish
  // sanitize). Renders on every template via the shared-block registry.
  SharedLeadForm: {
    sectionType: 'leadForm',
    elements: {
      form_id:       { type: 'string', requirement: 'optional', fillMode: 'system', default: '' },
      form_headline: { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: 'Get in touch' },
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
