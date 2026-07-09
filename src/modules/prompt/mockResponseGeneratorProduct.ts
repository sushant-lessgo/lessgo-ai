// src/modules/prompt/mockResponseGeneratorProduct.ts
// Canonical mock responses for the Meridian product route. Mirror of
// mockResponseGeneratorService.ts. Used when NEXT_PUBLIC_USE_MOCK_GPT=true or
// the DEMO_TOKEN bearer is supplied — enables offline curl verification of the
// full pipeline (incl. recursive collection-id backfill on footer links) with
// no OpenAI call and no credit burn.
//
// Copy items intentionally carry id:"" so processProductCopy's backfill is
// exercised (top-level AND nested footer_columns → links).
//
// scale-07 phase 8b: thing-layout mocks emit the ENGINE-CONTRACT element set
// (elementContracts.ts union), not the per-template layout set — mock == prompt
// == backfill. Concretely the meridian mock also carries vestria-union fields
// (hero tag_text/stamp/values, features kicker, footer link_columns …) and the
// vestria mock carries meridian-union fields (hero status/stats, footer
// wordmark/footer_columns …), so the contract-driven id backfill on union
// collections is exercised offline in both directions. Non-thing layouts
// (techpremium/naayom editor-only blocks) are not produced here and keep the
// layout path.

import type { ProductStrategyOutput } from '@/types/product';
import type { SectionCopy } from '@/types/generation';
import { selectProductSections } from '@/modules/audience/product/sectionSelection';
import { selectProductBlocks } from '@/modules/audience/product/selectBlocks';
import { getPageArchetypesForTemplate } from '@/modules/audience/product/pageArchetypes';
import { clampSitemap } from '@/modules/audience/product/strategy/parseStrategyProduct';

export interface MockProductStrategyInput {
  productName: string;
  oneLiner: string;
  features: string[];
  primaryAudience: string;
  /** Template-aware section/block selection (vestria mock flows). */
  templateId?: string;
  /**
   * Proof hard rule (scale-06 phase 5 — mock parity). Mirrors the REAL path's
   * `assembleProductStrategy({ proof })`: when present + `hasTestimonials` is not
   * true, the testimonials section is dropped so mock-mode / DEMO_TOKEN runs
   * agree with real runs (phase-11 e2e runs mock). Absent ⇒ current behavior.
   */
  proof?: { hasTestimonials?: boolean };
}

