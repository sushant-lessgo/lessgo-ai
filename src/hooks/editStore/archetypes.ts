// hooks/editStore/archetypes.ts — page-slice builders for Phase 3 collections.
//
// Phase 1's addPage only CLONES the home slice; collections need purpose-built
// pages. These builders emit body-only PageSlices of freshly-id'd sections seeded
// with sensible defaults. Layout names are the Meridian product schema keys
// (audience-level, shared by all product templates). Phase 4 swaps the section
// lists / seeds for the fully designed blocks — this file is the single swap point.

import type { PageSlice, SectionData } from '@/types/store';

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
  { id: 'controllers', title: 'Growing-room controllers', label: 'Full-room automation' },
  { id: 'control', title: 'Control systems', label: 'Equipment drive & switching' },
  { id: 'monitors', title: 'Monitors', label: 'Sense & alert' },
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
  const pr = sectionId('problem');
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
      status_text: 'Climate automation · controlled-environment ag',
      audience_tag: 'Built for commercial growers & research farms',
      headline: 'Grow rooms that <em>run themselves.</em>',
      lede: 'Sensors, controllers and one dashboard — so CO₂, temperature and humidity hold their setpoints while you sleep.',
      cta_text: 'Book a demo',
      secondary_cta_text: 'See the systems',
      caption: '99.98% uptime across 140+ rooms in the field.',
      stats: [
        { id: rid('st'), value: '820', label: 'CO₂', unit: 'ppm', live: 'co2' },
        { id: rid('st'), value: '24.4', label: 'Air temp', unit: '°C', live: 'temp' },
        { id: rid('st'), value: '61', label: 'RH', unit: '%', live: 'rh' },
      ],
    }) },
    { id: t, data: section(t, 'trust', 'TrustStrip', {
      metrics: [
        { id: rid('m'), value: '140+', label: 'rooms automated' },
        { id: rid('m'), value: '99.98%', label: 'controller uptime' },
        { id: rid('m'), value: '6 yrs', label: 'in the field' },
      ],
      logos: [
        { id: rid('lg'), name: 'Partner', image: '' },
        { id: rid('lg'), name: 'Partner', image: '' },
        { id: rid('lg'), name: 'Partner', image: '' },
        { id: rid('lg'), name: 'Partner', image: '' },
      ],
    }) },
    { id: pr, data: section(pr, 'problem', 'ProblemPains', {
      eyebrow: 'The status quo',
      headline: 'Manual climate control quietly costs you yield.',
      lede: 'Every room drifts the moment no one is watching. The damage shows up weeks later, in the harvest.',
      pains: [
        { id: rid('p'), title: 'Setpoints drift overnight', body: 'A thermostat and a timer can’t react to a heat spike at 3am. By morning the room has already swung twice.' },
        { id: rid('p'), title: 'Equipment runs blind', body: 'Foggers, fans and CO₂ fire on schedules, not on what the room actually needs — wasting power and stressing plants.' },
        { id: rid('p'), title: 'No record when it matters', body: 'When a batch underperforms there’s no log to point to. You’re guessing at what went wrong.' },
      ],
    }) },
    { id: pc, data: section(pc, 'process', 'ProcessSteps', {
      eyebrow: 'How it works',
      headline: 'Sense, decide, act — every few seconds.',
      lede: 'A closed loop that holds your climate steady without anyone in the room.',
      steps: [
        { id: rid('s'), icon: 'Radar', title: 'Sense', body: 'Calibrated probes read CO₂, temperature and humidity across the canopy in real time.' },
        { id: rid('s'), icon: 'SlidersHorizontal', title: 'Decide', body: 'The controller compares every reading to your setpoints and computes the next move.' },
        { id: rid('s'), icon: 'TrendingUp', title: 'Act', body: 'It drives foggers, fans, heaters and CO₂ directly — then logs every action for you.' },
      ],
    }) },
    { id: ex, data: section(ex, 'explainer', 'ExplainerRows', {
      rows: [
        { id: rid('r'), eyebrow: 'Control', title: 'One controller, every actuator.', body: 'Wire your foggers, exhaust, heating and CO₂ into a single unit. It switches them on what the room needs, not a clock.', image: '', flip: false, cta_text: 'See controllers', cta_href: '/products', bullets: [
          { id: rid('b'), text: 'Drives up to 8 channels per unit' },
          { id: rid('b'), text: 'Hard setpoint + deadband per channel' },
          { id: rid('b'), text: 'Fails safe on sensor loss' },
        ] },
        { id: rid('r'), eyebrow: 'Visibility', title: 'The whole farm on one dashboard.', body: 'Every room reports to the same screen. See live values, history and alerts from anywhere — phone or desk.', image: '', flip: true, cta_text: 'See monitors', cta_href: '/products', bullets: [
          { id: rid('b'), text: 'Live + 12-month history per room' },
          { id: rid('b'), text: 'SMS / push alerts on breach' },
          { id: rid('b'), text: 'Export logs for any batch' },
        ] },
      ],
    }) },
    { id: fe, data: section(fe, 'features', 'HairlineFeatureGrid', {
      eyebrow: 'Capabilities',
      headline: 'Everything the room needs, built in.',
      lede: 'Hardware and software designed together — no integrators required.',
      features: [
        { id: rid('f'), title: 'Multi-channel drive', description: 'Switch and ramp foggers, fans, heaters and CO₂ from one controller.', icon: 'SlidersHorizontal', link_text: '' },
        { id: rid('f'), title: 'Real-time sensing', description: 'Calibrated CO₂, temp and RH probes report every few seconds.', icon: 'Radar', link_text: '' },
        { id: rid('f'), title: 'Alerts that reach you', description: 'Breach a setpoint and the right person gets an SMS in seconds.', icon: 'Bell', link_text: '' },
        { id: rid('f'), title: 'Full audit log', description: 'Every reading and action stored — replay any batch.', icon: 'FileText', link_text: '' },
        { id: rid('f'), title: 'Offline-safe', description: 'Controllers hold setpoints even if the network drops.', icon: 'ShieldCheck', link_text: '' },
        { id: rid('f'), title: 'Open dashboard', description: 'One screen for every room, on any device.', icon: 'LayoutDashboard', link_text: '' },
      ],
    }) },
    { id: li, data: section(li, 'lineup', 'ProductLineup', {
      eyebrow: 'Products',
      headline: 'Pick the unit for the room.',
      lede: 'Three lines, one platform — every unit talks to the same dashboard.',
      items: [
        { id: rid('it'), model: 'RC-1', name: 'Room Controller', oneLiner: 'Full-room climate automation in one unit.', image: '', cardSpec: '8 channels · 3 probes', href: '/products' },
        { id: rid('it'), model: 'CS-1', name: 'Control System', oneLiner: 'Equipment drive & switching for existing rigs.', image: '', cardSpec: '4 channels · relay out', href: '/products' },
        { id: rid('it'), model: 'MN-1', name: 'Monitor', oneLiner: 'Sense & alert where you don’t need control.', image: '', cardSpec: '3 probes · SMS alerts', href: '/products' },
      ],
    }) },
    { id: te, data: section(te, 'testimonials', 'ProofWithLogoRail', {
      eyebrow: 'Results in the field',
      headline: 'The numbers customers came back with.',
      stats: [
        { id: rid('rs'), value: '+18%', label: 'yield per cycle' },
        { id: rid('rs'), value: '−31%', label: 'energy per kg' },
        { id: rid('rs'), value: '0', label: 'manual night checks' },
      ],
      testimonials: [
        { id: rid('t'), quote: 'We stopped doing 3am walk-throughs the week it went in. The rooms just hold.', author_name: 'Operations lead', author_role: 'Commercial grower' },
        { id: rid('t'), quote: 'First season with the controllers our energy bill dropped and the canopy was the most even we’ve had.', author_name: 'Head grower', author_role: 'Research farm' },
      ],
      logos: [
        { id: rid('lg'), name: 'Brand' },
        { id: rid('lg'), name: 'Brand' },
        { id: rid('lg'), name: 'Brand' },
      ],
    }) },
    { id: ga, data: section(ga, 'gallerypreview', 'GalleryMasonry', {
      eyebrow: 'From the field',
      headline: 'Real rooms, running on it.',
      lede: 'Installs across commercial and research farms.',
      images: [
        { id: rid('g'), src: '', tag: 'Controller install', category: 'install' },
        { id: rid('g'), src: '', tag: 'Sensor array', category: 'hardware' },
        { id: rid('g'), src: '', tag: 'Grow room', category: 'room' },
        { id: rid('g'), src: '', tag: 'Dashboard', category: 'software' },
        { id: rid('g'), src: '', tag: 'Fogger line', category: 'hardware' },
        { id: rid('g'), src: '', tag: 'Canopy', category: 'room' },
      ],
    }) },
    { id: co, data: section(co, 'compatibility', 'CompatibilityChips', {
      eyebrow: 'Compatibility',
      headline: 'Works with what you already run.',
      lede: 'Wire it into your existing foggers, fans and CO₂ — no rip-and-replace.',
      readout_status: 'Holding setpoint',
      readout_tone: 'ok',
      readout_stage: 'Veg · day',
      readout_caption: 'Live from a connected room',
      chips: [
        { id: rid('c'), text: 'Ultrasonic foggers' },
        { id: rid('c'), text: 'Exhaust & circulation fans' },
        { id: rid('c'), text: 'CO₂ regulators' },
        { id: rid('c'), text: 'Resistive heaters' },
        { id: rid('c'), text: 'Dehumidifiers' },
        { id: rid('c'), text: 'Dimmable LED drivers' },
      ],
      readout_metrics: [
        { id: rid('rm'), key: 'CO₂', value: '820', unit: 'ppm', live: 'co2b' },
        { id: rid('rm'), key: 'Temp', value: '24.4', unit: '°C', live: 'tempb' },
        { id: rid('rm'), key: 'RH', value: '61', unit: '%', live: 'rhb' },
      ],
    }) },
    { id: fa, data: section(fa, 'faq', 'FaqDisclosures', {
      eyebrow: 'FAQ',
      headline: 'Questions, answered.',
      items: [
        { id: rid('q'), question: 'Do I need to replace my equipment?', answer: 'No. The controller drives the foggers, fans and CO₂ you already own. We confirm wiring during the spec call.' },
        { id: rid('q'), question: 'What happens if the internet drops?', answer: 'Controllers run fully offline and keep holding your setpoints. They sync history back to the dashboard once the connection returns.' },
        { id: rid('q'), question: 'How many rooms can one dashboard handle?', answer: 'There’s no practical limit — every controller reports to the same screen, whether you run one room or fifty.' },
        { id: rid('q'), question: 'Do you commission on site?', answer: 'Yes. We spec the units to your rooms, install, and walk your team through the dashboard before handover.' },
      ],
    }) },
    { id: ct, data: section(ct, 'cta', 'ArcCTA', {
      eyebrow: 'Talk to us',
      headline: 'Spec it for your <em>farm.</em>',
      body: 'Tell us your setup — we’ll confirm the wiring, commission on site, and walk through the numbers. No pricing pressure, just a plan.',
      cta_text: 'Book a demo',
      secondary_cta_text: 'Chat on WhatsApp',
      tertiary_cta_text: 'Call sales',
      phone_line: 'Or call <b>+00 000 000 000</b> · Mon–Fri, 9–6',
    }) },
  ]);
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
export function buildProductDetailSlice(opts: { title?: string; categoryId?: string } = {}): PageSlice {
  const name = opts.title?.trim() || 'New product';
  const pdId = sectionId('productdetail');
  const detail = {
    id: pdId,
    data: section(pdId, 'productdetail', 'ProductDetailRecord', {
      model: '',
      name,
      category: opts.categoryId || DEFAULT_PRODUCT_CATEGORIES[0].id,
      oneLiner: '',
      lede: '',
      cardSpec: '',
      enquireText: `Enquire about ${name}`,
      whatsappText: 'Ask on WhatsApp',
      note: 'Sales-led — we spec the unit to your rooms. No online pricing.',
      images: [{ id: rid('img'), src: '', tag: `${name} — product photo` }],
      badges: [],
      features: [],
      specs: [],
      related: [],
    }),
  };
  return slice([detail, ctaSection()]);
}
