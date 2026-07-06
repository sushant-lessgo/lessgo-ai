// MANDATORY core-purity guard (single-source pattern). Every Vestria block
// `*.core.tsx` MUST be a plain server-safe module: no 'use client', no hooks/stores,
// no Editable/edit-primitive imports — it renders ONLY through injected primitives.
// This test (a) statically scans each core's source for forbidden imports and
// (b) renders each core with the PUBLISHED primitives via renderToStaticMarkup, so
// any hook/store creeping into a core fails `npm run test:run` instead of 500ing
// at publish. If a block ever needs edit-only structure, pair-clone THAT block.

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { makePublishedPrimitives } from './blocks/publishedPrimitives';

import { VestriaNavHeaderCore } from './blocks/Header/VestriaNavHeader.core';
import { VestriaTailoredHeroCore } from './blocks/Hero/VestriaTailoredHero.core';
import { VestriaFullBleedHeroCore } from './blocks/Hero/VestriaFullBleedHero.core';
import { VestriaClientStripCore } from './blocks/Trust/VestriaClientStrip.core';
import { VestriaIndustriesGridCore } from './blocks/Industries/VestriaIndustriesGrid.core';
import { VestriaAboutStatsCore } from './blocks/About/VestriaAboutStats.core';
import { VestriaServicesGridCore } from './blocks/Features/VestriaServicesGrid.core';
import { VestriaCatalogueGridCore } from './blocks/Catalog/VestriaCatalogueGrid.core';
import { VestriaMaterialsCore } from './blocks/Materials/VestriaMaterials.core';
import { VestriaProcessRailCore } from './blocks/Process/VestriaProcessRail.core';
import { VestriaQuotesCore } from './blocks/Testimonials/VestriaQuotes.core';
import { VestriaLeadFormCore } from './blocks/Contact/VestriaLeadForm.core';
import { VestriaFooterCore } from './blocks/Footer/VestriaFooter.core';

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
  'useVestriaBlock',
  'editPrimitives',
  'VestriaEditable',
  'useState(',
  'useEffect(',
];

describe('Vestria core-purity (single-source guard)', () => {
  const files = coreFiles(BLOCKS_DIR);

  it('finds all 13 block cores', () => {
    expect(files.length).toBe(13);
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
      [VestriaNavHeaderCore as any, { logo_text: 'Vestria', cta_text: 'Request a Quote', util_note: 'Since 2009', util_tel: '+971 4 352 1700', nav_items: [{ id: 'n1', label: 'Industries', href: '#industries' }] }, 'Request a Quote'],
      [VestriaTailoredHeroCore as any, { tag_text: 'Uniform Manufacturing', headline: 'Teams that <em>mean business.</em>', lede: 'From hotels to hangars.', cta_text: 'Request a Quote', stamp_value: '40k+', stamp_label: 'Garments / year', values: [{ id: 'v1', kicker: '01', title: 'Quality', description: 'QC on every batch.' }] }, 'mean business.'],
      [VestriaFullBleedHeroCore as any, { tag_text: 'Uniform Manufacturing', headline: 'Teams that <em>mean business.</em>', lede: 'From hotels to hangars.', cta_text: 'Request a Quote', hero_video_desktop: 'https://blob.example/clip-d.mp4', hero_video_mobile: 'https://blob.example/clip-m.mp4', hero_video_poster: 'https://blob.example/poster.jpg', stamp_value: '40k+', stamp_label: 'Garments / year', values: [{ id: 'v1', kicker: 'Organisations outfitted', title: '300+', description: '' }] }, 'mean business.'],
      [VestriaClientStripCore as any, { label_text: 'Trusted across the Gulf', logos: [{ id: 'l1', name: 'Marisol', sub: 'Hospitality' }] }, 'Marisol'],
      [VestriaIndustriesGridCore as any, { headline: 'Every floor you run.', industries: [{ id: 'i1', kicker: 'Sector 01', title: 'Hospitality', description: 'Front desk to F&B.' }] }, 'Hospitality'],
      [VestriaAboutStatsCore as any, { headline: 'Dressing excellence.', lede: 'More than a supplier.', stats: [{ id: 's1', value: '2009', label: 'Since' }] }, 'Dressing excellence.'],
      [VestriaServicesGridCore as any, { headline: 'Value-added services.', features: [{ id: 'f1', kicker: 'SVC / 01', title: 'Custom Design', description: 'Tech packs first.' }] }, 'Custom Design'],
      [VestriaCatalogueGridCore as any, { headline: 'A style for every station.', items: [{ id: 'c1', code: 'C-04', title: 'Chef Jacket', category: 'Culinary', glyph: 'Chef jacket' }] }, 'Chef Jacket'],
      [VestriaMaterialsCore as any, { headline: 'Chosen for the work.', swatches: [{ id: 'w1', name: 'Navy Twill', code: '/ 04', color: '#2b3a5c' }], rows: [{ id: 'r1', name: 'Poly-cotton Twill', use: 'Housekeeping' }] }, 'Navy Twill'],
      [VestriaProcessRailCore as any, { headline: 'One accountable team.', steps: [{ id: 'p1', kicker: 'Step 01', title: 'Consult', description: 'We learn your roles.' }] }, 'Consult'],
      [VestriaQuotesCore as any, { headline: 'Stopped shopping around.', testimonials: [{ id: 't1', quote: 'Painless opening.', author_name: 'Rana', author_role: 'Procurement' }] }, 'Painless opening.'],
      [VestriaLeadFormCore as any, { headline: 'Tell us who you are outfitting.', lede: 'A named manager replies.', assurances: [{ id: 'a1', kicker: '01', text: 'No obligation.' }] }, 'No obligation.'],
      [VestriaFooterCore as any, { brand_text: 'Vestria', blurb: 'Managed wardrobe programmes.', copyright: '© 2026', tagline: 'Wear better.' }, 'Managed wardrobe programmes.'],
    ];
    for (const [Core, content, expected] of fixtures) {
      const html = renderToStaticMarkup(React.createElement(Core, { content, E }));
      expect(html).toContain(expected);
    }
  });

  // Full-bleed hero <video> contract: static markup MUST carry muted + autoplay +
  // playsinline (React can drop `muted` in server markup → mobile autoplay dies
  // silently) and the poster; no clip → NO <video> (poster-only fallback).
  it('full-bleed hero emits muted/autoplay/playsinline videos; poster-only without clips', () => {
    const E = makePublishedPrimitives();
    const withClips = renderToStaticMarkup(React.createElement(VestriaFullBleedHeroCore as any, {
      E,
      content: {
        headline: 'H', hero_video_desktop: 'https://blob.example/d.mp4',
        hero_video_mobile: 'https://blob.example/m.mp4', hero_video_poster: 'https://blob.example/p.jpg',
      },
    }));
    const videos = withClips.match(/<video[^>]*>/g) || [];
    expect(videos.length).toBe(2);
    for (const tag of videos) {
      expect(tag).toContain('muted');
      expect(tag).toContain('autoplay');
      expect(tag).toContain('playsinline');
      expect(tag).toContain('poster="https://blob.example/p.jpg"');
    }
    expect(withClips).toContain('vs-heroFull__video--desktop');
    expect(withClips).toContain('vs-heroFull__video--mobile');

    const noClips = renderToStaticMarkup(React.createElement(VestriaFullBleedHeroCore as any, {
      E,
      content: { headline: 'H', hero_image: 'https://blob.example/img.jpg' },
    }));
    expect(noClips).not.toContain('<video');
    expect(noClips).toContain('https://blob.example/img.jpg');
  });
});
