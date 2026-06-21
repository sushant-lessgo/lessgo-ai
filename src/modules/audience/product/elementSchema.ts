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
      cta_href:    { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: '/contact' }, // Phase 4: Book-a-demo target
      signin_text: { type: 'string', requirement: 'required', fillMode: 'ai_generated', default: 'Sign in' },
      signin_url:  { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' }, // Phase 4: Platform login (external)
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
          // Phase 4: optional dropdown (Products mega-item). When present, this
          // nav item renders as a dropdown instead of a plain link.
          children: {
            type: 'array',
            fillMode: 'ai_generated',
            constraints: { min: 0, max: 8 },
            fields: {
              id:    { type: 'string', fillMode: 'system' },
              label: { type: 'string', fillMode: 'ai_generated', default: '' },
              desc:  { type: 'string', fillMode: 'ai_generated', default: '' },
              href:  { type: 'string', fillMode: 'ai_generated', default: '#' },
            },
          },
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
      // Phase 4: multi-column footer — brand blurb + click-to-action contact.
      blurb:                 { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: '' },
      contact_address:       { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      contact_tel:           { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      contact_email:         { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      newsletter_placeholder:{ type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: 'you@company.com' },
      newsletter_cta:        { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: 'subscribe' },
      copyright:             { type: 'string', requirement: 'required', fillMode: 'ai_generated', default: '© Meridian' },
      location:              { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: '' },
      // Phase 4: floating WhatsApp widget (rendered by the footer → every page).
      whatsapp_number:       { type: 'string', requirement: 'optional', fillMode: 'manual_preferred', default: '' },
      whatsapp_prefill:      { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: '' },
      whatsapp_label:        { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: 'Chat with us' },
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
      // Phase 4: social icon links (lucide names).
      socials: {
        requirement: 'optional',
        fillMode: 'manual_preferred',
        constraints: { min: 0, max: 6 },
        fields: {
          id:   { type: 'string', fillMode: 'system' },
          icon: { type: 'string', fillMode: 'manual_preferred', default: 'MessageCircle' }, // Facebook|Linkedin|Youtube|MessageCircle
          url:  { type: 'string', fillMode: 'manual_preferred', default: '#' },
        },
      },
      legal_links: {
        requirement: 'optional',
        fillMode: 'ai_generated',
        constraints: { min: 0, max: 4 },
        fields: {
          id:    { type: 'string', fillMode: 'system' },
          label: { type: 'string', fillMode: 'ai_generated', default: '' },
          href:  { type: 'string', fillMode: 'ai_generated', default: '#' },
        },
      },
    },
  },

  // ===== Collection system (Phase 3) — EDITOR-ONLY blocks =====
  // These two layouts are inserted by the Products panel + archetype builders,
  // NEVER by the generation pipeline (MERIDIAN_PILOT_SECTIONS is untouched).
  // The `items` (catalog) and `related` (detail) collections are fillMode:'system'
  // — they are MATERIALIZED from the product records (see collectionHelpers.ts),
  // never AI-generated, never hand-edited in the block. The Product entry record
  // = ProductDetailRecord's elements + user-edited collections.

  // ----- Catalog (auto-listing collection-list) -----
  ProductCatalogList: {
    sectionType: 'catalog',
    elements: {
      eyebrow:  { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: '' },
      headline: { type: 'string', requirement: 'required', fillMode: 'ai_generated', default: 'The product <em>catalog.</em>' },
      lede:     { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: '' },
    },
    collections: {
      // User-edited: the category groupings (controllers / control / monitors).
      categories: {
        requirement: 'required',
        fillMode: 'manual_preferred',
        constraints: { min: 1, max: 12 },
        fields: {
          id:    { type: 'string', fillMode: 'system' },
          title: { type: 'string', fillMode: 'manual_preferred', default: '' },
          label: { type: 'string', fillMode: 'manual_preferred', default: '' },
        },
      },
      // MATERIALIZED: one card per product page, grouped by categoryId.
      items: {
        requirement: 'optional',
        fillMode: 'system',
        constraints: { min: 0, max: 50 },
        fields: {
          id:         { type: 'string', fillMode: 'system' },
          model:      { type: 'string', fillMode: 'system', default: '' },
          name:       { type: 'string', fillMode: 'system', default: '' },
          oneLiner:   { type: 'string', fillMode: 'system', default: '' },
          image:      { type: 'string', fillMode: 'system', default: '' },
          cardSpec:   { type: 'string', fillMode: 'system', default: '' },
          categoryId: { type: 'string', fillMode: 'system', default: '' },
          href:       { type: 'string', fillMode: 'system', default: '#' },
        },
      },
    },
  },

  // ----- Product detail (the Product entry record, rendered in full) -----
  ProductDetailRecord: {
    sectionType: 'productdetail',
    elements: {
      model:        { type: 'string', requirement: 'required', fillMode: 'ai_generated', default: 'NWC 2000' },
      name:         { type: 'string', requirement: 'required', fillMode: 'ai_generated', default: 'Product name' },
      category:     { type: 'string', requirement: 'required', fillMode: 'manual_preferred', default: '' }, // → catalog category id
      oneLiner:     { type: 'string', requirement: 'required', fillMode: 'ai_generated', default: '' },
      lede:         { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: '' },
      cardSpec:     { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: '' },
      enquireText:  { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: 'Enquire about this product' },
      whatsappText: { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: 'Ask on WhatsApp' },
      note:         { type: 'string', requirement: 'optional', fillMode: 'ai_generated', default: 'Sales-led — we spec the unit to your rooms. No online pricing.' },
    },
    collections: {
      images: {
        requirement: 'required',
        fillMode: 'manual_preferred',
        constraints: { min: 1, max: 12 },
        fields: {
          id:  { type: 'string', fillMode: 'system' },
          src: { type: 'string', fillMode: 'manual_preferred', default: '' },
          tag: { type: 'string', fillMode: 'ai_generated', default: '' },
        },
      },
      badges: {
        requirement: 'optional',
        fillMode: 'ai_generated',
        constraints: { min: 0, max: 2 },
        fields: {
          id:    { type: 'string', fillMode: 'system' },
          label: { type: 'string', fillMode: 'ai_generated', default: '' },
          tone:  { type: 'string', fillMode: 'ai_generated', default: '' }, // '' | 'teal'
        },
      },
      features: {
        requirement: 'optional',
        fillMode: 'ai_generated',
        constraints: { min: 0, max: 8 },
        fields: {
          id:   { type: 'string', fillMode: 'system' },
          text: { type: 'string', fillMode: 'ai_generated', default: '' },
        },
      },
      specs: {
        requirement: 'optional',
        fillMode: 'ai_generated',
        constraints: { min: 0, max: 16 },
        fields: {
          id:    { type: 'string', fillMode: 'system' },
          key:   { type: 'string', fillMode: 'ai_generated', default: '' },
          value: { type: 'string', fillMode: 'ai_generated', default: '' },
        },
      },
      // MATERIALIZED: same-category sibling cards.
      related: {
        requirement: 'optional',
        fillMode: 'system',
        constraints: { min: 0, max: 50 },
        fields: {
          id:         { type: 'string', fillMode: 'system' },
          model:      { type: 'string', fillMode: 'system', default: '' },
          name:       { type: 'string', fillMode: 'system', default: '' },
          oneLiner:   { type: 'string', fillMode: 'system', default: '' },
          image:      { type: 'string', fillMode: 'system', default: '' },
          cardSpec:   { type: 'string', fillMode: 'system', default: '' },
          categoryId: { type: 'string', fillMode: 'system', default: '' },
          href:       { type: 'string', fillMode: 'system', default: '#' },
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
