// Template conformance tests — scalePlan §6a/§6b (scale-01 phase 4, rule D-B).
// The "designer's bar": templateMeta declarations must be TRUE against the
// dispatch resolvers (the ground truth). A red test here means a declaration
// lies — fix the metadata (templateMeta / engineCoreSections), never weaken
// the assertions.
//
// (a) engine-core: every template with retired!==true AND bespoke!==true must,
//     for every engine it declares, resolve every section in that engine's
//     core set to a REAL block in BOTH modes ('edit' + 'published') — truthy
//     and not the template's placeholder. retired (techpremium) and bespoke
//     (lumen, D-A #2) are skipped for (a).
// (b) capability evidence: every declared BLOCK-BACKED capability must carry a
//     capabilitySections entry, and that section must resolve non-placeholder
//     in both modes. Runs for lumen too — bespoke exempts only (a), not (b).
//
// Static imports of resolvers/placeholders are fine here: test files never
// enter the app bundle (vitest-only), so the registry firewall is unaffected —
// same idiom as vestria/registration.test.ts.

import { describe, it, expect } from 'vitest';

import { templateMeta } from './templateMeta';
import { engineCoreSections } from '@/modules/engines/coreSections';
import { templateIds, type TemplateId } from '@/types/service';
import { capabilityIds, type CapabilityId } from '@/types/brief';

import { resolveMeridianBlock } from './meridian/resolveMeridianBlock';
import { MeridianPlaceholderBlock } from './meridian/MeridianPlaceholderBlock';
import { resolveTechPremiumBlock } from './techpremium/resolveTechPremiumBlock';
import { TechPremiumPlaceholderBlock } from './techpremium/TechPremiumPlaceholderBlock';
import { resolveVestriaBlock } from './vestria/resolveVestriaBlock';
import { VestriaPlaceholderBlock } from './vestria/VestriaPlaceholderBlock';
import { resolveServiceBlock as resolveHearthBlock } from './hearth/resolveServiceBlock';
import { ServicePlaceholderBlock as HearthPlaceholderBlock } from './hearth/ServicePlaceholderBlock';
import { resolveServiceBlock as resolveLexBlock } from './lex/resolveServiceBlock';
import { LexPlaceholderBlock } from './lex/LexPlaceholderBlock';
import { resolveServiceBlock as resolveSurgeBlock } from './surge/resolveServiceBlock';
import { SurgePlaceholderBlock } from './surge/SurgePlaceholderBlock';
import { resolveGranthBlock } from './granth/resolveGranthBlock';
import { GranthPlaceholderBlock } from './granth/GranthPlaceholderBlock';
import { resolveLumenBlock } from './lumen/resolveLumenBlock';
import { LumenPlaceholderBlock } from './lumen/LumenPlaceholderBlock';

type Mode = 'edit' | 'published';

const RESOLVERS: Record<
  TemplateId,
  {
    resolve: (sectionType: string, mode: Mode) => unknown;
    placeholder: unknown;
  }
> = {
  meridian: { resolve: resolveMeridianBlock, placeholder: MeridianPlaceholderBlock },
  techpremium: { resolve: resolveTechPremiumBlock, placeholder: TechPremiumPlaceholderBlock },
  vestria: { resolve: resolveVestriaBlock, placeholder: VestriaPlaceholderBlock },
  hearth: { resolve: resolveHearthBlock, placeholder: HearthPlaceholderBlock },
  lex: { resolve: resolveLexBlock, placeholder: LexPlaceholderBlock },
  surge: { resolve: resolveSurgeBlock, placeholder: SurgePlaceholderBlock },
  granth: { resolve: resolveGranthBlock, placeholder: GranthPlaceholderBlock },
  lumen: { resolve: resolveLumenBlock, placeholder: LumenPlaceholderBlock },
};

// Structural capabilities are NOT block-backed: `multipage` is page-menu
// machinery and `bilingual` is twin-field machinery — no single section/block
// evidences them, so they are exempt from the capability-evidence check (D-B).
// They remain trust-on-declaration until a structural check exists (spec 02+).
const STRUCTURAL_CAPABILITIES: readonly CapabilityId[] = ['multipage', 'bilingual'];

const MODES: readonly Mode[] = ['edit', 'published'];

