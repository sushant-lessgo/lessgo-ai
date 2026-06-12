// src/modules/prompt/mockResponseGeneratorProduct.ts
// Canonical mock responses for the Meridian product route. Mirror of
// mockResponseGeneratorService.ts. Used when NEXT_PUBLIC_USE_MOCK_GPT=true or
// the DEMO_TOKEN bearer is supplied — enables offline curl verification of the
// full pipeline (incl. recursive collection-id backfill on footer links) with
// no OpenAI call and no credit burn.
//
// Copy items intentionally carry id:"" so processProductCopy's backfill is
// exercised (top-level AND nested footer_columns → links).

import type { ProductStrategyOutput } from '@/types/product';
import type { SectionCopy } from '@/types/generation';
import { selectProductSections } from '@/modules/audience/product/sectionSelection';
import { selectProductBlocks } from '@/modules/audience/product/selectBlocks';

export interface MockProductStrategyInput {
  productName: string;
  oneLiner: string;
  features: string[];
  primaryAudience: string;
}

export function generateMockMeridianStrategy(
  input: MockProductStrategyInput
): ProductStrategyOutput {
  const sections = selectProductSections();
  const { uiblocks } = selectProductBlocks({ sections });

  return {
    awareness: 'solution-aware-skeptical',
    oneReader: {
      personaDescription:
        'Staff/lead engineer at a 10-50 person startup who owns deploys and is tired of babysitting CI/CD.',
      pain: [
        'Deploys are slow and flaky',
        'Rollbacks are scary and manual',
        'Too much YAML and glue code',
        'On-call gets paged for infra, not bugs',
      ],
      desire: [
        'Push and it just ships',
        'One-keystroke rollback',
        'Predictable, fast pipelines',
        'Less infra babysitting',
      ],
      objections: [
        'We already have a pipeline that mostly works',
        'Migration will eat a sprint',
        'Lock-in concerns',
      ],
    },
    oneIdea: {
      bigBenefit: 'Ship daily without thinking about the pipeline.',
      uniqueMechanism: 'Build caching + atomic deploys that make every push reversible in one step.',
      reasonToBelieve: 'Used in production by fast-shipping engineering teams.',
    },
    featureAnalysis: (input.features.length ? input.features : ['Auto deploys', 'Instant rollbacks']).map(
      (f) => ({
        feature: f,
        benefit: `${f} without manual setup`,
        benefitOfBenefit: 'Engineers stay in flow and ship more.',
      })
    ),
    sections,
    uiblocks,
  };
}

export interface MockProductCopyInput {
  strategy: ProductStrategyOutput;
  uiblocks: Record<string, string>;
  productName: string;
  oneLiner: string;
  offer: string;
}

export function generateMockMeridianCopy(
  input: MockProductCopyInput
): Record<string, SectionCopy> {
  const out: Record<string, SectionCopy> = {};

  if (input.uiblocks.header) {
    out.header = {
      elements: {
        logo_text: 'meridian',
        cta_text: 'Start free',
        signin_text: 'Sign in',
        nav_items: [
          { id: '', label: 'Features', href: '#features' },
          { id: '', label: 'Pricing', href: '#pricing' },
          { id: '', label: 'Docs', href: '#docs' },
        ],
      } as any,
    };
  }

  if (input.uiblocks.hero) {
    out.hero = {
      elements: {
        status_text: 'v2.0 · NOW IN GA',
        audience_tag: 'Built for engineers',
        headline: 'Ship on Friday. Sleep on <em>Saturday</em>.',
        lede: 'A deploy platform for teams that ship daily and refuse to babysit infrastructure.',
        cta_text: 'Start free',
        secondary_cta_text: 'Read the docs',
        caption: 'No credit card required',
        stats: [
          { id: '', value: '18s', label: 'median deploy' },
          { id: '', value: '99.99%', label: 'uptime' },
          { id: '', value: '1', label: 'keystroke rollback' },
        ],
      } as any,
    };
  }

  if (input.uiblocks.features) {
    out.features = {
      elements: {
        eyebrow: 'CAPABILITIES',
        headline: 'Everything you need to ship',
        lede: 'Push a repo and watch it go live.',
        features: [
          { id: '', title: 'Atomic deploys', description: 'Every push is reversible in one step.', icon: 'Rocket', link_text: 'read ↗' },
          { id: '', title: 'Instant rollbacks', description: 'Roll back to any prior build instantly.', icon: 'RotateCcw', link_text: 'read ↗' },
          { id: '', title: 'Build caching', description: 'Cached layers cut build times to seconds.', icon: 'Layers', link_text: 'read ↗' },
        ],
      } as any,
    };
  }

  if (input.uiblocks.testimonials) {
    out.testimonials = {
      elements: {
        eyebrow: 'PROOF',
        headline: 'Loved by fast teams',
        testimonials: [
          { id: '', quote: 'We cut deploy time from minutes to seconds and stopped fearing releases.', author_name: 'A platform lead', author_role: 'Series A startup' },
          { id: '', quote: 'Rollbacks are one keystroke. On-call got quieter overnight.', author_name: 'An SRE', author_role: 'Fintech' },
        ],
        logos: [
          { id: '', name: 'Northwind' },
          { id: '', name: 'Acme' },
          { id: '', name: 'Globex' },
        ],
      } as any,
    };
  }

  if (input.uiblocks.pricing) {
    out.pricing = {
      elements: {
        eyebrow: 'PRICING',
        headline: 'Simple, usage-based pricing',
        lede: 'Start free. Scale when you do.',
        tiers: [
          { id: '', plan: 'Hobby', amount: '$0', per: '/mo', pitch: 'For side projects', features: ['1 project', 'Community support', 'Auto HTTPS'], cta_text: 'Start free', featured: false },
          { id: '', plan: 'Team', amount: '$20', per: '/seat/mo', pitch: 'For shipping teams', features: ['Unlimited projects', 'Instant rollbacks', 'Priority support', 'SSO'], cta_text: 'Start free', featured: true },
          { id: '', plan: 'Enterprise', amount: 'Custom', per: '', pitch: 'For scale', features: ['SLA', 'Dedicated support', 'Audit logs'], cta_text: 'Contact us', featured: false },
        ],
      } as any,
    };
  }

  if (input.uiblocks.cta) {
    out.cta = {
      elements: {
        eyebrow: 'GET STARTED',
        headline: 'Your next deploy takes <em>18 seconds</em>.',
        body: 'Connect a repo and push. We handle the rest.',
        cta_text: 'Start free',
        secondary_cta_text: 'Talk to us',
      } as any,
    };
  }

  if (input.uiblocks.footer) {
    out.footer = {
      elements: {
        wordmark: 'meridian',
        tag: 'Deploy without the babysitting.',
        newsletter_placeholder: 'you@company.com',
        newsletter_cta: 'subscribe',
        copyright: '© Meridian',
        location: 'San Francisco, CA',
        footer_columns: [
          { id: '', heading: 'Product', links: [ { id: '', label: 'Features', href: '#' }, { id: '', label: 'Pricing', href: '#' }, { id: '', label: 'Docs', href: '#' } ] },
          { id: '', heading: 'Company', links: [ { id: '', label: 'About', href: '#' }, { id: '', label: 'Blog', href: '#' } ] },
        ],
      } as any,
    };
  }

  return out;
}
