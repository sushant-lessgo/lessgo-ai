// src/modules/templates/blockMocks/meridian.ts
// CANONICAL home for Meridian block mocks (template-factory phase 2). Moved here
// verbatim from `src/app/dev/meridian/blocks/mockContent.ts` (which is now a thin
// re-export so `MeridianBlocksStage.tsx` keeps working) so ONE source feeds:
//   - the /dev/meridian/blocks visual gallery,
//   - `renderParity.meridian.test.tsx` (dual-renderer content parity),
//   - the `templateConformance` editor-basics subset (this phase),
//   - the phase-7 screenshot parity harness.
//
// Hand-authored design-reference content for the 7 Meridian pilot blocks,
// transcribed from "Meridian - Modern Tech.html". Used because
// generateMockFromSchema does NOT populate nested-array fields (tier features,
// footer column links) — those need real content here.

import type { EditBasicsExpectation } from './index';

export interface MeridianMockEntry {
  sectionType: string;
  layout: string;
  content: Record<string, any>;
  // scale-04 (phase 8): optional per-element metadata carrying the NEW `cta`
  // shape (CTAButton). Kept OUTSIDE `content` on purpose so the content-parity
  // extractor (visibleFields) never treats a `dest`/`GOAL_REF` value as visible
  // copy. Consumed only by the href-parity assertions (renderParity.meridian
  // test), which run it through the phase-3 normalizeCtas pre-pass exactly as the
  // published renderer does. The /dev gallery ignores this field.
  elementMetadata?: Record<string, any>;
}

