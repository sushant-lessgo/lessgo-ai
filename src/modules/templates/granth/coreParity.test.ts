// MANDATORY core-purity guard (single-source pilot, doc §3.5). Every Granth block
// `*.core.tsx` MUST be a plain server-safe module: no 'use client', no hooks/stores,
// no Editable/edit-primitive imports — it renders ONLY through injected primitives.
// This test (a) statically scans each core's source for forbidden imports and
// (b) renders each core with the PUBLISHED primitives via renderToStaticMarkup, so
// any hook/store creeping into a core fails `npm run test:run` instead of 500ing at
// publish. If a block ever needs edit-only structure, pair-clone THAT block instead.

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { makePublishedPrimitives } from './blocks/publishedPrimitives';

import { GranthHeroCore } from './blocks/Hero/GranthHero.core';
import { GranthAboutCore } from './blocks/About/GranthAbout.core';
import { GranthBooksCore } from './blocks/Books/GranthBooks.core';
import { GranthWritingCore } from './blocks/Writing/GranthWriting.core';
import { GranthPraiseCore } from './blocks/Praise/GranthPraise.core';
import { GranthFooterCore } from './blocks/Footer/GranthFooter.core';

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

// Substring tokens that must never appear in a core (imports / hook calls).
const FORBIDDEN = [
  'useEditStore',
  'useGranthBlock',
  'editPrimitives',
  'GranthEditable',
  'useState(',
  'useEffect(',
];

describe('Granth core-purity (single-source guard §3.5)', () => {
  const files = coreFiles(BLOCKS_DIR);

  it('finds all 6 block cores', () => {
    expect(files.length).toBe(6);
  });

  for (const file of files) {
    const rel = path.relative(BLOCKS_DIR, file);
    it(`${rel}: no client/edit imports`, () => {
      const src = fs.readFileSync(file, 'utf8');
      // No 'use client' DIRECTIVE (matched as a statement, so the word may still
      // appear in prose comments).
      expect(src, `${rel} must not carry a 'use client' directive`).not.toMatch(/^\s*['"]use client['"]/m);
      // No forbidden imports / hook calls (scan non-comment lines only).
      const code = src.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
      for (const token of FORBIDDEN) {
        expect(code, `${rel} must not reference ${token}`).not.toContain(token);
      }
    });
  }

  it('all cores render server-side (renderToStaticMarkup) with published primitives', () => {
    const E = makePublishedPrimitives();
    const fixtures: Array<[React.FC<any>, any, string]> = [
      [GranthHeroCore as any, { name: 'केशव नारायण', role_line: 'कवि', socials: [{ id: 's1', network: 'facebook', href: '#' }] }, 'केशव नारायण'],
      [GranthAboutCore as any, { heading: 'जीवन और लेखन', bio: '<p>परिचय</p>', facts: [{ id: 'f1', value: '१९४८', label: 'जन्म' }] }, 'जीवन और लेखन'],
      [GranthBooksCore as any, { heading: 'कृतियाँ', items: [{ id: 'b1', title: 'वन', kind: 'कविता', year: '२०२१', blurb: 'x', buy_url: 'https://a.co' }] }, 'वन'],
      [GranthWritingCore as any, { title: 'सुबह', poem: 'ओस\nबूँद', signature: '— अरण्य' }, 'सुबह'],
      [GranthPraiseCore as any, { heading: 'आलोचकों', quotes: [{ id: 'q1', text: 'ठहराव', source: '— हंस' }] }, 'ठहराव'],
      [GranthFooterCore as any, { heading: 'जुड़िए', socials: [{ id: 's2', network: 'youtube', href: '#' }] }, 'जुड़िए'],
    ];
    for (const [Core, content, expected] of fixtures) {
      const html = renderToStaticMarkup(React.createElement(Core, { content, E }));
      expect(html).toContain(expected);
    }
  });
});
