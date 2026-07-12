// MANDATORY core-purity guard (single-source pattern). Every Atelier block
// `*.core.tsx` MUST be a plain server-safe module: no 'use client', no hooks/stores,
// no Editable/edit-primitive imports — it renders ONLY through injected primitives.
// This test (a) statically scans each core's source for forbidden imports and
// (b) renders each core with the PUBLISHED primitives via renderToStaticMarkup, so
// any hook/store creeping into a core fails `npm run test:run` instead of 500ing
// at publish.

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { makePublishedPrimitives } from './blocks/publishedPrimitives';

import { AtelierNavHeaderCore } from './blocks/Header/AtelierNavHeader.core';
import { AtelierHeroCore } from './blocks/Hero/AtelierHero.core';
import { AtelierWorkGalleryCore } from './blocks/Work/AtelierWorkGallery.core';
import { AtelierPackagesCore } from './blocks/Packages/AtelierPackages.core';
import { AtelierAboutCore } from './blocks/About/AtelierAbout.core';
import { AtelierQuoteBandCore } from './blocks/Quote/AtelierQuoteBand.core';
import { AtelierContactCore } from './blocks/Contact/AtelierContact.core';
import { AtelierFooterCore } from './blocks/Footer/AtelierFooter.core';

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
  'useAtelierBlock',
  'editPrimitives',
  'AtelierEditable',
  'useState(',
  'useEffect(',
];

describe('Atelier core-purity (single-source guard)', () => {
  const files = coreFiles(BLOCKS_DIR);

  it('finds all 8 block cores', () => {
    expect(files.length).toBe(8);
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
    const fixtures: Array<[React.FC<any>, any, string]> = [
      [AtelierNavHeaderCore as any, { logo_text: 'Studio', cta_text: 'Get in touch', nav_items: [{ id: 'n1', label: 'Work', href: '#work' }] }, 'Get in touch'],
      [AtelierHeroCore as any, { headline: 'Work that <em>holds the room.</em>', lede: 'A short line.', cta_text: 'View the work' }, 'View the work'],
      [AtelierWorkGalleryCore as any, { headline: 'Selected work', works: [{ id: 'w1', title: 'Series A', caption: 'c', image: '' }] }, 'Series A'],
      [AtelierPackagesCore as any, { headline: 'Ways to work together', packages: [{ id: 'p1', name: 'Sitting', price_display: 'From £400', summary: 's', features: ['One hour', 'Ten images'], cta_text: 'Enquire' }] }, 'Sitting'],
      [AtelierAboutCore as any, { headline: 'About the studio', body: 'We make things.' }, 'We make things.'],
      [AtelierQuoteBandCore as any, { quote: 'Loved every frame.', author_name: 'Rana', author_role: 'Director' }, 'Loved every frame.'],
      [AtelierContactCore as any, { headline: 'Let’s work together', lede: 'x', email: 'hello@studio.com' }, 'hello@studio.com'],
      [AtelierFooterCore as any, { brand_text: 'Studio', tagline: 'Managed portraiture.', copyright: '© 2026' }, 'Managed portraiture.'],
    ];
    for (const [Core, content, expected] of fixtures) {
      const html = renderToStaticMarkup(React.createElement(Core, { content, E }));
      expect(html).toContain(expected);
    }
  });
});
