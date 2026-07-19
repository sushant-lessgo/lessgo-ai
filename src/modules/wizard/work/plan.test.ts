// src/modules/wizard/work/plan.test.ts
// ============================================================================
// Unit suite for the STEP 04 plan-edit validator (work-onboarding-plan E4).
// applyPlanEdit is the invariant guard: a removed page ⇒ absent from `next` ⇒
// eventually not generated. Every edit kind (happy path) + every rejection rule
// is exercised here.
// ============================================================================

import { describe, it, expect } from 'vitest';
import {
  applyPlanEdit,
  buildPlanCommit,
  applyTileToggle,
  applyWorkGroupToggle,
} from './plan';
import type { WorkSitemapPage } from '@/modules/audience/work/strategy/parseStrategyWork';
import { workPageTypes, type WorkPageTypeKey } from '@/modules/engines/workPages';
import { getPageArchetypesForTemplate } from '@/modules/audience/product/pageArchetypes';
import { slugify } from '@/lib/normalize';

const ATELIER_MENU = getPageArchetypesForTemplate('atelier')!;

/** An atelier-shaped 5-page sitemap (menu-keyed archetypeKeys incl. `experiences`). */
function atelierSitemap(): WorkSitemapPage[] {
  return ATELIER_MENU.filter((a) => a.defaultIncluded).map((a) => ({
    archetypeKey: a.key,
    title: a.title,
    pathSlug: a.pathSlug,
    sections: [...a.defaultSections],
  }));
}

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

describe('applyTileToggle — off (remove via alias)', () => {
  it('toggling off prices removes the atelier /experiences page (reverse alias) and leaves it absent', () => {
    const sitemap = atelierSitemap();
    const res = applyTileToggle('prices', false, sitemap, { menu: ATELIER_MENU });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.next.some((p) => p.archetypeKey === 'experiences')).toBe(false);
    expect(res.next.some((p) => p.pathSlug === '/experiences')).toBe(false);
  });

  it('rejects toggling off home (non-removable, inherits the applyPlanEdit guard)', () => {
    const res = applyTileToggle('home', false, atelierSitemap(), { menu: ATELIER_MENU });
    expect(res.ok).toBe(false);
  });

  it('rejects toggling off a page that is not present', () => {
    const sitemap = atelierSitemap().filter((p) => p.archetypeKey !== 'about');
    const res = applyTileToggle('about', false, sitemap, { menu: ATELIER_MENU });
    expect(res.ok).toBe(false);
  });
});

