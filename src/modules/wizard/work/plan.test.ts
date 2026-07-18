// src/modules/wizard/work/plan.test.ts
// ============================================================================
// Unit suite for the STEP 04 plan-edit validator (work-onboarding-plan E4).
// applyPlanEdit is the invariant guard: a removed page ⇒ absent from `next` ⇒
// eventually not generated. Every edit kind (happy path) + every rejection rule
// is exercised here.
// ============================================================================

import { describe, it, expect } from 'vitest';
import { applyPlanEdit, buildPlanCommit } from './plan';
import type { WorkSitemapPage } from '@/modules/audience/work/strategy/parseStrategyWork';
import { workPageTypes } from '@/modules/engines/workPages';

/** A standard 5-page work sitemap, built from the frozen page contract. */
function standardSitemap(): WorkSitemapPage[] {
  const keys = ['home', 'work', 'prices', 'about', 'contact'] as const;
  return keys.map((k) => {
    const def = workPageTypes[k];
    return {
      archetypeKey: def.key,
      title: def.title,
      pathSlug: def.pathSlug,
      sections: [...def.defaultSections],
    };
  });
}

describe('applyPlanEdit — addPage', () => {
  it('adds a page from the designed set with default sections + default goal', () => {
    // Drop `about` so it becomes addable, then add it back.
    const sitemap = standardSitemap().filter((p) => p.archetypeKey !== 'about');
    const res = applyPlanEdit({ type: 'addPage', pageKey: 'about' }, sitemap);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const added = res.next[res.next.length - 1];
    expect(added.archetypeKey).toBe('about');
    expect(added.pathSlug).toBe(workPageTypes.about.pathSlug);
    expect(added.title).toBe(workPageTypes.about.title);
    expect(added.sections).toEqual(workPageTypes.about.defaultSections);
    // No contactMethod passed ⇒ neutral default goal.
    expect(added.goal).toBe('form');
  });

  it('honours the seller contactMethod for the added page goal', () => {
    const sitemap = standardSitemap().filter((p) => p.archetypeKey !== 'about');
    const res = applyPlanEdit(
      { type: 'addPage', pageKey: 'about', contactMethod: 'whatsapp' },
      sitemap
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.next[res.next.length - 1].goal).toBe('whatsapp');
  });

  it('keeps home first after an add (appends last)', () => {
    const sitemap = standardSitemap().filter((p) => p.archetypeKey !== 'about');
    const res = applyPlanEdit({ type: 'addPage', pageKey: 'about' }, sitemap);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.next[0].archetypeKey).toBe('home');
  });

  it('rejects a duplicate page (already present)', () => {
    const res = applyPlanEdit({ type: 'addPage', pageKey: 'about' }, standardSitemap());
    expect(res.ok).toBe(false);
  });

  it('rejects a non-designed / parametric page (work-group)', () => {
    // work-group is excluded from the addable menu (parametric).
    const res = applyPlanEdit(
      { type: 'addPage', pageKey: 'work-group' },
      standardSitemap()
    );
    expect(res.ok).toBe(false);
  });

  it('rejects adding home', () => {
    const res = applyPlanEdit({ type: 'addPage', pageKey: 'home' }, standardSitemap());
    expect(res.ok).toBe(false);
  });
});

describe('applyPlanEdit — removePage', () => {
  it('removes a non-home page and leaves it absent from next', () => {
    const sitemap = standardSitemap();
    const pricesIdx = sitemap.findIndex((p) => p.archetypeKey === 'prices');
    const res = applyPlanEdit({ type: 'removePage', index: pricesIdx }, sitemap);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.next.some((p) => p.archetypeKey === 'prices')).toBe(false);
    expect(res.next).toHaveLength(sitemap.length - 1);
  });

  it('rejects removing home (non-removable)', () => {
    const res = applyPlanEdit({ type: 'removePage', index: 0 }, standardSitemap());
    expect(res.ok).toBe(false);
  });

  it('rejects an out-of-range index', () => {
    const res = applyPlanEdit({ type: 'removePage', index: 99 }, standardSitemap());
    expect(res.ok).toBe(false);
  });
});

