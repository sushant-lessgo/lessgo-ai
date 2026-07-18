// src/modules/engines/workContract.test.ts
// ============================================================================
// WORK-CONTRACT CONFORMANCE TEST (work-contract phase A / 5).
//
// The acceptance-criterion test that makes the phase-A freeze self-verifying.
// It pins the four freezes (section set + element contract, page vocabulary +
// archetypes, fact slots + shapes, profession rows + buyer-words), the D1 subset
// invariant, the D2 zero-behavior sentinel, and the D5 firewall (source scan).
// Pure data assertions — no runtime wiring is exercised (there is none yet).
// ============================================================================

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import {
  workMustSections,
  workOptionalSections,
  workProofShapes,
  workElementContract,
  workProofShapeContracts,
  type WorkSectionKey,
} from './workSections';
import {
  workPageTypeKeys,
  workPageTypes,
  workSiteArchetypes,
  proposeWorkSiteStructure,
  WORK_PAGE_GOAL_KEYS,
  defaultGoalForPage,
  addableWorkPages,
  type WorkPageTypeKey,
  type WorkPageGoalKey,
  type WorkStructureSignals,
} from './workPages';
import {
  workSlotIds,
  workSlots,
} from './workSlots';
import {
  workVocabulary,
  workPageGoalWords,
  workPageGoalBadgePrefix,
  professionWording,
  dreamClientChips,
  type WorkProfession,
} from './workVocabulary';
import { engineCoreSections } from './coreSections';
import {
  elementContracts,
  resolveEngineSectionSchema,
  thingElementContract,
} from './elementContracts';
import { engineContracts, factGroups, wizardSlots } from './inputContracts';
import {
  WorkPriceSchema,
  WorkGroupSchema,
  WorkFactsSchema,
  getWorkFacts,
} from '@/lib/schemas/workFacts.schema';
import { workCandidateBusinessKeys } from '@/modules/businessTypes/config';

const allSectionKeys: readonly WorkSectionKey[] = [
  ...workMustSections,
  ...workOptionalSections,
];

// ─────────────────────────────────────────────────────────────────────────────
// 1. Element coverage
// ─────────────────────────────────────────────────────────────────────────────

