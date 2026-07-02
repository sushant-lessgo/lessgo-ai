// Plain module (NO 'use client') — safe to import from both the edit block and the
// published renderer. Mirrors the footer's previously-hardcoded "Studio" column so the
// footer stays 4-up out of the box, even before any footer_links are configured.

export interface FooterLink {
  id: string;
  label: string;
  href: string;
}

export const DEFAULT_FOOTER_LINKS: FooterLink[] = [
  { id: 'fl-about', label: 'About', href: '#about' },
  { id: 'fl-work', label: 'Work', href: '#casestudies' },
  { id: 'fl-clients', label: 'Clients', href: '#testimonials' },
  { id: 'fl-contact', label: 'Contact', href: '#contact' },
];
