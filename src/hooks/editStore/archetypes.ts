// hooks/editStore/archetypes.ts — page-slice builders for Phase 3 collections.
//
// Phase 1's addPage only CLONES the home slice; collections need purpose-built
// pages. These builders emit body-only PageSlices of freshly-id'd sections seeded
// with sensible defaults. Layout names are the Meridian product schema keys
// (audience-level, shared by all product templates). Phase 4 swaps the section
// lists / seeds for the fully designed blocks — this file is the single swap point.

import type { PageSlice, SectionData, ProjectPageEntry } from '@/types/store';
import { materializeIntoPages } from './collectionHelpers';

const rid = (p: string): string => `${p}${Math.random().toString(36).slice(2, 8)}`;
const sectionId = (type: string): string => `${type}-${Math.random().toString(36).slice(2, 10)}`;

/** Minimal section-data factory (renderer needs id/type/layout/elements). */
function section(id: string, type: string, layout: string, elements: Record<string, any>): SectionData {
  return {
    id,
    type,
    layout,
    elements,
    isVisible: true,
    backgroundType: 'theme',
    aiMetadata: { aiGenerated: false, lastGenerated: Date.now(), isCustomized: false, aiGeneratedElements: [], excludedElements: [] },
  } as unknown as SectionData;
}

/** Default catalog categories (naayom's three lines; renamable/reorderable in-editor). */
export const DEFAULT_PRODUCT_CATEGORIES = [
  { id: 'controllers', title: 'Mushroom Growing Control Systems', label: 'Room · tunnel · bunker control' },
  { id: 'control', title: 'Control systems', label: 'Parameter control & switching' },
  { id: 'monitors', title: 'Monitoring systems', label: 'Sense & alert' },
];

function ctaSection(): { id: string; data: SectionData } {
  const id = sectionId('cta');
  return {
    id,
    data: section(id, 'cta', 'ArcCTA', {
      eyebrow: 'Talk to us',
      headline: 'Spec it for your <em>farm.</em>',
      body: 'Tell us your setup — we’ll confirm the wiring, commission on site, and walk through the numbers. No pricing pressure, just a plan.',
      cta_text: 'Book a demo',
      secondary_cta_text: 'Chat on WhatsApp',
    }),
  };
}

function slice(secs: Array<{ id: string; data: SectionData }>): PageSlice {
  const sections = secs.map((s) => s.id);
  const sectionLayouts: Record<string, string> = {};
  const content: Record<string, SectionData> = {};
  for (const s of secs) {
    sectionLayouts[s.id] = (s.data as any).layout;
    content[s.id] = s.data;
  }
  return { sections, sectionLayouts, sectionSpacing: {}, content };
}

/** Catalog singleton page: one `catalog` section (seeded categories) + closing cta. */
export function buildCatalogSlice(): PageSlice {
  const catId = sectionId('catalog');
  const catalog = {
    id: catId,
    data: section(catId, 'catalog', 'ProductCatalogList', {
      eyebrow: 'Products',
      headline: 'The product <em>catalog.</em>',
      lede: 'Everything on one platform — every unit talks to the same dashboard.',
      categories: DEFAULT_PRODUCT_CATEGORIES.map((c) => ({ ...c })),
      items: [],
    }),
  };
  return slice([catalog, ctaSection()]);
}

/**
 * Home archetype (Phase 4b) — the full naayom landing layout as BODY sections only
 * (no header/footer; chrome is injected at page boundaries by loadPageIntoActive).
 * Each section uses the exact {type, LayoutName} pair from the schema; layout names
 * are the meridianElementSchema keys so getSchemaDefaults resolves them.
 */
