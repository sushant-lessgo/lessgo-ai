// src/modules/prompt/mockResponseGeneratorService.ts
// Canonical mock responses for the service route. Mirrors
// mockResponseGeneratorV3 sibling. Used when NEXT_PUBLIC_USE_MOCK_GPT=true
// or DEMO_TOKEN bearer is supplied — saves credits during dev iteration.
//
// Pilot only ships one canonical agency-persona response. Phase 6 expands.

import type {
  ServiceStrategyOutputAssembled,
  ServiceUnderstandingInput,
  ServiceAssetInput,
  ServiceGoal,
} from '@/types/service';
import type { SectionCopy } from '@/types/generation';
import { selectServiceSections } from '@/modules/audience/service/sectionSelection';
import { selectServiceUIBlocks } from '@/modules/audience/service/selectUIBlocks';

export interface MockServiceStrategyInput {
  oneLiner: string;
  understanding: ServiceUnderstandingInput;
  goal: ServiceGoal;
  offer: string;
  assets: ServiceAssetInput;
  /** Selection-only — widens the section set for Surge in mock/dev mode. */
  templateId?: string | null;
}

export function generateMockServiceStrategy(
  input: MockServiceStrategyInput
): ServiceStrategyOutputAssembled {
  const sections = selectServiceSections({
    awareness: 'search-aware-comparing',
    goal: input.goal,
    assets: input.assets,
    templateId: (input.templateId as any) ?? null,
  });
  const { uiblocks } = selectServiceUIBlocks({ sections, templateId: (input.templateId as any) ?? null });

  return {
    awareness: 'search-aware-comparing',
    oneClient: {
      who: 'Founder of a DTC brand at $300k–$2M ARR, considering an external studio for a brand refresh.',
      coreDesire: 'A brand identity that feels deliberate and distinctive without taking a quarter to ship.',
      corePain: 'Designers either give cookie-cutter work or quote agency rates with no clear timeline.',
      pains: [
        'Generic visual language',
        'Slow turnaround',
        'Price opacity',
        'Hand-offs that drift from the original brief',
      ],
      desires: [
        'Distinctive identity',
        'Clear timeline',
        'Predictable cost',
        'A studio that understands their category',
      ],
      objections: [
        'Will they understand my brand?',
        'What if I do not like the direction?',
        'How long does this really take?',
      ],
    },
    ourPosition: {
      promise: 'A distinctive brand identity, shipped in six weeks, at a fixed price.',
      approach: 'Strategy-first, founder-collaborative, low-meeting cadence.',
      credibility: 'Multiple DTC brand launches across beauty, food, and lifestyle categories.',
    },
    servicePresentation: {
      format: 'packages',
      showProcess: true,
      showCaseStudies: true,
    },
    sectionDecisions: {
      includeTransformation: false,
      includeProblem: false,
      includeApproach: true,
      isHighTouch: true,
    },
    uiblockDecisions: {
      heroBlock: 'PetalFramedHero',
      servicesBlock: 'IconServiceCards',
      packagesBlock: 'TieredPackages',
      testimonialsBlock: 'PullQuoteWithMark',
      ctaBlock: 'BookCallCTA',
    },
    sections,
    uiblocks,
  };
}

export interface MockServiceCopyInput {
  strategy: ServiceStrategyOutputAssembled;
  uiblocks: Record<string, string>;
  oneLiner: string;
  offer: string;
}

export function generateMockServiceCopy(
  input: MockServiceCopyInput
): Record<string, SectionCopy> {
  const out: Record<string, SectionCopy> = {};

  if (input.uiblocks.header) {
    out.header = {
      elements: {
        logo_text: 'Studio',
        cta_text: 'Book a call',
        nav_items: [
          { id: '', label: 'Work', href: '#work' },
          { id: '', label: 'Services', href: '#services' },
          { id: '', label: 'About', href: '#about' },
        ],
      } as any,
    };
  }

  if (input.uiblocks.hero) {
    out.hero = {
      elements: {
        eyebrow: 'BRAND STUDIO · BROOKLYN',
        headline: 'Brand identity that <em>stays with you</em>.',
        lede: 'A six-week studio engagement for founders who want their brand to feel as deliberate as their product.',
        cta_text: 'Book a call',
        secondary_cta_text: 'See recent work',
      } as any,
    };
  }

  if (input.uiblocks.services) {
    out.services = {
      elements: {
        eyebrow: 'WHAT WE DO',
        headline: 'Three services, one studio.',
        lede: 'Strategy-led, founder-collaborative, fixed-price.',
        services: [
          { id: '', title: 'Brand identity', description: 'A complete identity system, end-to-end, in six weeks.', icon: 'Sparkles', cta_text: 'Learn more' },
          { id: '', title: 'Packaging design', description: 'On-shelf design that earns the second look.', icon: 'Package', cta_text: 'Learn more' },
          { id: '', title: 'Website refresh', description: 'A site that matches the brand you just built.', icon: 'Layout', cta_text: 'Learn more' },
        ],
      } as any,
    };
  }

  if (input.uiblocks.testimonials) {
    out.testimonials = {
      elements: {
        eyebrow: 'KIND WORDS',
        quote: 'They shipped a brand we are proud to grow into.',
        author_name: 'A founder',
        author_role: 'CEO',
        author_company: 'A skincare brand',
      } as any,
    };
  }

  if (input.uiblocks.packages) {
    out.packages = {
      elements: {
        eyebrow: 'ENGAGEMENTS',
        headline: 'Two ways to <em>work together</em>.',
        lede: 'Pick the engagement that matches your stage.',
        packages: [
          {
            id: '',
            name: 'Essential',
            price_display: 'from $8k',
            timeline: '4 weeks',
            features: [
              'Logo and identity system',
              'Two design rounds',
              'Brand guidelines doc',
              'Founder-led kickoff',
            ],
            cta_text: 'Book a call',
            is_featured: false,
          },
          {
            id: '',
            name: 'Studio',
            price_display: 'from $18k',
            timeline: '6 weeks',
            features: [
              'Everything in Essential',
              'Packaging system',
              'Website key art',
              'Launch-ready asset kit',
              'Two months of post-launch support',
            ],
            cta_text: 'Book a call',
            is_featured: true,
          },
        ],
      } as any,
    };
  }

  if (input.uiblocks.cta) {
    out.cta = {
      elements: {
        eyebrow: 'NEXT STEP',
        headline: 'Let us <em>begin</em>.',
        lede: 'A 30-minute call. We listen, we ask questions, we share if we are a fit.',
        cta_text: 'Book a call',
      } as any,
    };
  }

  if (input.uiblocks.footer) {
    out.footer = {
      elements: {
        tagline: 'Quiet design. Loud results.',
        contact_email: 'hello@studio.example',
        copyright: '© Studio',
      } as any,
    };
  }

  return out;
}
