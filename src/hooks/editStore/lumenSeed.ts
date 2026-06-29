// src/hooks/editStore/lumenSeed.ts
// LUMEN (bespoke §13) — Kundius Photography deterministic home seed. Isolated in
// its own module so retirement = delete this file + the resolveLumenBlock /
// registry / types entries. Single-page (no chrome/pages — Lumen is one page with
// #anchor nav). Returns the flat finalContent shape (layout + content + meta +
// onboardingData + forms) so loadDraft / edit / publish behave like any project.
// Copy is seeded EN + NL twins (the client owns/edits both); photos are '' until
// the client uploads. The AI fills NONE of this. Attach to the client's token via
// saveDraft with templateId:'lumen', paletteId:'brass', variantId:'default'.

import { DEFAULT_CONTACT_FIELDS, CONTACT_SUBMIT_TEXT } from '@/modules/templates/lumen/blocks/Contact/contactFields';

const rid = (p: string): string => `${p}${Math.random().toString(36).slice(2, 8)}`;
const sectionId = (type: string): string => `${type}-${Math.random().toString(36).slice(2, 10)}`;

function section(id: string, type: string, layout: string, elements: Record<string, any>): any {
  return {
    id, type, layout, elements,
    isVisible: true,
    backgroundType: 'theme',
    aiMetadata: { aiGenerated: false, lastGenerated: Date.now(), isCustomized: false, aiGeneratedElements: [], excludedElements: [] },
  };
}

function imgs(n: number): Array<{ id: string; src: string }> {
  const out: Array<{ id: string; src: string }> = [];
  for (let i = 0; i < n; i++) out.push({ id: rid('im'), src: '' });
  return out;
}

