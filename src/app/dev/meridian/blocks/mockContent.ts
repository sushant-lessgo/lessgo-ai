// src/app/dev/meridian/blocks/mockContent.ts
// Hand-authored design-reference mock content for the 7 Meridian pilot blocks,
// transcribed from "Meridian - Modern Tech.html" so the gallery can visual-diff
// edit + published against the reference (developer / mint). Used because
// generateMockFromSchema does NOT populate nested-array fields (tier features,
// footer column links) — those need real content here.

export interface MeridianMockEntry {
  sectionType: string;
  layout: string;
  content: Record<string, any>;
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
      nav_items: [
        { id: 'n1', label: 'Product', href: '#' },
        { id: 'n2', label: 'Docs', href: '#' },
        { id: 'n3', label: 'Customers', href: '#' },
        { id: 'n4', label: 'Changelog', href: '#' },
        { id: 'n5', label: 'Pricing', href: '#' },
      ],
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
          { id: 'c1l1', label: 'Overview', href: '#' }, { id: 'c1l2', label: 'Deploys', href: '#' },
          { id: 'c1l3', label: 'Regions', href: '#' }, { id: 'c1l4', label: 'Rollback', href: '#' },
          { id: 'c1l5', label: 'Observability', href: '#' },
        ] },
        { id: 'c2', heading: 'Developers', links: [
          { id: 'c2l1', label: 'Docs', href: '#' }, { id: 'c2l2', label: 'API', href: '#' },
          { id: 'c2l3', label: 'CLI', href: '#' }, { id: 'c2l4', label: 'Changelog', href: '#' },
          { id: 'c2l5', label: 'Status', href: '#' },
        ] },
        { id: 'c3', heading: 'Company', links: [
          { id: 'c3l1', label: 'About', href: '#' }, { id: 'c3l2', label: 'Customers', href: '#' },
          { id: 'c3l3', label: 'Careers', href: '#' }, { id: 'c3l4', label: 'Security', href: '#' },
          { id: 'c3l5', label: 'Contact', href: '#' },
        ] },
        { id: 'c4', heading: 'Legal', links: [
          { id: 'c4l1', label: 'Terms', href: '#' }, { id: 'c4l2', label: 'Privacy', href: '#' },
          { id: 'c4l3', label: 'DPA', href: '#' }, { id: 'c4l4', label: 'Cookies', href: '#' },
        ] },
      ],
    },
  },
];