export function buildHomeSlice(): PageSlice {
  const h = sectionId('hero');
  const t = sectionId('trust');
  const pc = sectionId('process');
  const ex = sectionId('explainer');
  const fe = sectionId('features');
  const li = sectionId('lineup');
  const te = sectionId('testimonials');
  const ga = sectionId('gallerypreview');
  const co = sectionId('compatibility');
  const fa = sectionId('faq');
  const ct = sectionId('cta');

  return slice([
    { id: h, data: section(h, 'hero', 'TerminalHero', {
      status_text: 'Climate automation · controlled-environment agriculture',
      audience_tag: 'Built for commercial mushroom growers & research farms',
      headline: 'Where climate control meets <em>precision</em> for mushroom farmers.',
      lede: 'Experience seamless management of temperature, CO₂, humidity and air circulation — from anywhere. Naayom holds every chamber at setpoint so your crop doesn’t pay for a missed reading.',
      cta_text: 'Contact Sales',
      secondary_cta_text: 'See the systems',
      caption: '50% Cordyceps yield uplift — Mycoforest, Gwalior.',
      stats: [
        { id: rid('st'), value: '820', label: 'CO₂', unit: 'ppm', live: 'co2' },
        { id: rid('st'), value: '24.4', label: 'Air temp', unit: '°C', live: 'temp' },
        { id: rid('st'), value: '91', label: 'RH', unit: '%', live: 'rh' },
      ],
    }) },
    { id: t, data: section(t, 'trust', 'TrustStrip', {
      headline: '',
      metrics: [],
      logos: [
        { id: rid('lg'), name: 'Client', image: '' },
        { id: rid('lg'), name: 'Client', image: '' },
        { id: rid('lg'), name: 'Client', image: '' },
        { id: rid('lg'), name: 'Client', image: '' },
        { id: rid('lg'), name: 'Client', image: '' },
        { id: rid('lg'), name: 'Client', image: '' },
      ],
    }) },
    { id: fe, data: section(fe, 'features', 'HairlineFeatureGrid', {
      eyebrow: 'Why Naayom',
      headline: 'Why top growers choose <em>Naayom</em>.',
      lede: 'Our climate control system empowers growers for sustainable growth.',
      features: [
        { id: rid('f'), title: 'Optimize Yield', description: 'We understand mushroom growers’ challenges through in-depth research to identify improvement opportunities.', icon: 'TrendingUp', link_text: '' },
        { id: rid('f'), title: 'Reduces Error', description: 'Minimizes errors typically caused by human limitations in mushroom farming.', icon: 'ShieldCheck', link_text: '' },
        { id: rid('f'), title: 'Consistency', description: 'Enhance farm consistency with Naayom’s reliable climate control solutions.', icon: 'Repeat', link_text: '' },
        { id: rid('f'), title: 'Trend Graphs', description: 'Every parameter at your farm is displayed in a detailed graph to help analyze trends.', icon: 'LineChart', link_text: '' },
        { id: rid('f'), title: 'Enhance Visibility', description: 'Monitor climate parameters, control signals and historical data for comprehensive farming management.', icon: 'Eye', link_text: '' },
        { id: rid('f'), title: 'Stay Connected', description: 'Stay connected to your farm from anywhere in the world with Naayom’s advanced IoT platform.', icon: 'Wifi', link_text: '' },
        { id: rid('f'), title: 'Energy Savings', description: 'Reduce energy usage while maintaining perfect growing conditions.', icon: 'Zap', link_text: '' },
        { id: rid('f'), title: 'Support', description: 'We are available at every step to support our mushroom growers.', icon: 'LifeBuoy', link_text: '' },
        { id: rid('f'), title: 'Instant Alerts', description: 'Get notified the moment a parameter drifts out of range — act before it affects the crop.', icon: 'BellRing', link_text: '' },
      ],
    }) },
    { id: pc, data: section(pc, 'process', 'ProcessSteps', {
      eyebrow: 'How Naayom works',
      headline: 'Sense, control, optimise — <em>automatically</em>.',
      lede: 'A closed loop that holds your climate steady and turns every reading into an insight.',
      steps: [
        { id: rid('s'), icon: 'Radar', title: 'Sensing', body: 'IoT devices and sensors monitor CO₂, temperature and humidity levels in real time, helping growers make informed decisions.' },
        { id: rid('s'), icon: 'SlidersHorizontal', title: 'Control', body: 'Control any type of equipment installed at your farm — compressors, blowers, valves, dampers, VFDs, and more.' },
        { id: rid('s'), icon: 'TrendingUp', title: 'Data Analytics', body: 'We process collected data to provide actionable insights, enhancing farming efficiency and productivity.' },
      ],
    }) },
    { id: ex, data: section(ex, 'explainer', 'ExplainerRows', {
      eyebrow: 'The platform',
      headline: 'From sensing to <em>insight</em> — one platform.',
      lede: 'Hold every chamber at setpoint, see the whole farm at a glance, and turn each reading into a better next cycle.',
      rows: [
        { id: rid('r'), eyebrow: 'Precision', title: 'Stage-based precision control.', body: 'Optimise mushroom cultivation with an advanced controller, ensuring ideal conditions at every stage for consistent, high-quality yields — seamlessly.', image: '', video_url: '', flip: false, cta_text: 'See controllers', cta_href: '/products', bullets: [
          { id: rid('b'), text: 'Stage-wise parameter settings' },
          { id: rid('b'), text: 'Integrated control algorithms' },
          { id: rid('b'), text: 'Customizable climate parameters' },
        ] },
        { id: rid('r'), eyebrow: 'Visibility', title: 'Get the full picture at a glance.', body: 'Monitor and control all growing chambers, Phase II tunnels and Phase I bunkers in real time — via mobile or laptop.', image: '', video_url: '', flip: true, cta_text: 'See monitors', cta_href: '/products', bullets: [
          { id: rid('b'), text: 'Every chamber on one dashboard' },
          { id: rid('b'), text: 'Live values + historical trends' },
          { id: rid('b'), text: 'Alarms that signal faults' },
        ] },
        { id: rid('r'), eyebrow: 'Insight', title: 'Data-driven farming.', body: 'Leverage data to get insights for precise parameter adjustments, proactive issue resolution, and to optimise farm productivity.', image: '', video_url: '', flip: false, cta_text: '', cta_href: '#', bullets: [
          { id: rid('b'), text: 'Detailed trend graphs per parameter' },
          { id: rid('b'), text: 'Spot issues before they cost a batch' },
          { id: rid('b'), text: 'Benchmark room against room' },
        ] },
      ],
    }) },
    { id: li, data: section(li, 'lineup', 'ProductLineup', {
      eyebrow: 'Our Products',
      headline: 'Pick the system for your <em>farm</em>.',
      lede: 'We assist the world’s leading mushroom growers in optimizing their production through advanced connectivity and automation.',
      items: [
        { id: rid('it'), model: 'NWC 1000', name: 'Mushroom Growing Room Controller', oneLiner: 'Advanced climate controller for grow rooms — stage-wise settings and remote connectivity.', image: '', cardSpec: 'Grow room · remote', href: '/products/nwc-1000' },
        { id: rid('it'), model: 'NWC 101', name: 'CO₂, Temperature & Humidity Control', oneLiner: 'Three-parameter control for a single room — CO₂, temperature and humidity, with alarms.', image: '', cardSpec: 'CO₂ + Temp + RH · 4 ports', href: '/products/nwc-101' },
        { id: rid('it'), model: 'NWM 100', name: 'CO₂, Temperature & Humidity Monitor', oneLiner: 'Continuous monitoring of CO₂, temperature and humidity with notifications.', image: '', cardSpec: 'CO₂ + Temp + RH · monitor', href: '/products/nwm-100' },
      ],
    }) },
    { id: te, data: section(te, 'testimonials', 'ProofWithLogoRail', {
      eyebrow: 'Success stories',
      headline: 'What our clients say about Naayom.',
      stats: [
        { id: rid('rs'), value: '+50%', label: 'Cordyceps yield' },
        { id: rid('rs'), value: '24/7', label: 'real-time monitoring' },
        { id: rid('rs'), value: 'Remote', label: 'from anywhere' },
      ],
      testimonials: [
        { id: rid('t'), quote: 'Naayom has significantly boosted my Cordyceps crop yield by 50%. Its precise environmental control and efficient power management are game-changers for mushroom farming.', author_name: 'Mycoforest', author_role: 'Gwalior' },
        { id: rid('t'), quote: 'Thank you, Naayom! Today, I got my first flush, and it was the best one yet!', author_name: 'Green Caps Musluv', author_role: 'Mushroom grower' },
      ],
      logos: [],
    }) },
    { id: ga, data: section(ga, 'gallerypreview', 'GalleryMasonry', {
      eyebrow: 'Gallery',
      headline: 'Climate controllers <em>in the field</em>.',
      lede: 'Real Naayom installations across mushroom farms.',
      images: [
        { id: rid('g'), src: '', tag: 'Controller install', category: 'install' },
        { id: rid('g'), src: '', tag: 'Growing room', category: 'room' },
        { id: rid('g'), src: '', tag: 'Phase II tunnel', category: 'room' },
        { id: rid('g'), src: '', tag: 'Sensor array', category: 'hardware' },
        { id: rid('g'), src: '', tag: 'Dashboard', category: 'software' },
        { id: rid('g'), src: '', tag: 'Mushroom flush', category: 'crop' },
      ],
    }) },
    { id: co, data: section(co, 'compatibility', 'CompatibilityChips', {
      eyebrow: 'Compatibility',
      headline: 'Control any equipment on your farm.',
      lede: 'Wire Naayom into your existing rig — no rip-and-replace. It drives whatever your rooms already run.',
      readout_status: 'Holding setpoint',
      readout_tone: 'ok',
      readout_stage: 'Growing · day',
      readout_caption: 'Live from a connected chamber',
      chips: [
        { id: rid('c'), text: 'Compressors' },
        { id: rid('c'), text: 'Blowers' },
        { id: rid('c'), text: 'Valves' },
        { id: rid('c'), text: 'Dampers' },
        { id: rid('c'), text: 'VFDs' },
        { id: rid('c'), text: 'Foggers' },
        { id: rid('c'), text: 'Exhaust fans' },
        { id: rid('c'), text: 'CO₂ regulators' },
      ],
      readout_metrics: [
        { id: rid('rm'), key: 'CO₂', value: '820', unit: 'ppm', live: 'co2b' },
        { id: rid('rm'), key: 'Temp', value: '24.4', unit: '°C', live: 'tempb' },
        { id: rid('rm'), key: 'RH', value: '91', unit: '%', live: 'rhb' },
      ],
    }) },
    { id: fa, data: section(fa, 'faq', 'FaqDisclosures', {
      eyebrow: 'FAQ',
      headline: 'Questions, answered.',
      items: [
        { id: rid('q'), question: 'Do I need to replace my equipment?', answer: 'No. Naayom drives the compressors, blowers, valves, dampers, VFDs, foggers and CO₂ you already own. We confirm wiring during the spec call.' },
        { id: rid('q'), question: 'Can I monitor my farm remotely?', answer: 'Yes. Monitor and control every growing chamber, Phase II tunnel and Phase I bunker in real time from your mobile or laptop, anywhere in the world.' },
        { id: rid('q'), question: 'What happens if the internet drops?', answer: 'Controllers keep holding your setpoints locally and sync history back to the dashboard once the connection returns.' },
        { id: rid('q'), question: 'Do you support installation?', answer: 'We are available at every step — we spec the units to your rooms, help with installation, and walk your team through the dashboard.' },
      ],
    }) },
    { id: ct, data: section(ct, 'cta', 'ArcCTA', {
      eyebrow: 'Contact Sales',
      headline: 'Have any <em>questions?</em>',
      body: 'Talk to our team — we’ll spec the right system for your farm and walk you through the numbers. No pricing pressure, just a plan.',
      cta_text: 'Contact Sales',
      phone_line: 'Or call <b>+91 9310119271</b> · Mon–Sat, 9am–7pm IST',
    }) },
  ]);
}