export const MERIDIAN_BLOCK_MOCKS: MeridianMockEntry[] = [
  {
    sectionType: 'header',
    layout: 'MeridianNavHeader',
    content: {
      logo_text: 'meridian',
      signin_text: 'Sign in',
      cta_text: 'Start free',
      logo_image: '',
      // scale-04 parity cases: n1 = a NEW Link object (source:'manual'); n5 =
      // a string-legacy internal path; n2 = a string-legacy anchor. Both shapes
      // must dual-read to the SAME href in edit + published (nav emits real
      // anchors on both sides).
      nav_items: [
        { id: 'n1', label: 'Product', href: { dest: { kind: 'external', url: 'https://docs.meridian.dev' }, source: 'manual' } },
        { id: 'n2', label: 'Docs', href: '#docs' },
        { id: 'n3', label: 'Customers', href: '#' },
        { id: 'n4', label: 'Changelog', href: '#' },
        { id: 'n5', label: 'Pricing', href: '/pricing' },
      ],
    },
    // Header CTA buttons carry the NEW cta shape: primary = explicit external
    // dest; signin (secondary) = explicit section anchor. Neither is GOAL_REF, so
    // they resolve independent of the project goal.
    elementMetadata: {
      cta_text: { cta: { role: 'primary', dest: { kind: 'external', url: 'https://app.meridian.dev/signup' } } },
      signin_text: { cta: { role: 'secondary', dest: { kind: 'section', anchor: 'signin' } } },
    },
  },
  {
    sectionType: 'hero',
    layout: 'TerminalHero',
    content: {
      status_text: 'v4.2 · shipping now',
      audience_tag: 'for engineering teams',
      headline: 'Ship on Friday.<br>Sleep on <em>Saturday</em>',
      lede: "Meridian is the deployment layer for teams who don't want a status page. Preview every change, revert any commit, roll out when the graph says so.",
      cta_text: 'Start building',
      secondary_cta_text: 'Read the docs',
      caption: 'no credit card · 14 day trial',
      stats: [
        { id: 's1', value: '48ms', label: 'p50 deploy' },
        { id: 's2', value: '99.995%', label: 'region uptime' },
        { id: 's3', value: '14,200', label: 'teams shipping' },
        { id: 's4', value: 'SOC 2 · HIPAA', label: 'compliance' },
      ],
    },
  },
  {
    sectionType: 'features',
    layout: 'HairlineFeatureGrid',
    content: {
      eyebrow: 'capabilities',
      headline: 'A deploy loop that fits in your head.',
      lede: 'Every commit ships to a real URL. Every URL has a graph behind it. You decide when it becomes production.',
      features: [
        { id: 'f1', icon: 'Layers', title: 'Preview per commit', description: 'A real URL for every branch, every PR, every pushed fix. Your designer and your PM see the same thing you do.', link_text: 'read ↗' },
        { id: 'f2', icon: 'RotateCcw', title: 'Instant rollback', description: 'Revert to any deploy in under a second. Not a rebuild — a pointer flip at the edge. The graph tells you what changed.', link_text: 'read ↗' },
        { id: 'f3', icon: 'Activity', title: 'Observability, built in', description: 'P50, P99, error rate, cold starts — in the same pane as the deploys that caused them. No separate dashboard to wire up.', link_text: 'read ↗' },
        { id: 'f4', icon: 'Box', title: 'Edge-native runtime', description: 'One binary, twenty regions, zero cold starts. Shipping to a new continent is a checkbox, not a project.', link_text: 'read ↗' },
        { id: 'f5', icon: 'GitBranch', title: 'Environments as code', description: 'Staging, preview, production — one file, reviewed like anything else. No clicking through a portal to find where the env var went.', link_text: 'read ↗' },
        { id: 'f6', icon: 'ShieldCheck', title: 'Audit on by default', description: 'Every deploy, every env change, every role grant — recorded, exportable, signed. SOC 2 report is two clicks, not two weeks.', link_text: 'read ↗' },
      ],
    },
  },
  {
    sectionType: 'testimonials',
    layout: 'ProofWithLogoRail',
    content: {
      eyebrow: 'proof',
      headline: 'Teams that were already fast got faster.',
      testimonials: [
        { id: 't1', quote: 'We cut our deploy window from 40 minutes of tailing logs to a Slack notification. The engineers stopped calling it deploying and started calling it shipping.', author_name: 'Ines Aldridge', author_role: 'Staff Engineer · Parallel.sh' },
        { id: 't2', quote: 'Rolled back a bad migration in 800ms. I was mid-sentence on a call.', author_name: 'Noah Becher', author_role: 'CTO · Latchkey' },
        { id: 't3', quote: 'Our on-call graduated from pager anxiety to reading, which is what on-call should be.', author_name: 'Priya Vellore', author_role: 'Infra Lead · Harbor.ai' },
      ],
      logos: [
        { id: 'l1', name: 'parallel' },
        { id: 'l2', name: 'latchkey' },
        { id: 'l3', name: 'harbor' },
        { id: 'l4', name: 'fieldnote' },
        { id: 'l5', name: 'nightfall' },
        { id: 'l6', name: 'quorum' },
      ],
    },
  },
  {
    sectionType: 'pricing',
    layout: 'ThreeTierPricing',
    content: {
      eyebrow: 'pricing',
      headline: 'Pay for the deploys, not the dashboard.',
      lede: 'Usage-based from day one. No seats, no platform fee, no "talk to sales" until you ask for it.',
      tiers: [
        {
          id: 'tr1', plan: 'Hobby', amount: '$0', per: 'forever · up to 3 projects',
          pitch: "Everything to ship a side project you'd actually link to.",
          features: ['Unlimited preview URLs', '3 regions · 100 GB bandwidth', 'Community support', 'Single environment'],
          cta_text: 'Start free', featured: false,
        },
        {
          id: 'tr2', plan: 'Team', amount: '$24', per: 'per active dev · per month',
          pitch: 'When you stop being alone and start being an on-call.',
          features: ['Everything in Hobby', 'All regions · 2 TB bandwidth', 'Instant rollback + audit log', 'Role-based access', 'Priority email support'],
          cta_text: 'Start 14-day trial', featured: true,
        },
        {
          id: 'tr3', plan: 'Enterprise', amount: 'Custom', per: 'annual · signed agreement',
          pitch: 'For teams that read SOC 2 reports before signing up.',
          features: ['Everything in Team', 'Private regions · dedicated tenancy', 'SSO, SCIM, HIPAA, DPA', 'Named support engineer', '99.99% SLA'],
          cta_text: 'Book a call', featured: false,
        },
      ],
    },
  },
  {
    sectionType: 'cta',
    layout: 'ArcCTA',
    content: {
      eyebrow: 'start',
      headline: 'Your next deploy takes <em>18 seconds</em>.',
      body: "Connect a repo, point it at a domain, stop thinking about it. If you've used git, you've used Meridian.",
      cta_text: 'Start free',
      secondary_cta_text: 'Talk to an engineer',
    },
    // Primary CTA = GOAL_REF: it follows the project goal, resolved by the
    // phase-3 normalizeCtas pre-pass. Secondary = explicit section anchor.
    elementMetadata: {
      cta_text: { cta: { role: 'primary', dest: 'GOAL_REF' } },
      secondary_cta_text: { cta: { role: 'secondary', dest: { kind: 'section', anchor: 'contact' } } },
    },
  },
  {
    sectionType: 'footer',
    layout: 'HairlineFooter',
    content: {
      wordmark: 'meridian',
      tag: 'The deployment layer for teams who want to ship, not watch a progress bar.',
      newsletter_placeholder: 'you@company.com',
      newsletter_cta: 'subscribe',
      copyright: '© 2026 MERIDIAN LABS, INC.',
      location: 'SAN FRANCISCO · 37.7749° N, 122.4194° W',
      footer_columns: [
        { id: 'c1', heading: 'Product', links: [
          { id: 'c1l1', label: 'Overview', href: '/product/overview' }, { id: 'c1l2', label: 'Deploys', href: '/product/deploys' },
          { id: 'c1l3', label: 'Regions', href: '/product/regions' }, { id: 'c1l4', label: 'Rollback', href: '/product/rollback' },
          { id: 'c1l5', label: 'Observability', href: '/product/observability' },
        ] },
        { id: 'c2', heading: 'Developers', links: [
          { id: 'c2l1', label: 'Docs', href: '/docs' }, { id: 'c2l2', label: 'API', href: '/docs/api' },
          { id: 'c2l3', label: 'CLI', href: '/docs/cli' }, { id: 'c2l4', label: 'Changelog', href: '/changelog' },
          { id: 'c2l5', label: 'Status', href: 'https://status.meridian.dev' },
        ] },
        { id: 'c3', heading: 'Company', links: [
          { id: 'c3l1', label: 'About', href: '/company/about' }, { id: 'c3l2', label: 'Customers', href: '/customers' },
          { id: 'c3l3', label: 'Careers', href: '/careers' }, { id: 'c3l4', label: 'Security', href: '/security' },
          { id: 'c3l5', label: 'Contact', href: '/contact' },
        ] },
        { id: 'c4', heading: 'Legal', links: [
          { id: 'c4l1', label: 'Terms', href: '/legal/terms' }, { id: 'c4l2', label: 'Privacy', href: '/legal/privacy' },
          { id: 'c4l3', label: 'DPA', href: '/legal/dpa' }, { id: 'c4l4', label: 'Cookies', href: '/legal/cookies' },
        ] },
      ],
    },
  },
];