describe('applyPlanEdit — renamePage', () => {
  it('renames the title and leaves the slug unchanged', () => {
    const sitemap = standardSitemap();
    const idx = sitemap.findIndex((p) => p.archetypeKey === 'about');
    const prevSlug = sitemap[idx].pathSlug;
    const res = applyPlanEdit({ type: 'renamePage', index: idx, title: '  Studio  ' }, sitemap);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.next[idx].title).toBe('Studio'); // trimmed
    expect(res.next[idx].pathSlug).toBe(prevSlug); // slug code-fixed
  });

  it('rejects an empty / whitespace title', () => {
    const res = applyPlanEdit({ type: 'renamePage', index: 1, title: '   ' }, standardSitemap());
    expect(res.ok).toBe(false);
  });

  it('rejects an out-of-range index', () => {
    const res = applyPlanEdit(
      { type: 'renamePage', index: 99, title: 'X' },
      standardSitemap()
    );
    expect(res.ok).toBe(false);
  });
});

describe('applyPlanEdit — movePage', () => {
  it('reorders two non-home pages', () => {
    const sitemap = standardSitemap(); // home, work, prices, about, contact
    // Move `prices` (idx 2) up to idx 1.
    const res = applyPlanEdit({ type: 'movePage', index: 2, dir: -1 }, sitemap);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.next.map((p) => p.archetypeKey)).toEqual([
      'home',
      'prices',
      'work',
      'about',
      'contact',
    ]);
  });

  it('rejects moving home', () => {
    const res = applyPlanEdit({ type: 'movePage', index: 0, dir: 1 }, standardSitemap());
    expect(res.ok).toBe(false);
  });

  it('rejects moving a page into first (would displace home)', () => {
    const res = applyPlanEdit({ type: 'movePage', index: 1, dir: -1 }, standardSitemap());
    expect(res.ok).toBe(false);
  });

  it('rejects a move past the end', () => {
    const sitemap = standardSitemap();
    const res = applyPlanEdit(
      { type: 'movePage', index: sitemap.length - 1, dir: 1 },
      sitemap
    );
    expect(res.ok).toBe(false);
  });
});

describe('applyPlanEdit — setGoal', () => {
  it('sets a known goal key', () => {
    const res = applyPlanEdit({ type: 'setGoal', index: 1, goal: 'booking' }, standardSitemap());
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.next[1].goal).toBe('booking');
  });

  it('rejects an unknown goal key', () => {
    const res = applyPlanEdit(
      // @ts-expect-error — deliberately passing an off-enum key.
      { type: 'setGoal', index: 1, goal: 'call-me' },
      standardSitemap()
    );
    expect(res.ok).toBe(false);
  });

  it('rejects an out-of-range index', () => {
    const res = applyPlanEdit({ type: 'setGoal', index: 99, goal: 'form' }, standardSitemap());
    expect(res.ok).toBe(false);
  });
});

describe('applyPlanEdit — purity', () => {
  it('does not mutate the input sitemap', () => {
    const sitemap = standardSitemap();
    const snapshot = JSON.stringify(sitemap);
    applyPlanEdit({ type: 'removePage', index: 2 }, sitemap);
    applyPlanEdit({ type: 'renamePage', index: 1, title: 'X' }, sitemap);
    expect(JSON.stringify(sitemap)).toBe(snapshot);
  });
});

describe('buildPlanCommit', () => {
  it('mirrors the sitemap → structure shape and carries facts + sitemap', () => {
    const sitemap = standardSitemap();
    sitemap[4].goal = 'form'; // contact page goal
    const facts = { entry: { businessName: 'X' }, work: { groups: [] } };
    const commit = buildPlanCommit(sitemap, facts);

    // Facts re-emitted verbatim (no fact edit here).
    expect(commit.facts).toEqual(facts);
    expect(commit.facts).not.toBe(facts); // fresh object (spread)
    // Sitemap carried for the store's optimistic set/revert.
    expect(commit.sitemap).toBe(sitemap);

    const structure = commit.patch.structure!;
    expect(structure.mode).toBe('multi');
    expect(structure.pages).toEqual(sitemap.map((p) => p.archetypeKey));
    expect(structure.pageDetails).toHaveLength(sitemap.length);
    // pageDetails shape matches buildStructurePatch: archetypeKey/slug/sections/title.
    const contact = structure.pageDetails!.find((d) => d.archetypeKey === 'contact')!;
    expect(contact.slug).toBe(workPageTypes.contact.pathSlug);
    expect(contact.title).toBe(workPageTypes.contact.title);
    expect(contact.goal).toBe('form');
    // A page without a goal omits the key (matches buildStructurePatch).
    const home = structure.pageDetails!.find((d) => d.archetypeKey === 'home')!;
    expect('goal' in home).toBe(false);
  });

  it('tolerates null facts (empty bag)', () => {
    const commit = buildPlanCommit(standardSitemap(), null);
    expect(commit.facts).toEqual({});
  });
});