describe('element coverage', () => {
  it('every must + optional section key has a workElementContract entry', () => {
    for (const key of allSectionKeys) {
      expect(workElementContract, `missing contract for "${key}"`).toHaveProperty(key);
      expect(workElementContract[key].sectionType).toBeTruthy();
    }
  });

  it('elementContracts.work is registered and === workElementContract', () => {
    expect(elementContracts.work).toBe(workElementContract);
  });

  it('every proof shape has a proof-shape contract (default === registered proof)', () => {
    for (const shape of workProofShapes) {
      expect(workProofShapeContracts, `missing proof shape "${shape}"`).toHaveProperty(shape);
      expect(workProofShapeContracts[shape].sectionType).toBe('proof');
    }
    // The default (testimonials) IS the registered `proof` schema.
    expect(workProofShapeContracts.testimonials).toBe(workElementContract.proof);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Subset invariant (D1)
// ─────────────────────────────────────────────────────────────────────────────

describe('D1 subset invariant', () => {
  it('engineCoreSections.work ⊆ workMustSections', () => {
    const must = new Set<string>(workMustSections);
    for (const s of engineCoreSections.work) {
      expect(must.has(s), `core section "${s}" not in workMustSections`).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Vocab coverage
// ─────────────────────────────────────────────────────────────────────────────

describe('vocab coverage', () => {
  it('workVocabulary names every must + optional section key and every proof shape', () => {
    const keys = new Set<string>([...allSectionKeys, ...workProofShapes]);
    for (const key of keys) {
      const entry = workVocabulary[key];
      expect(entry, `no vocab entry for "${key}"`).toBeDefined();
      expect(entry.userLabel.length, `empty userLabel for "${key}"`).toBeGreaterThan(0);
      expect(entry.description.length, `empty description for "${key}"`).toBeGreaterThan(0);
    }
  });

  it('no vocab entry carries `flagged` (all names founder-signed-off)', () => {
    expect(Object.values(workVocabulary).filter((e) => e.flagged)).toHaveLength(0);
  });

  const professions: readonly WorkProfession[] = ['photographer', 'designer', 'writer', 'agency'];

  it('professionWording + dreamClientChips cover all 4 professions', () => {
    for (const p of professions) {
      const w = professionWording[p];
      expect(w, `no wording for "${p}"`).toBeDefined();
      expect(w.workItem.length).toBeGreaterThan(0);
      expect(w.workGroup.length).toBeGreaterThan(0);
      expect(w.processLabel.length).toBeGreaterThan(0);
      expect(w.groupFallbackLabel.length).toBeGreaterThan(0);
      expect(dreamClientChips[p], `no chips for "${p}"`).toBeDefined();
      expect(dreamClientChips[p].length).toBeGreaterThan(0);
    }
  });

  it('every work-CANDIDATE businessType key maps to a wording row (engineDecider R2)', () => {
    // Post-engineDecider "work businessTypes" = committed-`work` ∪ ambiguous with
    // `work` ∈ candidateEngines (see workCandidateBusinessKeys). writer +
    // photographer are committed work; designer + agency are ambiguous with a
    // work candidate — every one is a possible D4 work-pick and so MUST carry a
    // professionWording row.
    const workBusinessKeys = workCandidateBusinessKeys();
    expect([...workBusinessKeys].sort()).toEqual([
      'agency',
      'designer',
      'photographer',
      'writer',
    ]);
    for (const k of workBusinessKeys) {
      expect(professionWording, `no wording row for businessType "${k}"`).toHaveProperty(k);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Pages
// ─────────────────────────────────────────────────────────────────────────────

describe('pages', () => {
  it('workPageTypes covers exactly the 8 keys', () => {
    expect(workPageTypeKeys).toHaveLength(8);
    expect(Object.keys(workPageTypes).sort()).toEqual([...workPageTypeKeys].sort());
  });

  it('slugs are the fixed strings', () => {
    const expected: Record<WorkPageTypeKey, string> = {
      home: '/',
      work: '/work',
      'work-group': '/work/[group]',
      prices: '/prices',
      about: '/about',
      contact: '/contact',
      'project-story': '/work/[group]/[item]',
      blog: '/blog',
    };
    for (const key of workPageTypeKeys) {
      expect(workPageTypes[key].pathSlug, `slug for "${key}"`).toBe(expected[key]);
    }
  });

  it('all allowed/required/defaultSections ⊆ WorkSectionKeys', () => {
    const sectionSet = new Set<string>(allSectionKeys);
    for (const key of workPageTypeKeys) {
      const def = workPageTypes[key];
      for (const list of [def.allowedSections, def.requiredSections, def.defaultSections]) {
        for (const s of list) {
          expect(sectionSet.has(s), `page "${key}" section "${s}" not a WorkSectionKey`).toBe(true);
        }
      }
    }
  });

  it('each archetype is a page-vocab list with `home` first', () => {
    const vocab = new Set<string>(workPageTypeKeys);
    for (const [name, pages] of Object.entries(workSiteArchetypes)) {
      expect(pages[0], `archetype "${name}" must start with home`).toBe('home');
      for (const p of pages) {
        expect(vocab.has(p), `archetype "${name}" page "${p}" not in vocab`).toBe(true);
      }
    }
  });

  it('proposeWorkSiteStructure is deterministic + clamped at the boundaries', () => {
    const bareMinimum: WorkStructureSignals = {
      workItemCount: 1,
      groupCount: 0,
      pricesPresent: false,
      established: false,
    };
    const richWithPrices: WorkStructureSignals = {
      workItemCount: 24,
      groupCount: 4,
      pricesPresent: true,
      established: true,
    };

    // Deterministic: identical output on repeat calls.
    expect(proposeWorkSiteStructure(bareMinimum)).toEqual(proposeWorkSiteStructure(bareMinimum));

    // bare-minimum → one-pager
    const lean = proposeWorkSiteStructure(bareMinimum);
    expect(lean.archetype).toBe('one-pager');
    expect(lean.pages).toEqual(['home']);

    // rich + prices → standard
    const full = proposeWorkSiteStructure(richWithPrices);
    expect(full.archetype).toBe('standard');

    // Invariants across a spread of signals: pages ⊆ vocab, home first, and
    // blog / project-story are NEVER auto-proposed.
    const vocab = new Set<string>(workPageTypeKeys);
    const fixtures: WorkStructureSignals[] = [
      bareMinimum,
      richWithPrices,
      { workItemCount: 5, groupCount: 2, pricesPresent: false, established: false },
      { workItemCount: 10, groupCount: 3, pricesPresent: true, established: false },
      { workItemCount: 2, groupCount: 1, pricesPresent: true, established: false },
    ];
    for (const s of fixtures) {
      const p = proposeWorkSiteStructure(s);
      expect(p.pages[0]).toBe('home');
      for (const page of p.pages) {
        expect(vocab.has(page)).toBe(true);
      }
      expect(p.pages).not.toContain('blog');
      expect(p.pages).not.toContain('project-story');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4b. Per-page goals (E4 plan screen)
// ─────────────────────────────────────────────────────────────────────────────

describe('per-page goals (E4)', () => {
  it('the goal enum mirrors the contactMethod rail (whatsapp|booking|form)', () => {
    expect([...WORK_PAGE_GOAL_KEYS].sort()).toEqual(['booking', 'form', 'whatsapp']);
  });

  it('every WorkPageGoalKey has a workPageGoalWords entry with a userLabel', () => {
    for (const key of WORK_PAGE_GOAL_KEYS) {
      const entry = workPageGoalWords[key];
      expect(entry, `no goal word for "${key}"`).toBeDefined();
      expect(entry.userLabel.length, `empty userLabel for "${key}"`).toBeGreaterThan(0);
    }
    // No stray keys beyond the closed enum.
    expect(Object.keys(workPageGoalWords).sort()).toEqual([...WORK_PAGE_GOAL_KEYS].sort());
    expect(workPageGoalBadgePrefix.length).toBeGreaterThan(0);
  });

  it('defaultGoalForPage: contact→form; non-contact page→contactMethod', () => {
    const methods: WorkPageGoalKey[] = ['whatsapp', 'booking', 'form'];
    for (const m of methods) {
      // Contact page always defaults to the form, regardless of contactMethod.
      expect(defaultGoalForPage('contact', m)).toBe('form');
      // A non-contact page inherits the seller's contact method.
      expect(defaultGoalForPage('home', m)).toBe(m);
      expect(defaultGoalForPage('work', m)).toBe(m);
    }
    // Absent contactMethod → neutral 'form' fallback (contact stays 'form' too).
    expect(defaultGoalForPage('home')).toBe('form');
    expect(defaultGoalForPage('contact')).toBe('form');
  });

  it('addableWorkPages excludes work-group + present pages, never returns home', () => {
    const present = ['home', 'work', 'contact'];
    const addable = addableWorkPages(present);
    // Parametric group page never offered.
    expect(addable).not.toContain('work-group');
    // home is required — never in the add menu.
    expect(addable).not.toContain('home');
    // Already-present pages are excluded.
    expect(addable).not.toContain('work');
    expect(addable).not.toContain('contact');
    // The remaining designed adds ARE offered (incl. blog + project-story).
    expect(addable).toContain('prices');
    expect(addable).toContain('about');
    expect(addable).toContain('blog');
    expect(addable).toContain('project-story');
    // Every returned key is a real page-type key.
    const vocab = new Set<string>(workPageTypeKeys);
    for (const k of addable) expect(vocab.has(k)).toBe(true);
    // From an empty plan, home is still never addable.
    expect(addableWorkPages([])).not.toContain('home');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Facts (zod fixtures + slot table)
// ─────────────────────────────────────────────────────────────────────────────

describe('facts', () => {
  it('a flat group (photos only) parses', () => {
    const r = WorkGroupSchema.safeParse({
      name: 'Weddings',
      kind: 'category',
      price: { mode: 'on-request' },
      photos: [{ id: 'p1', url: 'x', cover: true }],
    });
    expect(r.success).toBe(true);
  });

  it('a two-level group (items with photos) parses', () => {
    const r = WorkGroupSchema.safeParse({
      name: 'Case studies',
      kind: 'story',
      price: { mode: 'exact', amount: 1500, currency: 'USD' },
      items: [
        { name: 'Acme rebrand', photos: [{ id: 'a1' }], client: 'Acme', result: '3x leads' },
      ],
    });
    expect(r.success).toBe(true);
  });

  it('the `kind` union is enforced', () => {
    const r = WorkGroupSchema.safeParse({
      name: 'X',
      kind: 'bogus',
      price: { mode: 'on-request' },
    });
    expect(r.success).toBe(false);
  });

  it('exact/from price without amount is rejected; on-request without amount passes', () => {
    expect(WorkPriceSchema.safeParse({ mode: 'exact' }).success).toBe(false);
    expect(WorkPriceSchema.safeParse({ mode: 'from' }).success).toBe(false);
    expect(WorkPriceSchema.safeParse({ mode: 'exact', amount: 100 }).success).toBe(true);
    expect(WorkPriceSchema.safeParse({ mode: 'on-request' }).success).toBe(true);
  });

  it('getWorkFacts safe-reads brief.facts.work', () => {
    expect(getWorkFacts(undefined)).toBeNull();
    expect(getWorkFacts({})).toBeNull();
    const facts = getWorkFacts({
      work: {
        identity: { name: 'Jane' },
        groups: [{ name: 'G', kind: 'category', price: { mode: 'on-request' } }],
        contactMethod: 'whatsapp',
      },
    });
    expect(facts).not.toBeNull();
    expect(facts?.identity?.name).toBe('Jane');
  });

  it('8 slot ids are unique', () => {
    expect(workSlotIds).toHaveLength(8);
    expect(new Set(workSlotIds).size).toBe(8);
    expect(workSlots).toHaveLength(8);
  });

  it("every slot's field validates against factGroups + wizardSlots", () => {
    const groups = new Set<string>(factGroups);
    const slots = new Set<string>(wizardSlots);
    for (const s of workSlots) {
      expect(groups.has(s.field.group), `slot "${s.id}" bad group`).toBe(true);
      expect(slots.has(s.field.slot), `slot "${s.id}" bad slot`).toBe(true);
    }
  });

  it('the price slot is required; contactMethod is neverSilent', () => {
    const price = workSlots.find((s) => s.id === 'price');
    expect(price?.field.requirement).toBe('required');
    const contact = workSlots.find((s) => s.id === 'contactMethod');
    expect(contact?.neverSilent).toBe(true);
  });

  it('every slot factsPath resolves into WorkFactsSchema.shape', () => {
    const shapeKeys = new Set(Object.keys(WorkFactsSchema.shape));
    for (const s of workSlots) {
      if (s.factsPath === 'groups[].price') {
        // price value lives on each group — its top-level anchor is `groups`.
        expect(shapeKeys.has('groups')).toBe(true);
      } else {
        expect(shapeKeys.has(s.factsPath), `factsPath "${s.factsPath}" not in shape`).toBe(true);
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Firewall (D5) — source scan
// ─────────────────────────────────────────────────────────────────────────────

describe('D5 firewall (source scan)', () => {
  const files: Record<string, string> = {
    'workSections.ts': path.join(__dirname, 'workSections.ts'),
    'workPages.ts': path.join(__dirname, 'workPages.ts'),
    'workSlots.ts': path.join(__dirname, 'workSlots.ts'),
    'workVocabulary.ts': path.join(__dirname, 'workVocabulary.ts'),
    'workFacts.schema.ts': path.join(__dirname, '..', '..', 'lib', 'schemas', 'workFacts.schema.ts'),
  };

  /** Strip block + line comments so comment prose can't trip the scan. */
  function stripComments(src: string): string {
    return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  }

  /** Value-import specifiers only (skips erased `import type` lines). */
  function valueImportSpecifiers(src: string): string[] {
    const specifiers: string[] = [];
    const re = /import\s+(type\s+)?[\s\S]*?from\s*['"]([^'"]+)['"]/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) {
      if (m[1]) continue; // `import type … ` — erased at compile, firewall-irrelevant
      specifiers.push(m[2]);
    }
    return specifiers;
  }

  const forbidden = [/^@\/stores/, /^@\/hooks/, /^react$/, /^react\//, /^@\/modules\/templates\//];

  for (const [name, file] of Object.entries(files)) {
    it(`${name} imports no runtime/UI modules and has no templateId/skeletonId literals`, () => {
      expect(fs.existsSync(file), `source not found: ${file}`).toBe(true);
      const code = stripComments(fs.readFileSync(file, 'utf8'));

      for (const spec of valueImportSpecifiers(code)) {
        for (const pat of forbidden) {
          expect(pat.test(spec), `${name} imports forbidden "${spec}"`).toBe(false);
        }
      }

      expect(/templateId/.test(code), `${name} references templateId`).toBe(false);
      expect(/skeletonId/.test(code), `${name} references skeletonId`).toBe(false);
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Zero-behavior sentinel (pins D2 — nothing existing changed)
// ─────────────────────────────────────────────────────────────────────────────

describe('zero-behavior sentinel', () => {
  it('resolveEngineSectionSchema still returns null for a granth layout name', () => {
    expect(resolveEngineSectionSchema('GranthArchedHero')).toBeNull();
  });

  it('resolveEngineSectionSchema returns the unchanged schema for a thing layout', () => {
    expect(resolveEngineSectionSchema('TerminalHero')).toBe(thingElementContract.hero);
  });

  it("engineContracts.work.fields ids are unchanged (today's nine)", () => {
    expect(engineContracts.work.fields.map((f) => f.id)).toEqual([
      'name',
      'oneLiner',
      'whatYouTakeOn',
      'theWork',
      'genresStyle',
      'bioStory',
      'achievements',
      'praise',
      'goal',
    ]);
  });
});