/**
 * TechPremium home as a flat `finalContent` (Phase 4c follow-up) — the deterministic
 * default for new hardware-founder projects, replacing AI generation for now.
 * TODO(ai-fill): TEMPORARY naayom-era bridge. Replace the GeneratingStep branch that
 * calls this with an AI path that fills the 12 TechPremium section types from
 * onboarding BEFORE onboarding a 2nd hardware founder (else customer #2 inherits
 * naayom's copy). The 12-section *structure* default is permanent; the seeded *copy*
 * is the time-boxed part.
 *
 * Returns the same flat shape `GeneratingStep.buildFinalContent` produces (header +
 * 12 body sections from buildHomeSlice + footer) so loadDraft / single→multi-page
 * normalization / edit / publish all behave identically to an AI-generated project.
 */
export function buildTechPremiumHomeFinalContent(opts: {
  tokenId: string;
  title: string;
  productName?: string;
  oneLiner?: string;
  understanding?: any;
  landingGoal?: string;
  offer?: string;
}): any {
  const body = buildHomeSlice(); // 12 body sections (no chrome)
  const brand = (opts.productName || '').trim() || 'Naayom';
  const headerId = sectionId('header');
  const footerId = sectionId('footer');

  // Resolve in-page nav/footer anchors to the actual seeded body section ids.
  const idByType = (ty: string) => body.sections.find((id) => (body.content as any)[id]?.type === ty) || '';
  const anchor = (ty: string) => { const id = idByType(ty); return id ? `#${id}` : '/'; };
  const whyHref = anchor('features');
  const howHref = anchor('process');
  const successHref = anchor('testimonials');

  const header = section(headerId, 'header', 'MeridianNavHeader', {
    logo_text: brand,
    logo_image: '',
    cta_text: 'Contact Sales',
    cta_href: '/contact',
    signin_text: 'Login',
    signin_url: '',
    nav_items: [
      { id: rid('nav'), label: 'Why Naayom', href: whyHref, children: [
        { id: rid('c'), label: 'Why Choose Naayom', desc: 'The case for Naayom', href: whyHref },
        { id: rid('c'), label: 'How Naayom Works', desc: 'Sense · control · analytics', href: howHref },
      ] },
      { id: rid('nav'), label: 'Success Story', href: successHref },
      { id: rid('nav'), label: 'Products', href: '/products', children: [
        { id: rid('c'), label: 'Mushroom Growing Control Systems', desc: 'NWC 1000 · 2000 · 3000', href: '/products' },
        { id: rid('c'), label: 'Control systems', desc: 'NWC 101 · 301 · 201', href: '/products' },
        { id: rid('c'), label: 'Monitoring systems', desc: 'NWM 100 · 300 · 200', href: '/products' },
      ] },
      { id: rid('nav'), label: 'Gallery', href: '/gallery' },
    ],
  });
  const footer = section(footerId, 'footer', 'HairlineFooter', {
    wordmark: brand,
    logo_image: '',
    tag: '',
    blurb: 'We are passionate about transforming the agricultural landscape through cutting-edge technology. Our Agritech startup is dedicated to solving pressing challenges faced by farmers.',
    contact_address: '7th Floor, Software Technology Park of India, Electronic City Phase IV, Sector 18, Gurugram, Haryana 122015',
    contact_tel: '+91 9310119271',
    contact_email: 'info@naayom.com',
    newsletter_placeholder: 'you@company.com',
    newsletter_cta: 'Subscribe',
    copyright: `© 2024 ${brand}. All Rights Reserved.`,
    location: 'Gurugram, India',
    whatsapp_number: '919310119271',
    whatsapp_prefill: 'Hi Naayom, I’d like to know more about your climate controllers.',
    whatsapp_label: 'Chat with us',
    footer_columns: [
      { id: rid('col'), heading: 'Quick Links', links: [
        { id: rid('ln'), label: 'Why Choose Naayom', href: whyHref },
        { id: rid('ln'), label: 'How Naayom Works', href: howHref },
        { id: rid('ln'), label: 'Products', href: '/products' },
        { id: rid('ln'), label: 'Success Story', href: successHref },
        { id: rid('ln'), label: 'Gallery', href: '/gallery' },
        { id: rid('ln'), label: 'Contact Us', href: '/contact' },
      ] },
      { id: rid('col'), heading: 'Products', links: [
        { id: rid('ln'), label: 'NWC 1000', href: '/products' },
        { id: rid('ln'), label: 'NWC 2000', href: '/products' },
        { id: rid('ln'), label: 'NWB 3000', href: '/products' },
        { id: rid('ln'), label: 'NWM 100', href: '/products' },
        { id: rid('ln'), label: 'NWM 200', href: '/products' },
        { id: rid('ln'), label: 'NWM 300', href: '/products' },
      ] },
    ],
    socials: [
      { id: rid('soc'), icon: 'Facebook', url: 'https://www.facebook.com/Naayomtech' },
      { id: rid('soc'), icon: 'Linkedin', url: '#' },
      { id: rid('soc'), icon: 'Youtube', url: '#' },
    ],
    legal_links: [
      { id: rid('lg'), label: 'Refunds & Cancellation', href: '#' },
      { id: rid('lg'), label: 'Terms & Conditions', href: '#' },
    ],
  });

  const sections = [headerId, ...body.sections, footerId];
  const sectionLayouts: Record<string, string> = { [headerId]: 'MeridianNavHeader', ...body.sectionLayouts, [footerId]: 'HairlineFooter' };
  const content: Record<string, any> = { [headerId]: header, ...body.content, [footerId]: footer };

  // ── Multi-page: shared chrome + body-only pages (home + Products catalog + 9
  // product detail pages). The loader takes the multi-page path when `pages` is
  // non-empty (persistenceActions), strips chrome from every page, and injects the
  // shared `chrome`. Catalog items + each detail's related[] are MATERIALIZED from
  // the product records — never hand-seeded (items is fillMode:'system').
  const HOME_ID = 'home';
  const chrome = {
    header: { id: headerId, layout: 'MeridianNavHeader', data: header },
    footer: { id: footerId, layout: 'HairlineFooter', data: footer },
  };
  const pages: Record<string, ProjectPageEntry> = {
    [HOME_ID]: {
      id: HOME_ID,
      archetypeKey: 'home',
      pathSlug: '/',
      title: opts.title || 'Home',
      order: 0,
      ...body, // body-only (12 sections, no chrome)
    } as ProjectPageEntry,
    ...buildNaayomProductPages(),
  };
  materializeIntoPages(pages, 'products'); // fill catalog items[] + detail related[]

  return {
    // Flat top-level (back-compat single-page loaders + theme/meta/onboarding restore
    // which the loader reads regardless of branch). The active home is chrome-inline.
    layout: { sections, sectionLayouts, theme: {}, globalSettings: {} },
    content,
    meta: { id: opts.tokenId, title: opts.title, slug: '', lastUpdated: Date.now(), version: 1, tokenId: opts.tokenId },
    onboardingData: {
      oneLiner: opts.oneLiner,
      productName: opts.productName,
      understanding: opts.understanding,
      landingGoal: opts.landingGoal,
      offer: opts.offer,
    },
    generatedAt: Date.now(),
    // Multi-page payload (ADD, not swap) — drives the multi-page load path.
    chrome,
    pages,
    homeId: HOME_ID,
    currentPageId: HOME_ID,
  };
}

