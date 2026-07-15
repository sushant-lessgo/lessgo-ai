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
import { WorkGalleryGridCore } from './blocks/Gallery/WorkGalleryGrid.core';
import { WorkProofTestimonialsCore } from './blocks/Proof/WorkProofTestimonials.core';
import { WorkContactCore } from './blocks/Contact/WorkContact.core';
import { WorkFooterCore } from './blocks/Footer/WorkFooter.core';

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

  it('finds all 6 pilot block cores', () => {
    expect(files.length).toBe(6);
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
      [WorkGalleryGridCore as any, { eyebrow: 'Work', heading: 'The work', lead: 'x', groups: [{ id: 'g1', name: 'Brand shoot', cover_image: '', href: '#work' }] }, 'Brand shoot'],
      [WorkProofTestimonialsCore as any, { eyebrow: 'Kind words', heading: 'What clients say', quotes: [{ id: 'q1', text: 'Loved every frame.', source: 'Client' }] }, 'Loved every frame.'],
      [WorkContactCore as any, { eyebrow: 'Get in touch', heading: 'Let’s work together', lead: 'x', contact_method: 'whatsapp', cta_label: 'Message me' }, 'Message me'],
      [WorkFooterCore as any, { eyebrow: 'x', heading: 'Let’s make yours.', note: 'A closing line.', copyright: '© 2026' }, 'A closing line.'],
    ];
    for (const [Core, content, expected] of fixtures) {
      const html = renderToStaticMarkup(React.createElement(Core, { content, E, sectionId }));
      expect(html).toContain(expected);
    }
  });
});