export function generateMockMeridianStrategy(
  input: MockProductStrategyInput
): ProductStrategyOutput {
  // Multi-page templates: mock the clamped default sitemap (exercises the gate
  // UI + per-page fan-out offline). assembleProductStrategy's law applies.
  const menu = getPageArchetypesForTemplate(input.templateId);
  let sitemap = menu ? clampSitemap(null, menu) : undefined;

  let sections = sitemap
    ? ['header', ...sitemap[0].sections, 'footer']
    : selectProductSections({ templateId: input.templateId });

  // PROOF HARD RULE parity (matches parseStrategyProduct.proofDroppedSections):
  // unpromised testimonials ⇒ section absent from BOTH sections and the sitemap,
  // BEFORE block selection so uiblocks drop it too.
  if (input.proof && input.proof.hasTestimonials !== true) {
    sections = sections.filter((s) => s !== 'testimonials');
    if (sitemap) {
      sitemap = sitemap.map((p) => ({
        ...p,
        sections: p.sections.filter((s) => s !== 'testimonials'),
      }));
    }
  }

  const { uiblocks } = selectProductBlocks({ sections, templateId: input.templateId });

  return {
    ...(sitemap ? { sitemap } : {}),
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
  // Vestria layouts → vestria-shaped mock (element keys differ per template family).
  if (input.uiblocks.hero?.startsWith('Vestria') || input.uiblocks.header?.startsWith('Vestria')) {
    return generateMockVestriaCopy(input);
  }

  const out: Record<string, SectionCopy> = {};

  if (input.uiblocks.header) {
    out.header = {
      elements: {
        logo_text: 'meridian',
        // Contract-union fields (vestria header schema, optional under thing):
        logo_mark_text: 'Deploys',
        util_note: 'Shipping since 2021',
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
        // Contract-union fields (vestria hero schema, optional under thing):
        tag_text: 'Deploy Platform · Cloud',
        stamp_value: '18s',
        stamp_label: 'median deploy',
        stats: [
          { id: '', value: '18s', label: 'median deploy' },
          { id: '', value: '99.99%', label: 'uptime' },
          { id: '', value: '1', label: 'keystroke rollback' },
        ],
        // Contract-union collection (vestria `values`) — exercises the
        // contract-driven id backfill on a union collection.
        values: [
          { id: '', kicker: '01 — Speed', title: 'Atomic Deploys', description: 'Every push reversible in one step.' },
          { id: '', kicker: '02 — Calm', title: 'Quiet On-Call', description: 'Rollbacks are one keystroke.' },
          { id: '', kicker: '03 — Flow', title: 'Zero YAML', description: 'Connect a repo and push.' },
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
          // `kicker` = contract-union field (vestria features shape).
          { id: '', title: 'Atomic deploys', description: 'Every push is reversible in one step.', icon: 'Rocket', link_text: 'read ↗', kicker: 'CAP / 01' },
          { id: '', title: 'Instant rollbacks', description: 'Roll back to any prior build instantly.', icon: 'RotateCcw', link_text: 'read ↗', kicker: 'CAP / 02' },
          { id: '', title: 'Build caching', description: 'Cached layers cut build times to seconds.', icon: 'Layers', link_text: 'read ↗', kicker: 'CAP / 03' },
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
        // Contract-union fields (vestria footer schema, optional under thing):
        blurb: 'Deploys, rollbacks and caching for shipping teams.',
        tagline: 'Ship daily. Sleep nightly.',
        link_columns: [
          { id: '', heading: 'Resources', links: [ { id: '', label: 'Changelog', href: '#' }, { id: '', label: 'Status', href: '#' } ] },
        ],
      } as any,
    };
  }

  return out;
}

/**
 * Vestria (tailored-trade) mock copy — a fictional joinery workshop, matching
 * the vestria element schemas. Ids intentionally "" to exercise backfill.
 */
function generateMockVestriaCopy(input: MockProductCopyInput): Record<string, SectionCopy> {
  const out: Record<string, SectionCopy> = {};
  const u = input.uiblocks;

  if (u.header) {
    out.header = {
      elements: {
        logo_text: input.productName || 'Vestria',
        logo_mark_text: 'Workshop',
        cta_text: 'Request a Quote',
        cta_href: '#contact',
        secondary_cta_text: 'Catalogue',
        secondary_cta_href: '#catalog',
        util_note: 'Manufacturing since 2009',
        // Contract-union field (meridian header schema, required under thing):
        signin_text: 'Client login',
        nav_items: [
          { id: '', label: 'Industries', href: '#industries' },
          { id: '', label: 'About', href: '#about' },
          { id: '', label: 'Services', href: '#features' },
          { id: '', label: 'Catalogue', href: '#catalog' },
        ],
      } as any,
    };
  }

  if (u.hero) {
    out.hero = {
      elements: {
        tag_text: 'Commercial Joinery · Northeast',
        headline: 'Fit-outs built to <em>outlast the lease.</em>',
        lede: 'From boutique counters to full hotel refits — designed, machined and installed to your spec, on your programme.',
        cta_text: 'Request a Quote',
        cta_href: '#contact',
        secondary_cta_text: 'View Catalogue',
        secondary_cta_href: '#catalog',
        stamp_value: '300+',
        stamp_label: 'Projects delivered',
        // Contract-union fields (meridian hero schema, optional under thing):
        status_text: 'Est. 2009 · Full-service workshop',
        stats: [
          { id: '', value: '300+', label: 'projects delivered' },
          { id: '', value: '2009', label: 'founded' },
        ],
        values: [
          { id: '', kicker: '01 — Precision', title: 'Millimetre Tolerances', description: 'CNC-machined panels checked against drawings before dispatch.' },
          { id: '', kicker: '02 — Programme', title: 'On-Site On Time', description: 'Install crews scheduled around your trades.' },
          { id: '', kicker: '03 — Partnership', title: 'One Point of Contact', description: 'A named project manager from survey to snag list.' },
        ],
      } as any,
    };
  }

  if (u.trust) {
    out.trust = {
      elements: {
        label_text: 'Trusted by operators across the region',
        logos: [],
      } as any,
    };
  }

  if (u.industries) {
    out.industries = {
      elements: {
        eyebrow: 'Our Core Industries',
        headline: 'Joinery for every floor you run.',
        lede: 'Sector-specific programmes built to each environment’s standards.',
        industries: [
          { id: '', kicker: 'Sector 01', title: 'Hospitality', description: 'Reception desks, bars and back-of-house.' },
          { id: '', kicker: 'Sector 02', title: 'Retail', description: 'Counters, shelving and window displays.' },
          { id: '', kicker: 'Sector 03', title: 'Workplace', description: 'Meeting rooms, storage walls and booths.' },
        ],
      } as any,
    };
  }

  if (u.about) {
    out.about = {
      elements: {
        eyebrow: 'About the Workshop',
        headline: 'Craft at production scale.',
        lede: 'From a single bench in 2009 to a full-service workshop.',
        body: 'Every programme runs on the same foundations — considered materials, precise machining and an accountable install.',
        stats: [
          { id: '', value: '2009', label: 'Founded' },
          { id: '', value: '300+', label: 'Projects' },
        ],
      } as any,
    };
  }

  if (u.features) {
    out.features = {
      elements: {
        eyebrow: 'Our Services',
        headline: 'Services that separate us.',
        lede: 'From first sketch to final snag.',
        features: [
          // `link_text` = contract-union field (meridian features shape).
          { id: '', kicker: 'SVC / 01', title: 'Design & Drawings', description: 'Shop drawings for sign-off before cutting.', link_text: 'more ↗' },
          { id: '', kicker: 'SVC / 02', title: 'CNC Manufacture', description: 'In-house machining with batch QC.', link_text: 'more ↗' },
          { id: '', kicker: 'SVC / 03', title: 'Installation', description: 'Fitted, snagged and handed over clean.', link_text: 'more ↗' },
        ],
      } as any,
    };
  }

  if (u.catalog) {
    out.catalog = {
      elements: {
        eyebrow: 'The Catalogue',
        headline: 'A build for every brief.',
        cta_text: 'Request full catalogue (PDF)',
        cta_href: '#contact',
        items: [
          { id: '', code: 'J-01', title: 'Reception Counter', category: 'Hospitality · Oak veneer', glyph: 'Counter' },
          { id: '', code: 'J-02', title: 'Storage Wall', category: 'Workplace · Laminate', glyph: 'Storage' },
          { id: '', code: 'J-03', title: 'Retail Gondola', category: 'Retail · Birch ply', glyph: 'Gondola' },
          { id: '', code: 'J-04', title: 'Banquette Seating', category: 'Hospitality · Upholstered', glyph: 'Seating' },
        ],
      } as any,
    };
  }

  if (u.materials) {
    out.materials = {
      elements: {
        eyebrow: 'Materials & Finishes',
        headline: 'Material chosen for the work.',
        lede: 'Stock finishes plus made-to-order veneers.',
        swatches: [
          { id: '', name: 'Oak Veneer', code: '/ 01' },
          { id: '', name: 'Walnut', code: '/ 02' },
          { id: '', name: 'Birch Ply', code: '/ 03' },
        ],
        rows: [
          { id: '', name: 'Oak Veneer', use: 'Front-of-house — warm, durable' },
          { id: '', name: 'Compact Laminate', use: 'High-traffic worktops' },
          { id: '', name: 'Birch Ply', use: 'Exposed-edge retail fittings' },
        ],
      } as any,
    };
  }

  if (u.process) {
    out.process = {
      elements: {
        eyebrow: 'How We Work',
        headline: 'From survey to sign-off, one team.',
        steps: [
          { id: '', kicker: 'Step 01', title: 'Survey', description: 'We measure on site.' },
          { id: '', kicker: 'Step 02', title: 'Drawings', description: 'Sign-off before cutting.' },
          { id: '', kicker: 'Step 03', title: 'Manufacture', description: 'Machined in-house, batch QC.' },
          { id: '', kicker: 'Step 04', title: 'Install', description: 'Fitted and handed over clean.' },
        ],
      } as any,
    };
  }

  if (u.testimonials) {
    out.testimonials = {
      elements: {
        eyebrow: 'In Their Words',
        headline: 'Clients who stopped shopping around.',
        testimonials: [
          { id: '', quote: 'The counters arrived exactly to drawing and the install was done overnight.', author_name: 'An operations director', author_role: 'Hotel group' },
          { id: '', quote: 'One point of contact from survey to snag list — refreshingly boring.', author_name: 'A project lead', author_role: 'Retail fit-out' },
        ],
      } as any,
    };
  }

  if (u.contact) {
    out.contact = {
      elements: {
        tag_text: 'Request a Quote',
        headline: 'Tell us what you’re fitting out.',
        lede: 'Share the scope and a named estimator replies within one business day.',
        form_note: 'We reply within 1 business day.',
        assurances: [
          { id: '', kicker: '01', text: 'No obligation — quotes are complimentary.' },
          { id: '', kicker: '02', text: 'Site surveys within one week of enquiry.' },
        ],
      } as any,
    };
  }

  if (u.footer) {
    out.footer = {
      elements: {
        brand_text: input.productName || 'Vestria',
        blurb: 'Design, manufacture and installation for professional interiors.',
        address_heading: 'Get in Touch',
        copyright: `© ${input.productName || 'Vestria'} — All rights reserved.`,
        tagline: 'Built to outlast the lease.',
        // Contract-union fields (meridian footer schema, required under thing):
        wordmark: input.productName || 'Vestria',
        footer_columns: [
          { id: '', heading: 'Workshop', links: [
            { id: '', label: 'About', href: '#about' },
            { id: '', label: 'Process', href: '#process' },
          ] },
        ],
        link_columns: [
          { id: '', heading: 'Explore', links: [
            { id: '', label: 'Industries', href: '#industries' },
            { id: '', label: 'Services', href: '#features' },
            { id: '', label: 'Catalogue', href: '#catalog' },
          ] },
        ],
      } as any,
    };
  }

  return out;
}