/** Gallery page (Phase 4c): one `gallery` section (filter bar + grid). Body-only. */
export function buildGallerySlice(): PageSlice {
  const gId = sectionId('gallery');
  const gallery = {
    id: gId,
    data: section(gId, 'gallery', 'GalleryFullPage', {
      eyebrow: 'Gallery',
      headline: 'In the <em>field.</em>',
      lede: 'Working installs photographed on real farms — controllers, sensors, grow rooms and crop.',
      filters: [
        { id: rid('flt'), label: 'Installs', cat: 'installs' },
        { id: rid('flt'), label: 'Hardware', cat: 'hardware' },
        { id: rid('flt'), label: 'Grow rooms', cat: 'rooms' },
        { id: rid('flt'), label: 'Crop', cat: 'crop' },
      ],
      images: [
        { id: rid('g'), src: '', tag: 'Controller install', category: 'installs' },
        { id: rid('g'), src: '', tag: 'Sensor array', category: 'hardware' },
        { id: rid('g'), src: '', tag: 'Grow room — racks + controller', category: 'rooms' },
        { id: rid('g'), src: '', tag: 'Fogger line', category: 'hardware' },
        { id: rid('g'), src: '', tag: 'Canopy', category: 'crop' },
        { id: rid('g'), src: '', tag: 'Commissioning on site', category: 'installs' },
        { id: rid('g'), src: '', tag: 'Dashboard in the office', category: 'hardware' },
        { id: rid('g'), src: '', tag: 'Harvest', category: 'crop' },
      ],
    }),
  };
  return slice([gallery]);
}

