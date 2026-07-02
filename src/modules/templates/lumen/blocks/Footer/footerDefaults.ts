// Plain module (NO 'use client') — safe to import from both the edit block and the
// published renderer. Lumen footer fallbacks so the footer stays populated out of
// the box even before columns/legal are configured (the seed normally fills them).

export interface FooterColumnLink { id: string; label: string; label_nl?: string; href: string; }
export interface FooterColumn { id: string; heading: string; heading_nl?: string; links: FooterColumnLink[]; }
export interface LegalLink { id: string; label: string; label_nl?: string; href: string; }

export const DEFAULT_FOOTER_COLUMNS: FooterColumn[] = [
  {
    id: 'fc-site', heading: 'Site', heading_nl: 'Site',
    links: [
      { id: 'fl-work', label: 'Work', label_nl: 'Werk', href: '#work' },
      { id: 'fl-services', label: 'Services', label_nl: 'Diensten', href: '#services' },
      { id: 'fl-about', label: 'About', label_nl: 'Over mij', href: '#about' },
      { id: 'fl-contact', label: 'Contact', label_nl: 'Contact', href: '#contact' },
    ],
  },
  {
    id: 'fc-enquire', heading: 'Enquire', heading_nl: 'Aanvragen',
    links: [
      { id: 'fe-contact', label: 'Request a quote', label_nl: 'Offerte aanvragen', href: '#contact' },
    ],
  },
];

export const DEFAULT_LEGAL_LINKS: LegalLink[] = [
  { id: 'lg-privacy', label: 'Privacy', label_nl: 'Privacy', href: '#' },
  { id: 'lg-terms', label: 'Terms', label_nl: 'Voorwaarden', href: '#' },
];
