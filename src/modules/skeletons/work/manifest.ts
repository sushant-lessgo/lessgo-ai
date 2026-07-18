// src/modules/skeletons/work/manifest.ts
// Work-skeleton block manifest — PURE DATA (scale-09 D18 shape). Declares, per
// section type, the copy-compatible layout variants + the default. Shared by every
// work SKIN (atelier today) since the skeleton owns the markup and skins only
// swap tokens — so ONE manifest describes the whole skeleton's block surface.
//
// FIREWALL: imports ONLY the manifest TYPES (erased) — no component, no schema, no
// resolver. `consumes` keys are hard-coded from the FROZEN work-core contract
// (src/modules/engines/workSections.ts → workElementContract). Conformance proves
// consumes ⊆ contractFor(layoutName) (the work layout schemas reach
// serviceElementSchema via the audience/work spread).
//
// COLLECTION MACHINERY (E2 / phase 2): the `workcatalog` (`/works` index) and
// `workdetail` (`/works/<slug>` project page) sections are DELIBERATELY absent from
// this manifest. They are not arrangement variants offered in the section picker —
// they are collection-fan-out machinery, resolved by SECTION TYPE (resolveWorkBlock)
// and evidenced by the conformance (b)/(b+)/(d) capability walks, never by the
// manifest's variant/distinctness (c)/(e) grammar. (Same as every other template's
// catalog/detail pair — no template lists them in its block manifest.) The blocks
// themselves register in `resolveWorkBlock.ts`; the LLM-free photo fan-out that
// fills them lives in `generation/workCollections.ts` (see those headers). The
// `works` capability that lights them up is declared on `atelier` ONLY.
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
const CONTACT_CONSUMES = ['eyebrow', 'heading', 'lead', 'contact_method', 'form_ref', 'cta_label'];
const FOOTER_CONSUMES = ['eyebrow', 'heading', 'note', 'copyright'];
const PACKAGES_CONSUMES = ['eyebrow', 'heading', 'lead'];
const ABOUT_CONSUMES = ['eyebrow', 'heading', 'bio'];
const FAQ_CONSUMES = ['eyebrow', 'heading'];
const RESULTS_CONSUMES = ['eyebrow', 'heading', 'lead'];

// PROOF shapes read DIFFERENT collections (quotes / logos / metrics), so they are
// CONTENT-EXCLUSIVE: each carries a DISTINCT `copyShape` (never blind-swapped) AND a
// DISJOINT single scalar `consumes` (each owns one scalar the others lack) so the
// conformance both-ways-hidden consistency check (e) passes — a swap into any shape
// from another's content is runtime-hidden (would drop that scalar). Available proof
// scalars are only {eyebrow, heading, awards_line} and logos/results contracts lack
// awards_line, so the disjoint assignment below is FORCED: testimonials=awards_line,
// logos=eyebrow, results=heading.
const PROOF_TESTIMONIALS_CONSUMES = ['awards_line'];
const PROOF_LOGOS_CONSUMES = ['eyebrow'];
const PROOF_RESULTS_CONSUMES = ['heading'];

export const workSkeletonManifest: TemplateBlockManifest = {
  header: {
    // FIVE arrangements share ONE dispatcher (WorkHeader) — internal dispatch. The
    // 4 non-default arrangements are `internalDispatch: true` so the conformance
    // distinctness guard asserts they resolve to the SAME component as the default
    // (they are a pure CSS re-flow of the same DOM, keyed off the stored layout).
    default: 'WorkHeader',
    variants: [
      {
        layoutName: 'WorkHeader',
        label: 'Nav header',
        blurb: 'Logo · nav · CTA — the default header arrangement.',
        consumes: HEADER_CONSUMES,
      },
      {
        layoutName: 'WorkHeaderStart',
        label: 'Left-grouped nav',
        blurb: 'Logo left with the nav grouped beside it · CTA right.',
        consumes: HEADER_CONSUMES,
        internalDispatch: true,
      },
      {
        layoutName: 'WorkHeaderCentered',
        label: 'Centered logo',
        blurb: 'Centered wordmark · nav left · CTA right (editorial).',
        consumes: HEADER_CONSUMES,
        internalDispatch: true,
      },
      {
        layoutName: 'WorkHeaderSplit',
        label: 'Nav-right',
        blurb: 'Logo left · nav + CTA grouped on the right.',
        consumes: HEADER_CONSUMES,
        internalDispatch: true,
      },
      {
        layoutName: 'WorkHeaderMinimal',
        label: 'Minimal',
        blurb: 'Logo + CTA only — nav hidden.',
        consumes: HEADER_CONSUMES,
        internalDispatch: true,
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
      {
        layoutName: 'WorkHeroImage',
        label: 'Image cover',
        blurb: 'Full-bleed still-image cover with centered content.',
        consumes: HERO_CONSUMES,
        requiresAssets: ['photos'],
      },
      {
        layoutName: 'WorkHeroSplit',
        label: 'Split poster',
        blurb: 'Text left · portrait right (editorial poster).',
        consumes: HERO_CONSUMES,
        requiresAssets: ['photos'],
      },
      {
        layoutName: 'WorkHeroCenter',
        label: 'Centered type',
        blurb: 'Centered typographic hero — no media.',
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
      {
        layoutName: 'WorkGalleryMasonry',
        label: 'Masonry',
        blurb: 'CSS-columns collage of group covers (varied heights).',
        consumes: GALLERY_CONSUMES,
      },
      {
        layoutName: 'WorkGalleryStrip',
        label: 'Strip',
        blurb: 'Horizontal scroll row of group covers.',
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
        consumes: PROOF_TESTIMONIALS_CONSUMES,
        copyShape: 'proof-testimonials',
      },
      {
        layoutName: 'WorkProofLogos',
        label: 'Client logos',
        blurb: 'A logo wall (reads the `logos` collection — content-exclusive).',
        consumes: PROOF_LOGOS_CONSUMES,
        copyShape: 'proof-logos',
        requiresAssets: ['logos'],
      },
      {
        layoutName: 'WorkProofResults',
        label: 'Results',
        blurb: 'Big-number metrics (reads the `metrics` collection — content-exclusive).',
        consumes: PROOF_RESULTS_CONSUMES,
        copyShape: 'proof-results',
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
  packages: {
    default: 'WorkPackages',
    variants: [
      {
        layoutName: 'WorkPackages',
        label: 'Packages',
        blurb: 'Priced-services card grid — price_mode-aware (exact / from / on-request).',
        consumes: PACKAGES_CONSUMES,
      },
    ],
  },
  about: {
    default: 'WorkAbout',
    variants: [
      {
        layoutName: 'WorkAbout',
        label: 'About',
        blurb: 'Two-column story — eyebrow/heading + bio and an optional facts strip.',
        consumes: ABOUT_CONSUMES,
      },
    ],
  },
  faq: {
    default: 'WorkFaq',
    variants: [
      {
        layoutName: 'WorkFaq',
        label: 'FAQ',
        blurb: 'Question/answer list (static — no disclosure JS).',
        consumes: FAQ_CONSUMES,
      },
    ],
  },
  results: {
    default: 'WorkResults',
    variants: [
      {
        layoutName: 'WorkResults',
        label: 'Results',
        blurb: 'Standalone big-number outcomes grid (optional section).',
        consumes: RESULTS_CONSUMES,
      },
    ],
  },
};