/** Contact page (Phase 4c): one `contact` section (info + real lead form). Body-only.
 *  `formId` is provisioned by `ensureContactForm` and wired into the form markup. */
export function buildContactSlice(formId: string): PageSlice {
  const cId = sectionId('contact');
  const contact = {
    id: cId,
    data: section(cId, 'contact', 'ContactForm', {
      eyebrow: 'Contact',
      headline: 'Let’s <em>map it</em> to your setup.',
      lede: 'Tell us how many chambers you run and what you grow — WhatsApp is the fastest way to reach us.',
      form_id: formId,
      form_heading: 'Book a demo',
      form_note: 'No pricing pressure — just a 30-minute walkthrough of your rooms.',
      form_foot: 'By submitting you agree to be contacted about your enquiry.',
      whatsapp_text: 'Chat on WhatsApp',
      whatsapp_href: '#',
      map_caption: 'Embedded map — your location',
      info: [
        { id: rid('ci'), icon: 'Phone', k: 'Call / WhatsApp', v: '+91 99999 99999', href: 'tel:+919999999999', sub: 'Mon–Sat, 9am–7pm' },
        { id: rid('ci'), icon: 'Mail', k: 'Email', v: 'hello@example.com', href: 'mailto:hello@example.com', sub: 'We reply within one business day' },
        { id: rid('ci'), icon: 'MapPin', k: 'Office', v: 'Your city', href: '', sub: 'Installs across the region' },
      ],
    }),
  };
  return slice([contact]);
}

