// src/modules/skeletons/work/manifest.ts
// Work-skeleton block manifest — PURE DATA (scale-09 D18 shape). Declares, per
// section type, the copy-compatible layout variants + the default. Shared by every
// work SKIN (atelier2 today) since the skeleton owns the markup and skins only
// swap tokens — so ONE manifest describes the whole skeleton's block surface.
//
// FIREWALL: imports ONLY the manifest TYPES (erased) — no component, no schema, no
// resolver. `consumes` keys are hard-coded from the FROZEN work-core contract
// (src/modules/engines/workSections.ts → workElementContract). Conformance proves
// consumes ⊆ contractFor(layoutName) (the work layout schemas reach
// serviceElementSchema via the audience/work spread).
//
// Phase 3: hero only — `WorkHeroSlider` (the built default) + `WorkHeroVideo` (a
// declared-but-NOT-built SLOT: a future video-bg hero, capability reserved, built
// on first demand). The slot is skipped by every conformance walk (phase 1) and is
// never the default (INVARIANT). Remaining sections land in phases 4/6/7.

import type { TemplateBlockManifest } from '@/modules/templates/blockManifest';

// Consumed SCALAR keys per section (workElementContract.<section>). Collections
// (nav_links/groups/quotes/socials) are omitted — consumes lists only scalar
// element keys (hero precedent), which must be ⊆ the section's contract keys.
const HERO_CONSUMES = ['role_line', 'name', 'quote', 'portrait_image', 'cta_label', 'cta_href'];
const HEADER_CONSUMES = ['logo_text', 'cta_label', 'cta_href'];
const GALLERY_CONSUMES = ['eyebrow', 'heading', 'lead'];
const PROOF_CONSUMES = ['eyebrow', 'heading', 'awards_line'];
const CONTACT_CONSUMES = ['eyebrow', 'heading', 'lead', 'contact_method', 'form_ref', 'cta_label'];
const FOOTER_CONSUMES = ['eyebrow', 'heading', 'note', 'copyright'];

export const workSkeletonManifest: TemplateBlockManifest = {
  header: {
    default: 'WorkHeader',
    variants: [
      {
        layoutName: 'WorkHeader',
        label: 'Nav header',
        blurb: 'Logo · nav · CTA — the default header arrangement.',
        consumes: HEADER_CONSUMES,
      },
    ],
  },
  hero: {
    default: 'WorkHeroSlider',
    variants: [
      {
        layoutName: 'WorkHeroSlider',
        label: 'Cover slider',
        blurb: 'Full-bleed cover hero — the work baseline.',
        consumes: HERO_CONSUMES,
      },
      // SLOT — declared capability, NO component yet (built on first demand). Never
      // offered, never generated, never the default. Skipped by conformance walks.
      {
        layoutName: 'WorkHeroVideo',
        label: 'Video cover',
        blurb: 'Full-bleed autoplay video hero (capability reserved).',
        consumes: HERO_CONSUMES,
        slot: true,
      },
    ],
  },
  work: {
    default: 'WorkGalleryGrid',
    variants: [
      {
        layoutName: 'WorkGalleryGrid',
        label: 'Gallery grid',
        blurb: 'Group-reference grid (category covers) — the work baseline.',
        consumes: GALLERY_CONSUMES,
      },
    ],
  },
  proof: {
    default: 'WorkProofTestimonials',
    variants: [
      {
        layoutName: 'WorkProofTestimonials',
        label: 'Testimonials',
        blurb: 'Verbatim client quotes — the default proof shape.',
        consumes: PROOF_CONSUMES,
      },
    ],
  },
  contact: {
    default: 'WorkContact',
    variants: [
      {
        layoutName: 'WorkContact',
        label: 'Contact',
        blurb: 'contact_method-aware: lead form, or a CTA link to WhatsApp/booking/call.',
        consumes: CONTACT_CONSUMES,
      },
    ],
  },
  footer: {
    default: 'WorkFooter',
    variants: [
      {
        layoutName: 'WorkFooter',
        label: 'Footer',
        blurb: 'Closing band — heading, note, socials, copyright.',
        consumes: FOOTER_CONSUMES,
      },
    ],
  },
};