export function buildLumenHomeFinalContent(opts: {
  tokenId: string;
  title?: string;
  brandName?: string;
}): any {
  const brand = (opts.brandName || 'Kundius').trim();
  const title = opts.title || `${brand} Photography`;

  const headerId = sectionId('header');
  const heroId = sectionId('hero');
  const logosId = sectionId('logos');
  const servicesId = sectionId('services');
  const processId = sectionId('process');
  const portfolioId = sectionId('portfolio');
  const aboutId = sectionId('about');
  const contactId = sectionId('contact');
  const footerId = sectionId('footer');
  const formId = rid('form');

  const header = section(headerId, 'header', 'LumenNav', {
    logo_text: `${brand}<em>.</em>`, logo_text_nl: `${brand}<em>.</em>`,
    brand_sub: 'Photography', brand_sub_nl: 'Fotografie',
    logo_image: '',
    cta_text: 'Request a quote', cta_text_nl: 'Offerte aanvragen',
    nav_items: [
      { id: rid('nav'), label: 'Work', label_nl: 'Werk', href: `#${portfolioId}` },
      { id: rid('nav'), label: 'Services', label_nl: 'Diensten', href: `#${servicesId}` },
      { id: rid('nav'), label: 'About', label_nl: 'Over mij', href: `#${aboutId}` },
      { id: rid('nav'), label: 'Contact', label_nl: 'Contact', href: `#${contactId}` },
    ],
  });

  const hero = section(heroId, 'hero', 'LumenHero', {
    eyebrow: 'Corporate photography · Den Haag & the Randstad',
    eyebrow_nl: 'Zakelijke fotografie · Den Haag & de Randstad',
    headline: 'The version of your company that <em>wins the room.</em>',
    headline_nl: 'De versie van je bedrijf die <em>de zaal wint.</em>',
    lede: 'I make companies in Den Haag and the Randstad look like the version of themselves they want clients, hires and press to see — headshots, branding and event work that earns trust on sight.',
    lede_nl: "Ik laat bedrijven in Den Haag en de Randstad eruitzien als de versie van zichzelf die ze aan klanten, nieuwe collega's en pers willen tonen — portretten, branding en evenementen die direct vertrouwen wekken.",
    cta_text: 'See recent work', cta_text_nl: 'Bekijk recent werk',
    secondary_cta_text: 'Request a quote', secondary_cta_text_nl: 'Offerte aanvragen',
    who_text: 'For <b>law firms · consultancies · startups · agencies</b>',
    who_text_nl: 'Voor <b>advocatenkantoren · consultancies · startups · bureaus</b>',
    badge_text: 'Den Haag · on location', badge_text_nl: 'Den Haag · op locatie',
    fig_caption: 'Executive portrait', fig_caption_nl: 'Directieportret',
    fig_number: 'Fig. 01', fig_ratio: '4:5', hero_image: '',
  });

  const logos = section(logosId, 'logos', 'LumenLogos', {
    label: 'Trusted by teams across the Randstad',
    label_nl: 'Vertrouwd door teams in de Randstad',
    brands: [
      { id: rid('b'), name: 'Law firms', name_nl: 'Advocatenkantoren' },
      { id: rid('b'), name: 'Consultancies', name_nl: 'Consultancies' },
      { id: rid('b'), name: 'Startups', name_nl: 'Startups' },
      { id: rid('b'), name: 'Agencies', name_nl: 'Bureaus' },
      { id: rid('b'), name: 'Scale-ups', name_nl: 'Scale-ups' },
    ],
  });

  const dl = (en: string, nl: string) => ({ id: rid('dl'), text: en, text_nl: nl });
  const services = section(servicesId, 'services', 'LumenPricedServiceCards', {
    eyebrow: 'Services & pricing', eyebrow_nl: 'Diensten & tarieven',
    headline: 'Four ways to <em>photograph your business.</em>',
    headline_nl: 'Vier manieren om <em>je bedrijf te fotograferen.</em>',
    lede: "Clear packages, plain deliverables, prices ex. btw. Not sure which fits? Send a brief and I'll recommend one.",
    lede_nl: 'Heldere pakketten, duidelijke deliverables, prijzen excl. btw. Niet zeker welk past? Stuur een briefing en ik adviseer.',
    services: [
      {
        id: rid('svc'), name: 'Corporate Headshots', name_nl: 'Corporate Headshots', dutch_tagline: 'Zakelijke portretten',
        price: '€250', price_unit: 'ex. btw', price_unit_nl: 'excl. btw',
        pitch: 'LinkedIn-ready portraits for teams and execs — consistent across the whole company, shot in studio or at your office.',
        pitch_nl: 'LinkedIn-klare portretten voor teams en directie — consistent over het hele bedrijf, in de studio of op kantoor.',
        cta_text: 'Request a quote', cta_text_nl: 'Offerte aanvragen',
        deliverables: [
          dl('30–45 min per person, studio or on location', '30–45 min per persoon, studio of op locatie'),
          dl('5 retouched finals to choose from', '5 geretoucheerde finals om uit te kiezen'),
          dl('LinkedIn + print crops, delivered in 48h', 'LinkedIn + print-uitsnedes, binnen 48 uur'),
        ],
      },
      {
        id: rid('svc'), name: 'Personal Branding Shoot', name_nl: 'Personal Branding Shoot', dutch_tagline: 'Personal branding',
        price: '€350', price_unit: 'ex. btw', price_unit_nl: 'excl. btw',
        pitch: 'A cohesive, on-brand image set for founders and professionals — portrait, candid and detail shots that work across web and social.',
        pitch_nl: 'Een samenhangende, on-brand beeldset voor founders en professionals — portret, candid en detail die werken op web en social.',
        cta_text: 'Request a quote', cta_text_nl: 'Offerte aanvragen',
        deliverables: [
          dl('Half-day session, posed + candid', 'Halve dag sessie, poserend + candid'),
          dl('15 retouched finals, mixed crops', '15 geretoucheerde finals, gemengde uitsnedes'),
          dl('Full usage for web & social', 'Volledig gebruiksrecht voor web & social'),
        ],
      },
      {
        id: rid('svc'), name: 'Complete Brand Library', name_nl: 'Complete Brand Library', dutch_tagline: 'Complete merkbibliotheek',
        price: '€500', price_unit: 'ex. btw', price_unit_nl: 'excl. btw',
        pitch: 'Full photo + video production — team, workspace, product and detail — enough material to carry a website, deck and social calendar for a year.',
        pitch_nl: 'Volledige foto- + videoproductie — team, werkplek, product en detail — genoeg materiaal voor een jaar website, deck en social.',
        cta_text: 'Request a quote', cta_text_nl: 'Offerte aanvragen',
        deliverables: [
          dl('Full day, photo + short video clips', 'Hele dag, foto + korte videoclips'),
          dl('40+ images + edited clips', '40+ beelden + gemonteerde clips'),
          dl('Full commercial license', 'Volledige commerciële licentie'),
        ],
      },
      {
        id: rid('svc'), name: 'Event Reportage', name_nl: 'Event Reportage', dutch_tagline: 'Evenementreportage',
        price: '€100', price_unit: 'per hour · min 3h', price_unit_nl: 'per uur · min 3u',
        pitch: 'Documentary coverage of conferences, launches and team days — candid, unobtrusive, with fast turnaround for press and social.',
        pitch_nl: 'Documentaire dekking van congressen, launches en teamdagen — candid, onopvallend, met snelle oplevering voor pers en social.',
        cta_text: 'Request a quote', cta_text_nl: 'Offerte aanvragen',
        deliverables: [
          dl('Minimum 3 hours on site', 'Minimaal 3 uur op locatie'),
          dl('60+ edited images per hour', '60+ bewerkte beelden per uur'),
          dl('Next-day previews for press', 'Previews voor pers de volgende dag'),
        ],
      },
    ],
  });

  const process = section(processId, 'process', 'LumenShootProcess', {
    eyebrow: 'How a shoot works', eyebrow_nl: 'Hoe een shoot werkt',
    headline: 'Simple to book, easy on the day.', headline_nl: 'Makkelijk te boeken, ontspannen op de dag.',
    lede: '', lede_nl: '',
    steps: [
      { id: rid('st'), step_number: '01', title: 'Enquire', title_nl: 'Aanvraag',
        description: 'Send a short brief by form or WhatsApp. I reply within a day with a recommended package, a quote and two date options.',
        description_nl: 'Stuur een korte briefing via het formulier of WhatsApp. Binnen een dag krijg je een advies, een offerte en twee datumopties.' },
      { id: rid('st'), step_number: '02', title: 'Shoot day', title_nl: 'De shootdag',
        description: 'Studio or your office. I direct lightly so people relax — most headshot sessions take a few minutes per person and run on schedule.',
        description_nl: 'Studio of jouw kantoor. Ik regisseer rustig zodat mensen ontspannen — de meeste headshots duren een paar minuten per persoon en lopen op schema.' },
      { id: rid('st'), step_number: '03', title: 'Delivery', title_nl: 'Oplevering',
        description: 'You pick finals from a private gallery; I retouch and deliver web + print crops — headshots in 48 hours, larger productions within a week.',
        description_nl: 'Je kiest finals uit een privégalerij; ik retoucheer en lever web- + print-uitsnedes — headshots binnen 48 uur, grotere producties binnen een week.' },
    ],
  });

  const portfolio = section(portfolioId, 'portfolio', 'LumenCategoryGallery', {
    eyebrow: 'Selected work', eyebrow_nl: 'Geselecteerd werk',
    headline: 'The portfolio, by <em>category.</em>', headline_nl: 'Het portfolio, per <em>categorie.</em>',
    lede: 'Commercial work leads; personal work is offered on request. Click any category to open the gallery.',
    lede_nl: 'Commercieel werk staat voorop; persoonlijk werk op aanvraag. Klik op een categorie om de galerij te openen.',
    categories: [
      { id: rid('cat'), group: 'Commercial', group_nl: 'Commercieel', name: 'Corporate', name_nl: 'Zakelijk', index_label: '01 — Landscape 3:2', index_label_nl: '01 — Liggend 3:2', ratio: 'land', fig: '02', cover_image: '', images: imgs(8) },
      { id: rid('cat'), group: 'Commercial', group_nl: 'Commercieel', name: 'Product & Food', name_nl: 'Product & Food', index_label: '', index_label_nl: '', ratio: 'land', fig: '03', cover_image: '', images: imgs(6) },
      { id: rid('cat'), group: 'Commercial', group_nl: 'Commercieel', name: 'Events', name_nl: 'Evenementen', index_label: '', index_label_nl: '', ratio: 'land', fig: '04', cover_image: '', images: imgs(7) },
      { id: rid('cat'), group: 'Personal', group_nl: 'Persoonlijk', name: 'Couples', name_nl: 'Koppels', index_label: '02 — Portrait 4:5 · on request', index_label_nl: '02 — Staand 4:5 · op aanvraag', ratio: 'port', fig: '05', cover_image: '', images: imgs(6) },
      { id: rid('cat'), group: 'Personal', group_nl: 'Persoonlijk', name: 'Newborn & Family', name_nl: 'Newborn & Gezin', index_label: '', index_label_nl: '', ratio: 'port', fig: '06', cover_image: '', images: imgs(7) },
      { id: rid('cat'), group: 'Personal', group_nl: 'Persoonlijk', name: 'Portraits', name_nl: 'Portretten', index_label: '', index_label_nl: '', ratio: 'port', fig: '07', cover_image: '', images: imgs(6) },
    ],
  });

  const about = section(aboutId, 'about', 'LumenPhotographerAbout', {
    eyebrow: 'About', eyebrow_nl: 'Over mij',
    headline: "I'm Kristina — a corporate photographer in <em>Den Haag.</em>",
    headline_nl: 'Ik ben Kristina — zakelijk fotograaf in <em>Den Haag.</em>',
    body: 'I photograph the people and work behind companies across the Randstad — law firms, consultancies, startups and agencies. My job is to make your team look credible and human: relaxed on the day, consistent across the brand, and ready to use the moment they land in your inbox.',
    body_nl: 'Ik fotografeer de mensen en het werk achter bedrijven in de Randstad — advocatenkantoren, consultancies, startups en bureaus. Mijn taak is je team geloofwaardig én menselijk te laten overkomen: ontspannen op de dag, consistent over het merk, en direct bruikbaar zodra ze in je inbox staan.',
    body2: 'Newborn, wedding and couples work is offered on request — ask and I’ll send recent examples.',
    body2_nl: 'Newborn-, trouw- en koppelfotografie op aanvraag — vraag ernaar en ik stuur recente voorbeelden.',
    signature: 'Kristina Kundius',
    cta_text: 'Request a quote', cta_text_nl: 'Offerte aanvragen',
    secondary_cta_text: 'See the work', secondary_cta_text_nl: 'Bekijk het werk',
    fig_caption: 'Kristina, Den Haag', fig_caption_nl: 'Kristina, Den Haag',
    fig_number: 'Fig. 08', about_image: '',
  });

  const contact = section(contactId, 'contact', 'LumenContactForm', {
    form_id: formId,
    eyebrow: 'Get in touch', eyebrow_nl: 'Neem contact op',
    headline: "Let's book your <em>shoot.</em>", headline_nl: 'Laten we je <em>shoot inplannen.</em>',
    lede: 'Tell me a little about your team or event and what you need the images for. I reply within a day with a recommendation and a quote.',
    lede_nl: 'Vertel me kort iets over je team of evenement en waar je de beelden voor nodig hebt. Binnen een dag krijg je een advies en een offerte.',
    based_in_label: 'Based in', based_in_label_nl: 'Gevestigd in',
    based_in: 'Den Haag · serving the Randstad', based_in_nl: 'Den Haag · werkzaam in de Randstad',
    phone: '+31 6 2949 3643', email: 'studio@kundius.photography',
    whatsapp_number: '31629493643', whatsapp_label: 'WhatsApp', whatsapp_label_nl: 'WhatsApp',
    book_call_url: '#', book_call_label: 'Book a call', book_call_label_nl: 'Plan een belafspraak',
    name_label: 'Name', name_label_nl: 'Naam', name_ph: 'Your name', name_ph_nl: 'Je naam',
    email_label: 'Email', email_label_nl: 'E-mail', email_ph: 'you@company.com', email_ph_nl: 'jij@bedrijf.nl',
    message_label: 'Message', message_label_nl: 'Bericht',
    message_ph: "Team size, type of shoot, rough dates, and what you'll use the images for.",
    message_ph_nl: 'Teamgrootte, type shoot, indicatieve datums, en waar je de beelden voor gebruikt.',
    submit_text: 'Send enquiry', submit_text_nl: 'Verstuur aanvraag',
    form_note: 'Prefer WhatsApp? +31 6 2949 3643 — usually the fastest reply.',
    form_note_nl: 'Liever WhatsApp? +31 6 2949 3643 — meestal het snelste antwoord.',
  });

  const footer = section(footerId, 'footer', 'LumenFooter', {
    // Footer block appends its own `.` em, so brand_text is the bare name.
    brand_text: brand, brand_text_nl: brand,
    brand_sub: 'Photography', brand_sub_nl: 'Fotografie',
    tagline: 'Corporate photography in Den Haag and across the Randstad — headshots, personal branding, brand libraries and event reportage.',
    tagline_nl: 'Zakelijke fotografie in Den Haag en de hele Randstad — headshots, personal branding, merkbibliotheken en evenementreportage.',
    contact_line: 'Den Haag, Zuid-Holland', contact_line_nl: 'Den Haag, Zuid-Holland',
    contact_phone: '+31 6 2949 3643', contact_email: 'studio@kundius.photography',
    copyright: `© 2026 ${brand} Photography · KvK Den Haag`, copyright_nl: `© 2026 ${brand} Photography · KvK Den Haag`,
    whatsapp_number: '31629493643', whatsapp_label: 'Chat with us', whatsapp_label_nl: 'Chat met ons',
    whatsapp_prefill: 'Hi Kristina, I’d like a quote for a shoot.', book_call_url: '#',
    footer_columns: [
      { id: rid('col'), heading: 'Site', heading_nl: 'Site', links: [
        { id: rid('ln'), label: 'Work', label_nl: 'Werk', href: `#${portfolioId}` },
        { id: rid('ln'), label: 'Services', label_nl: 'Diensten', href: `#${servicesId}` },
        { id: rid('ln'), label: 'About', label_nl: 'Over mij', href: `#${aboutId}` },
        { id: rid('ln'), label: 'Contact', label_nl: 'Contact', href: `#${contactId}` },
      ] },
      { id: rid('col'), heading: 'Enquire', heading_nl: 'Aanvragen', links: [
        { id: rid('ln'), label: 'WhatsApp', label_nl: 'WhatsApp', href: 'https://wa.me/31629493643' },
        { id: rid('ln'), label: 'Call +31 6 2949 3643', label_nl: 'Bel +31 6 2949 3643', href: 'tel:+31629493643' },
        { id: rid('ln'), label: 'Book a call', label_nl: 'Plan een belafspraak', href: '#' },
        { id: rid('ln'), label: 'Email me', label_nl: 'Mail mij', href: 'mailto:studio@kundius.photography' },
      ] },
    ],
    legal_links: [
      { id: rid('lg'), label: 'Privacy', label_nl: 'Privacy', href: '#' },
      { id: rid('lg'), label: 'Terms', label_nl: 'Voorwaarden', href: '#' },
    ],
  });

  const order = [headerId, heroId, logosId, servicesId, processId, portfolioId, aboutId, contactId, footerId];
  const secs = [header, hero, logos, services, process, portfolio, about, contact, footer];
  const sectionLayouts: Record<string, string> = {};
  const content: Record<string, any> = {};
  secs.forEach((s) => { sectionLayouts[s.id] = s.layout; content[s.id] = s; });

  // Seed the enquiry form so form.v1.js wires + /api/forms/submit maps fields.
  // CRITICAL: forms must be TOP-LEVEL on finalContent (sibling of `content`) — the
  // store hydrates state.forms from finalContent.forms (persistenceActions.ts) and
  // re-exports it there → published content.forms. Nesting it under content.forms
  // would leave state.forms empty and the published form would render no fields.
  const now = new Date();
  const forms = {
    [formId]: {
      id: formId,
      name: 'Enquiry',
      fields: DEFAULT_CONTACT_FIELDS,
      submitButtonText: CONTACT_SUBMIT_TEXT,
      successMessage: 'Enquiry received — I’ll reply within a day.',
      createdAt: now,
      updatedAt: now,
    },
  };

  return {
    layout: { sections: order, sectionLayouts, theme: {}, globalSettings: {} },
    content,
    forms,
    meta: { id: opts.tokenId, title, slug: '', lastUpdated: Date.now(), version: 1, tokenId: opts.tokenId },
    onboardingData: { oneLiner: `${brand} — corporate photography in Den Haag`, productName: `${brand} Photography` },
    generatedAt: Date.now(),
  };
}