/** Product-detail (collection item) page: one `productdetail` record section + closing cta. */
export function buildProductDetailSlice(opts: {
  title?: string;
  categoryId?: string;
  model?: string;
  oneLiner?: string;
  lede?: string;
  cardSpec?: string;
  features?: string[];
  specs?: Array<{ key: string; value: string }>;
} = {}): PageSlice {
  const name = opts.title?.trim() || 'New product';
  const label = opts.model || name;
  const pdId = sectionId('productdetail');
  const detail = {
    id: pdId,
    data: section(pdId, 'productdetail', 'ProductDetailRecord', {
      model: opts.model || '',
      name,
      category: opts.categoryId || DEFAULT_PRODUCT_CATEGORIES[0].id,
      oneLiner: opts.oneLiner || '',
      lede: opts.lede || '',
      cardSpec: opts.cardSpec || '',
      enquireText: `Enquire about ${label}`,
      whatsappText: 'Ask on WhatsApp',
      note: 'Sales-led — we spec the unit to your rooms. No online pricing.',
      images: [{ id: rid('img'), src: '', tag: `${label} — product photo` }],
      badges: [],
      features: (opts.features || []).map((t) => ({ id: rid('ft'), text: t })),
      specs: (opts.specs || []).map((s) => ({ id: rid('sp'), key: s.key, value: s.value })),
      related: [],
    }),
  };
  return slice([detail, ctaSection()]);
}