function resolvesReal(templateId: TemplateId, sectionType: string): void {
  const { resolve, placeholder } = RESOLVERS[templateId];
  for (const mode of MODES) {
    const block = resolve(sectionType, mode);
    expect(block, `${templateId}/${sectionType} (${mode}) must resolve`).toBeTruthy();
    expect(
      block,
      `${templateId}/${sectionType} (${mode}) must not be the placeholder`
    ).not.toBe(placeholder);
  }
}

describe('template conformance (scalePlan §6a/§6b)', () => {
  it('has a resolver entry for every templateId (drives both checks)', () => {
    expect(Object.keys(RESOLVERS).sort()).toEqual([...templateIds].sort());
    expect(Object.keys(templateMeta).sort()).toEqual([...templateIds].sort());
  });

  // ── (a) engine-core: non-retired, non-bespoke templates ────────────────────
  describe('(a) engine-core sections resolve to real blocks in both modes', () => {
    for (const templateId of templateIds) {
      const meta = templateMeta[templateId];
      if (meta.retired === true || meta.bespoke === true) continue;

      for (const engine of meta.copyEngines) {
        describe(`${templateId} · engine "${engine}"`, () => {
          for (const sectionType of engineCoreSections[engine]) {
            it(`${sectionType}: real block (edit + published)`, () => {
              resolvesReal(templateId, sectionType);
            });
          }
        });
      }
    }
  });

  // ── (b) capability evidence: ALL templates incl. bespoke ───────────────────
  describe('(b) declared block-backed capabilities are evidenced by a real section', () => {
    for (const templateId of templateIds) {
      const meta = templateMeta[templateId];
      const blockBacked = meta.capabilities.filter(
        (c) => !STRUCTURAL_CAPABILITIES.includes(c)
      );
      if (blockBacked.length === 0) continue;

      describe(templateId, () => {
        for (const capability of blockBacked) {
          it(`${capability}: has a capabilitySections entry that resolves non-placeholder`, () => {
            const sectionType = meta.capabilitySections?.[capability];
            expect(
              sectionType,
              `${templateId} declares "${capability}" but has no capabilitySections evidence entry`
            ).toBeTruthy();
            resolvesReal(templateId, sectionType!);
          });
        }
      });
    }
  });

  // ── sanity: the STRUCTURAL exemption stays inside the closed vocab ─────────
  it('structural capability list is a subset of the closed capability vocab', () => {
    for (const c of STRUCTURAL_CAPABILITIES) {
      expect(capabilityIds).toContain(c);
    }
  });

  // ── D-A #2 documented in code: lumen skipped by (a), exercised by (b) ──────
  describe('lumen bespoke exemption (D-A #2)', () => {
    it('is bespoke → SKIPPED by engine-core (a), even though it declares "work"', () => {
      expect(templateMeta.lumen.bespoke).toBe(true);
      expect(templateMeta.lumen.copyEngines).toContain('work');
      // Proof the exemption is load-bearing: lumen does NOT satisfy work-core
      // (granth's canonical 6 — lumen has no books/writing/praise sections).
      const missing = engineCoreSections.work.filter(
        (s) => resolveLumenBlock(s, 'edit') === LumenPlaceholderBlock
      );
      expect(missing.length).toBeGreaterThan(0);
    });

    it('is still EXERCISED by capability evidence (b): gallery + lead-form resolve', () => {
      const blockBacked = templateMeta.lumen.capabilities.filter(
        (c) => !STRUCTURAL_CAPABILITIES.includes(c)
      );
      expect(blockBacked.sort()).toEqual(['gallery', 'lead-form']);
      for (const capability of blockBacked) {
        const sectionType = templateMeta.lumen.capabilitySections?.[capability];
        expect(sectionType).toBeTruthy();
        resolvesReal('lumen', sectionType!);
      }
    });
  });

  // ── retired: techpremium out of both checks by declaration shape ───────────
  it('techpremium is retired with empty engine/capability lists (out of every check)', () => {
    expect(templateMeta.techpremium.retired).toBe(true);
    expect(templateMeta.techpremium.copyEngines).toEqual([]);
    expect(templateMeta.techpremium.capabilities).toEqual([]);
  });
});
