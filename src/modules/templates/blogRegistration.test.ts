// Blog block registration smoke test (Blog Phase 1).
// Guards the SILENT casing trap for the two shared blog section types across ALL
// SIX templates: the section-id prefix ('blogpostbody-main'), each template's
// resolveBlock key, its sectionRules key, and its tokens' --blog-* vars must all
// exist under the SAME lowercase token. Drift → placeholder render + wrong
// surface + unstyled article with NO TS/build error. Blog sections deliberately
// have NO elementSchema entry (content is synthesized at publish time, never
// generated/edited), so unlike the per-template registration tests there is no
// schema assertion here.

import { describe, it, expect } from 'vitest';
import { extractSectionType } from '@/modules/generatedLanding/componentRegistry';

import BlogPostBodyBlock from './shared/blog/BlogPostBodyBlock';
import BlogIndexBlock from './shared/blog/BlogIndexBlock';

import { resolveTechPremiumBlock } from './techpremium/resolveTechPremiumBlock';
import { techPremiumSectionSurfaces } from './techpremium/sectionRules';
import { serializeBaseTokens as tpTokens } from './techpremium/tokens';

import { resolveMeridianBlock } from './meridian/resolveMeridianBlock';
import { meridianSectionSurfaces } from './meridian/sectionRules';
import { serializeBaseTokens as meridianTokens } from './meridian/tokens';

import { resolveServiceBlock as resolveHearthBlock } from './hearth/resolveServiceBlock';
import { hearthSectionSurfaces } from './hearth/sectionRules';
import { serializeBaseTokens as hearthTokens } from './hearth/tokens';

import { resolveServiceBlock as resolveLexBlock } from './lex/resolveServiceBlock';
import { lexSectionSurfaces } from './lex/sectionRules';
import { serializeBaseTokens as lexTokens } from './lex/tokens';

import { resolveServiceBlock as resolveSurgeBlock } from './surge/resolveServiceBlock';
import { surgeSectionSurfaces } from './surge/sectionRules';
import { serializeBaseTokens as surgeTokens } from './surge/tokens';

import { resolveLumenBlock } from './lumen/resolveLumenBlock';
import { lumenSectionSurfaces } from './lumen/sectionRules';
import { serializeBaseTokens as lumenTokens } from './lumen/tokens';

const BLOG_TYPES = ['blogpostbody', 'blogindex'] as const;
const SHARED = { blogpostbody: BlogPostBodyBlock, blogindex: BlogIndexBlock } as const;

const TEMPLATES: Array<{
  id: string;
  resolve: (t: string, mode: any) => any;
  surfaces: Record<string, string>;
  tokens: () => string;
}> = [
  { id: 'techpremium', resolve: resolveTechPremiumBlock, surfaces: techPremiumSectionSurfaces, tokens: tpTokens },
  { id: 'meridian', resolve: resolveMeridianBlock, surfaces: meridianSectionSurfaces, tokens: meridianTokens },
  { id: 'hearth', resolve: resolveHearthBlock, surfaces: hearthSectionSurfaces, tokens: hearthTokens },
  { id: 'lex', resolve: resolveLexBlock, surfaces: lexSectionSurfaces, tokens: lexTokens },
  { id: 'surge', resolve: resolveSurgeBlock, surfaces: surgeSectionSurfaces, tokens: surgeTokens },
  { id: 'lumen', resolve: resolveLumenBlock, surfaces: lumenSectionSurfaces, tokens: lumenTokens },
];

describe('blog block registration (all templates)', () => {
  for (const tmpl of TEMPLATES) {
    for (const type of BLOG_TYPES) {
      it(`${tmpl.id} / ${type}: resolves the SHARED block for edit + published`, () => {
        expect(tmpl.resolve(type, 'edit')).toBe(SHARED[type]);
        expect(tmpl.resolve(type, 'published')).toBe(SHARED[type]);
      });

      it(`${tmpl.id} / ${type}: has an explicit surface entry`, () => {
        expect(Object.prototype.hasOwnProperty.call(tmpl.surfaces, type)).toBe(true);
      });
    }

    it(`${tmpl.id}: tokens define the --blog-* styling contract`, () => {
      const css = tmpl.tokens();
      for (const v of ['--blog-ink', '--blog-ink-2', '--blog-line', '--blog-accent', '--blog-accent-on']) {
        expect(css, `${tmpl.id} missing ${v}`).toContain(`${v}:`);
      }
    });
  }

  for (const type of BLOG_TYPES) {
    it(`extractSectionType round-trips a '${type}-…' id`, () => {
      expect(extractSectionType(`${type}-main`)).toBe(type);
    });
  }
});