/** naayom's real catalog (from naayom.com) — 9 products across the 3 categories.
 *  Single source of the seeded product copy (time-boxed naayom bridge, like the home seed). */
export const NAAYOM_PRODUCTS: Array<{
  model: string; name: string; categoryId: string; oneLiner: string; cardSpec: string;
  features: string[]; specs: Array<{ key: string; value: string }>;
}> = [
  // ── Mushroom Growing Control Systems ──
  {
    model: 'NWC 1000', name: 'Mushroom Growing Room Controller', categoryId: 'controllers',
    oneLiner: 'Advanced climate controller for grow rooms — an easy interface with remote connectivity and stage-wise parameter settings for higher, consistent yields.',
    cardSpec: 'Grow room · stage-wise · remote',
    features: ['Real-time monitoring', 'Trend graphs', 'Easy-to-use interface', 'Remote connectivity', 'Alarms on faults'],
    specs: [{ key: 'Climate', value: 'Stage-wise parameters' }, { key: 'Access', value: 'Remote' }],
  },
  {
    model: 'NWC 2000', name: 'Phase II Tunnel Control System', categoryId: 'controllers',
    oneLiner: 'Real-time monitoring and automated control of Phase II tunnels with a 7-inch touch interface — balanced fresh/recirculated air and precise climate control.',
    cardSpec: 'Phase II tunnel · 7″ touch',
    features: ['Real-time monitoring & automated control of Phase II tunnels', '7-inch touch interface', 'Balances fresh and recirculated air to control supply-air temperature', 'Precise climate control throughout the cycle', 'Process automation for all stages', 'Consistent high-quality compost', 'Reduced power consumption'],
    specs: [{ key: 'Interface', value: '7-inch touch' }, { key: 'Scope', value: 'Phase II tunnel' }],
  },
  {
    model: 'NWB 3000', name: 'Phase I Bunker Control System', categoryId: 'controllers',
    oneLiner: 'Automated monitoring and control for Phase I bunkers — track compost temperatures and adjust cycles remotely.',
    cardSpec: 'Phase I bunker · 7″ touch',
    features: ['Real-time monitoring of compost temperatures in Phase I bunkers', '7-inch touch interface', 'Notifications/alarms on faults', 'Adjust time periods and duty cycles remotely'],
    specs: [{ key: 'Interface', value: '7-inch touch' }, { key: 'Scope', value: 'Phase I bunker' }],
  },
  // ── Control systems ──
  {
    model: 'NWC 101', name: 'CO₂, Temperature & Humidity Control', categoryId: 'control',
    oneLiner: 'Real-time control of CO₂, temperature and humidity for a single room, with remote adjustment and alarms.',
    cardSpec: 'CO₂ + Temp + RH · 4 ports',
    features: ['Real-time monitoring of CO₂, temperature and humidity', 'Remotely track and adjust settings', 'Alarms and notifications', '4 ON/OFF control ports'],
    specs: [{ key: 'Air temperature sensor', value: '1' }, { key: 'Humidity sensor', value: '1' }, { key: 'CO₂ sensor', value: '1' }, { key: 'Compost sensors', value: 'up to 3' }, { key: 'Control ports', value: '4 ON/OFF' }],
  },
  {
    model: 'NWC 301', name: 'Temperature & Humidity Control', categoryId: 'control',
    oneLiner: 'Continuous control of temperature and humidity with remote adjustment, alarms and four control outputs.',
    cardSpec: 'Temp + RH · 4 ports',
    features: ['Real-time monitoring of temperature and humidity', 'Remotely track and adjust settings', 'Alarms and notifications', '4 ON/OFF control ports'],
    specs: [{ key: 'Humidity sensor', value: '1' }, { key: 'Temperature sensors', value: 'up to 4' }, { key: 'Control ports', value: '4 ON/OFF' }],
  },
  {
    model: 'NWC 201', name: 'Temperature Control', categoryId: 'control',
    oneLiner: 'Continuous temperature control with remote adjustment, alarms and four control outputs.',
    cardSpec: 'Temp · 4 ports',
    features: ['Real-time monitoring of temperature', 'Remotely track and adjust settings', 'Alarms and notifications', '4 ON/OFF control ports'],
    specs: [{ key: 'Temperature sensors', value: 'up to 4' }, { key: 'Control ports', value: '4 ON/OFF' }],
  },
  // ── Monitoring systems ──
  {
    model: 'NWM 100', name: 'CO₂, Temperature & Humidity Monitor', categoryId: 'monitors',
    oneLiner: 'Continuous real-time monitoring of CO₂, temperature and humidity with notifications.',
    cardSpec: 'CO₂ + Temp + RH · monitor',
    features: ['Continuous real-time monitoring of CO₂, temperature and humidity', 'Notifications'],
    specs: [{ key: 'Temperature sensors', value: 'up to 5' }, { key: 'CO₂ sensor', value: '1' }, { key: 'Humidity sensor', value: '1' }],
  },
  {
    model: 'NWM 300', name: 'Temperature & Humidity Monitor', categoryId: 'monitors',
    oneLiner: 'Continuous real-time monitoring of temperature and humidity with notifications.',
    cardSpec: 'Temp + RH · monitor',
    features: ['Continuous real-time monitoring of temperature and humidity', 'Notifications'],
    specs: [{ key: 'Temperature sensors', value: 'up to 5' }, { key: 'Humidity sensor', value: '1' }],
  },
  {
    model: 'NWM 200', name: 'Temperature Monitor', categoryId: 'monitors',
    oneLiner: 'Continuous real-time temperature monitoring with notifications.',
    cardSpec: 'Temp · monitor',
    features: ['Continuous real-time monitoring of temperature', 'Notifications'],
    specs: [{ key: 'Temperature sensors', value: 'up to 4' }],
  },
];