// ── editor-basics expectations (template-factory phase 2) ────────────────────
// Per section type: the edit-primitive markers a manifest-declared edit block
// MUST emit in `mode:'preview'` when fed the mock content above.
//   text[]        → each key ⇒ exactly one [data-edit-primitive="text"][data-element-key=key]
//   button[]      → each key ⇒ exactly one [data-edit-primitive="button"][data-element-key=key]
//   collections[] → countPrefix ⇒ `items` per-item roots; itemPrefixes cover every
//                   per-item marker (text+button) for the no-orphan check.
// AUTHORED against each block's ACTUAL preview render path (verified against
// source), NOT the manifest `consumes` list — so mock-excluded optionals and
// edit-only affordances are correctly excluded. Concretely observed exclusions:
//   - MeridianNavHeader renders nav labels as plain <a> in preview (NOT editable)
//     ⇒ NO nav_items collection markers.
//   - HairlineFooter newsletter_* render only when a form is connected, and
//     column LINKS render only in mode:'edit' ⇒ only column HEADINGS are markers.
//   - TerminalHero cta_subtext is absent from the mock ⇒ not rendered in preview.
export const MERIDIAN_EDIT_BASICS: Record<string, EditBasicsExpectation> = {
  header: {
    text: ['logo_text'],
    button: ['signin_text', 'cta_text'],
    collections: [],
  },
  hero: {
    text: ['status_text', 'audience_tag', 'headline', 'lede', 'caption'],
    button: ['cta_text', 'secondary_cta_text'],
    collections: [
      { key: 'stats', countPrefix: 'stats_value_', itemPrefixes: ['stats_value_', 'stats_label_'], items: 4 },
    ],
  },
  features: {
    text: ['eyebrow', 'headline', 'lede'],
    button: [],
    collections: [
      { key: 'features', countPrefix: 'features_title_', itemPrefixes: ['features_title_', 'features_description_', 'features_link_'], items: 6 },
    ],
  },
  testimonials: {
    text: ['eyebrow', 'headline'],
    button: [],
    collections: [
      { key: 'testimonials', countPrefix: 'testimonials_quote_', itemPrefixes: ['testimonials_quote_', 'testimonials_name_', 'testimonials_role_'], items: 3 },
      { key: 'logos', countPrefix: 'logos_name_', itemPrefixes: ['logos_name_'], items: 6 },
    ],
  },
  pricing: {
    text: ['eyebrow', 'headline', 'lede'],
    button: [],
    collections: [
      { key: 'tiers', countPrefix: 'tiers_plan_', itemPrefixes: ['tiers_plan_', 'tiers_amount_', 'tiers_per_', 'tiers_pitch_', 'tiers_feature_', 'tiers_cta_'], items: 3 },
    ],
  },
  cta: {
    text: ['eyebrow', 'headline', 'body'],
    button: ['cta_text', 'secondary_cta_text'],
    collections: [],
  },
  footer: {
    text: ['wordmark', 'tag', 'copyright', 'location'],
    button: [],
    collections: [
      { key: 'footer_columns', countPrefix: 'footer_columns_heading_', itemPrefixes: ['footer_columns_heading_'], items: 4 },
    ],
  },
};