describe('applyTileToggle — on (add)', () => {
  it('toggling on prices restores the atelier MENU def (slug /experiences) at its menu-order position', () => {
    const sitemap = atelierSitemap().filter((p) => p.archetypeKey !== 'experiences');
    // [home, work, about, contact]
    const res = applyTileToggle('prices', true, sitemap, { menu: ATELIER_MENU });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const added = res.next.find((p) => p.archetypeKey === 'experiences')!;
    expect(added.pathSlug).toBe('/experiences');
    // Inserted at menu order (after work, before about).
    expect(res.next.map((p) => p.archetypeKey)).toEqual([
      'home', 'work', 'experiences', 'about', 'contact',
    ]);
  });

  it('toggling on project-story builds from workPageTypes (no atelier menu def) and appends last', () => {
    const sitemap = atelierSitemap();
    const res = applyTileToggle('project-story', true, sitemap, {
      menu: ATELIER_MENU,
      contactMethod: 'whatsapp',
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const added = res.next[res.next.length - 1];
    expect(added.archetypeKey).toBe(workPageTypes['project-story'].key); // 'work-detail'
    expect(added.pathSlug).toBe(workPageTypes['project-story'].pathSlug);
    expect(added.goal).toBe('whatsapp');
    expect(res.next[0].archetypeKey).toBe('home'); // home stays first
  });

  it('toggling on blog builds from workPageTypes and appends', () => {
    const res = applyTileToggle('blog', true, atelierSitemap(), { menu: ATELIER_MENU });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.next[res.next.length - 1].archetypeKey).toBe('blog');
  });

  it('rejects an out-of-vocab key (closed vocabulary)', () => {
    const res = applyTileToggle(
      'not-a-page' as WorkPageTypeKey,
      true,
      atelierSitemap(),
      { menu: ATELIER_MENU }
    );
    expect(res.ok).toBe(false);
  });

  it('rejects a duplicate add (already present via alias)', () => {
    const res = applyTileToggle('prices', true, atelierSitemap(), { menu: ATELIER_MENU });
    expect(res.ok).toBe(false); // experiences already present
  });

  it('rejects adding home and work-group through the tile door', () => {
    expect(applyTileToggle('home', true, atelierSitemap(), { menu: ATELIER_MENU }).ok).toBe(false);
    expect(applyTileToggle('work-group', true, atelierSitemap(), { menu: ATELIER_MENU }).ok).toBe(false);
  });

  it('builds from the canonical contract when no menu is supplied', () => {
    const sitemap = atelierSitemap().filter((p) => p.archetypeKey !== 'experiences');
    const res = applyTileToggle('prices', true, sitemap, { menu: null });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const added = res.next[res.next.length - 1];
    expect(added.archetypeKey).toBe('prices');
    expect(added.pathSlug).toBe(workPageTypes.prices.pathSlug); // '/prices'
  });

  it('does not mutate the input sitemap', () => {
    const sitemap = atelierSitemap();
    const snapshot = JSON.stringify(sitemap);
    applyTileToggle('blog', true, sitemap, { menu: ATELIER_MENU });
    applyTileToggle('prices', false, sitemap, { menu: ATELIER_MENU });
    expect(JSON.stringify(sitemap)).toBe(snapshot);
  });
});

describe('applyWorkGroupToggle', () => {
  it('rejects promotion below PROMOTE_GROUP_MIN', () => {
    const res = applyWorkGroupToggle(true, 'Weddings', 1, atelierSitemap());
    expect(res.ok).toBe(false);
  });

  it('promotes a group: /work/<slug>, title = group name, inserted after work', () => {
    const sitemap = atelierSitemap();
    const res = applyWorkGroupToggle(true, 'Beach Weddings', 3, sitemap);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const added = res.next.find((p) => p.archetypeKey === 'work-group')!;
    expect(added.title).toBe('Beach Weddings');
    expect(added.pathSlug).toBe(`/work/${slugify('Beach Weddings')}`);
    expect(added.pathSlug).toBe('/work/beach-weddings');
    expect(added.sections).toEqual([...workPageTypes['work-group'].defaultSections]);
    // Positioned right after the work page.
    const workIdx = res.next.findIndex((p) => p.archetypeKey === 'work');
    expect(res.next[workIdx + 1].archetypeKey).toBe('work-group');
  });

  it('appends when there is no work page', () => {
    const sitemap = atelierSitemap().filter((p) => p.archetypeKey !== 'work');
    const res = applyWorkGroupToggle(true, 'Weddings', 3, sitemap);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.next[res.next.length - 1].archetypeKey).toBe('work-group');
  });

  it('rejects a duplicate work-group', () => {
    const first = applyWorkGroupToggle(true, 'Weddings', 3, atelierSitemap());
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const second = applyWorkGroupToggle(true, 'Portraits', 3, first.next);
    expect(second.ok).toBe(false);
  });

  it('toggles off by archetype key', () => {
    const on = applyWorkGroupToggle(true, 'Weddings', 3, atelierSitemap());
    expect(on.ok).toBe(true);
    if (!on.ok) return;
    const off = applyWorkGroupToggle(false, '', 3, on.next);
    expect(off.ok).toBe(true);
    if (!off.ok) return;
    expect(off.next.some((p) => p.archetypeKey === 'work-group')).toBe(false);
  });

  it('does not mutate the input sitemap', () => {
    const sitemap = atelierSitemap();
    const snapshot = JSON.stringify(sitemap);
    applyWorkGroupToggle(true, 'Weddings', 3, sitemap);
    expect(JSON.stringify(sitemap)).toBe(snapshot);
  });
});