const productSlug = (model: string): string =>
  model.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/** Build the naayom Products collection as page entries: the catalog singleton +
 *  one collectionItem detail page per product. Bodies are body-only (no chrome).
 *  Caller must run `materializeIntoPages(pages, 'products')` after merging these in
 *  (so the catalog `items[]` + each detail's `related[]` derive from the records).
 *  `order` starts at 1 (home is 0). */
export function buildNaayomProductPages(): Record<string, ProjectPageEntry> {
  const pages: Record<string, ProjectPageEntry> = {};
  const catId = 'page-catalog';
  pages[catId] = {
    id: catId,
    archetypeKey: 'product-catalog',
    pathSlug: '/products',
    title: 'Products',
    order: 1,
    kind: 'singleton',
    collectionKey: 'products',
    ...buildCatalogSlice(),
  };
  NAAYOM_PRODUCTS.forEach((p, i) => {
    const slug = productSlug(p.model);
    const id = `page-${slug}`;
    pages[id] = {
      id,
      archetypeKey: 'product-detail',
      pathSlug: `/products/${slug}`,
      title: `${p.model} — ${p.name}`,
      order: 2 + i,
      kind: 'collectionItem',
      collectionKey: 'products',
      ...buildProductDetailSlice({
        title: p.name,
        model: p.model,
        categoryId: p.categoryId,
        oneLiner: p.oneLiner,
        cardSpec: p.cardSpec,
        features: p.features,
        specs: p.specs,
      }),
    };
  });
  return pages;
}
