// MANDATORY core-purity guard (single-source pattern). Every work-skeleton block
// `*.core.tsx` MUST be a plain server-safe module: no 'use client', no hooks/stores,
// no edit-primitive imports — it renders ONLY through injected primitives. This
// test (a) statically scans each core's source for forbidden imports and (b)
// renders each core with the PUBLISHED primitives via renderToStaticMarkup, so any
// hook/store creeping into a core fails `npm run test:run` instead of 500ing at
// publish. Clone of granth/atelier coreParity, adapted for the sectionId-taking
// work cores.

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { makePublishedPrimitives } from './blocks/publishedPrimitives';

import { WorkHeaderCore } from './blocks/Header/WorkHeader.core';
import { WorkHeroSliderCore } from './blocks/Hero/WorkHeroSlider.core';
import { WorkHeroImageCore } from './blocks/Hero/WorkHeroImage.core';
import { WorkHeroSplitCore } from './blocks/Hero/WorkHeroSplit.core';
import { WorkHeroCenterCore } from './blocks/Hero/WorkHeroCenter.core';
import { WorkGalleryGridCore } from './blocks/Gallery/WorkGalleryGrid.core';
import { WorkGalleryMasonryCore } from './blocks/Gallery/WorkGalleryMasonry.core';
import { WorkGalleryStripCore } from './blocks/Gallery/WorkGalleryStrip.core';
import { WorkProofTestimonialsCore } from './blocks/Proof/WorkProofTestimonials.core';
import { WorkProofLogosCore } from './blocks/Proof/WorkProofLogos.core';
import { WorkProofResultsCore } from './blocks/Proof/WorkProofResults.core';
import { WorkContactCore } from './blocks/Contact/WorkContact.core';
import { WorkFooterCore } from './blocks/Footer/WorkFooter.core';
import { WorkPackagesCore } from './blocks/Packages/WorkPackages.core';
import { WorkAboutCore } from './blocks/About/WorkAbout.core';
import { WorkFaqCore } from './blocks/Faq/WorkFaq.core';
import { WorkResultsCore } from './blocks/Results/WorkResults.core';

const BLOCKS_DIR = path.join(__dirname, 'blocks');

function coreFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...coreFiles(full));
    else if (entry.name.endsWith('.core.tsx')) out.push(full);
  }
  return out;
}

const FORBIDDEN = [
  'useEditStore',
  'useWorkBlock',
  'editPrimitives',
  'WorkEditable',
  'useState(',
  'useEffect(',
];

describe('Work-skeleton core-purity (single-source guard)', () => {
  const files = coreFiles(BLOCKS_DIR);

  it('finds all 17 block cores (6 pilot + 7 phase-6 variants + 4 phase-7 sections)', () => {
    expect(files.length).toBe(17);
  });

  for (const file of files) {
    const rel = path.relative(BLOCKS_DIR, file);
    it(`${rel}: no client/edit imports`, () => {
      const src = fs.readFileSync(file, 'utf8');
      expect(src, `${rel} must not carry a 'use client' directive`).not.toMatch(/^\s*['"]use client['"]/m);
      const code = src.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
      for (const token of FORBIDDEN) {
        expect(code, `${rel} must not reference ${token}`).not.toContain(token);
      }
    });
  }

  it('all cores render server-side (renderToStaticMarkup) with published primitives', () => {
    const E = makePublishedPrimitives();
    const sectionId = 'parity';
    const fixtures: Array<[React.FC<any>, any, string]> = [
      [WorkHeaderCore as any, { logo_text: 'Studio', cta_label: 'Start a project', cta_href: '#contact', nav_links: [{ id: 'n1', label: 'Work', href: '#work' }] }, 'Start a project'],
      [WorkHeroSliderCore as any, { role_line: 'Photographer', name: 'Studio <em>Name</em>', quote: 'A short line.', cta_label: 'Start', cta_href: '#contact', portrait_image: '' }, 'A short line.'],
      [WorkHeroImageCore as any, { role_line: 'Photographer', name: 'Studio <em>Name</em>', quote: 'Image hero line.', cta_label: 'Start', cta_href: '#contact', portrait_image: '' }, 'Image hero line.'],
      [WorkHeroSplitCore as any, { role_line: 'Photographer', name: 'Studio <em>Name</em>', quote: 'Split hero line.', cta_label: 'Start', cta_href: '#contact', portrait_image: '' }, 'Split hero line.'],
      [WorkHeroCenterCore as any, { role_line: 'Photographer', name: 'Studio <em>Name</em>', quote: 'Center hero line.', cta_label: 'Start', cta_href: '#contact' }, 'Center hero line.'],
      [WorkGalleryGridCore as any, { eyebrow: 'Work', heading: 'The work', lead: 'x', groups: [{ id: 'g1', name: 'Brand shoot', cover_image: '', href: '#work' }] }, 'Brand shoot'],
      [WorkGalleryMasonryCore as any, { eyebrow: 'Work', heading: 'The work', lead: 'x', groups: [{ id: 'g1', name: 'Masonry group', cover_image: '', href: '#work' }] }, 'Masonry group'],
      [WorkGalleryStripCore as any, { eyebrow: 'Work', heading: 'The work', lead: 'x', groups: [{ id: 'g1', name: 'Strip group', cover_image: '', href: '#work' }] }, 'Strip group'],
      [WorkProofTestimonialsCore as any, { eyebrow: 'Kind words', heading: 'What clients say', quotes: [{ id: 'q1', text: 'Loved every frame.', source: 'Client' }] }, 'Loved every frame.'],
      [WorkProofLogosCore as any, { eyebrow: 'Trusted by', heading: 'Selected clients', logos: [{ id: 'l1', name: 'Northwind', image: '' }] }, 'Northwind'],
      [WorkProofResultsCore as any, { eyebrow: 'The numbers', heading: 'Results', metrics: [{ id: 'm1', value: '98%', label: 'Would book again' }] }, 'Would book again'],
      [WorkContactCore as any, { eyebrow: 'Get in touch', heading: 'Let’s work together', lead: 'x', contact_method: 'whatsapp', cta_label: 'Message me' }, 'Message me'],
      [WorkFooterCore as any, { eyebrow: 'x', heading: 'Let’s make yours.', note: 'A closing line.', copyright: '© 2026' }, 'A closing line.'],
      [WorkPackagesCore as any, { eyebrow: 'Packages', heading: 'Ways to work', lead: 'x', packages: [{ id: 'p1', name: 'Full package', price_mode: 'from', price_line: '€2,400', description: 'Everything included.', cta_label: 'Enquire →' }] }, '€2,400'],
      [WorkAboutCore as any, { eyebrow: 'About', heading: 'The person', bio: 'A short honest bio.', facts: [{ id: 'a1', value: '10+ yrs', label: 'Experience' }] }, 'A short honest bio.'],
      [WorkFaqCore as any, { eyebrow: 'FAQ', heading: 'Questions', items: [{ id: 'q1', question: 'How soon?', answer: 'Two weeks typically.' }] }, 'Two weeks typically.'],
      [WorkResultsCore as any, { eyebrow: 'Outcomes', heading: 'Results', lead: 'x', metrics: [{ id: 'r1', value: '3×', label: 'More engagement' }] }, 'More engagement'],
    ];
    for (const [Core, content, expected] of fixtures) {
      const html = renderToStaticMarkup(React.createElement(Core, { content, E, sectionId }));
      expect(html).toContain(expected);
    }
  });
});
