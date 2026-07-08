// scale-05 phase 7 — injectGoalSections: deterministic M3 store-badges injection.
// Acceptance: a Phase-1-shaped download-app `param.links` with BOTH stores →
// TWO badge hrefs (Kathaworld). One link → one badge. Non-download-app → no-op.

import { describe, it, expect } from 'vitest';
import { injectGoalSections } from './injectGoalSections';
import type { Brief } from '@/types/brief';

type BriefGoal = NonNullable<Brief['goal']>;

const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.kathaworld.app';
const APPSTORE_URL = 'https://apps.apple.com/us/app/kathaworld/id1234567890';

function baseLayout() {
  const sections = ['header-1', 'hero-abc', 'features-xyz', 'footer-1'];
  const sectionLayouts: Record<string, string> = {
    'header-1': 'WarmNavHeader',
    'hero-abc': 'PetalFramedHero',
    'features-xyz': 'IconServiceCards',
    'footer-1': 'ContactFooterRich',
  };
  const content: Record<string, any> = {
    'header-1': { id: 'header-1', elements: {} },
    'hero-abc': { id: 'hero-abc', elements: {} },
    'features-xyz': { id: 'features-xyz', elements: {} },
    'footer-1': { id: 'footer-1', elements: {} },
  };
  return { sections, sectionLayouts, content };
}

function downloadGoal(links: string[]): BriefGoal {
  return {
    intent: 'download-app',
    mechanism: 'M3',
    param: { links },
  } as BriefGoal;
}

function storeBadgesId(sections: string[]): string | undefined {
  return sections.find((id) => id.startsWith('storeBadges-'));
}

describe('injectGoalSections — download-app store badges (M3)', () => {
  it('BOTH stores → TWO badge hrefs (Kathaworld acceptance)', () => {
    const { sections, sectionLayouts, content } = baseLayout();
    injectGoalSections(sections, sectionLayouts, content, downloadGoal([PLAY_URL, APPSTORE_URL]));

    const id = storeBadgesId(sections);
    expect(id).toBeDefined();
    // Inserted directly after the hero.
    expect(sections.indexOf(id!)).toBe(sections.indexOf('hero-abc') + 1);
    expect(sectionLayouts[id!]).toBe('SharedStoreBadges');

    const el = content[id!].elements;
    expect(el.appstore_url).toBe(APPSTORE_URL);
    expect(el.playstore_url).toBe(PLAY_URL);
    // Two distinct, non-empty badge hrefs.
    expect(el.appstore_url).toBeTruthy();
    expect(el.playstore_url).toBeTruthy();
    expect(el.appstore_url).not.toBe(el.playstore_url);
    expect(content[id!].layout).toBe('SharedStoreBadges');
  });

  it('host-sniff is order-independent (App Store link first)', () => {
    const { sections, sectionLayouts, content } = baseLayout();
    injectGoalSections(sections, sectionLayouts, content, downloadGoal([APPSTORE_URL, PLAY_URL]));
    const el = content[storeBadgesId(sections)!].elements;
    expect(el.appstore_url).toBe(APPSTORE_URL);
    expect(el.playstore_url).toBe(PLAY_URL);
  });

  it('ONE link → ONE badge (the other slot stays empty)', () => {
    const { sections, sectionLayouts, content } = baseLayout();
    injectGoalSections(sections, sectionLayouts, content, downloadGoal([PLAY_URL]));
    const el = content[storeBadgesId(sections)!].elements;
    expect(el.playstore_url).toBe(PLAY_URL);
    expect(el.appstore_url).toBe('');
  });

  it('unknown-host links → no injection', () => {
    const { sections, sectionLayouts, content } = baseLayout();
    injectGoalSections(sections, sectionLayouts, content, downloadGoal(['https://example.com/app']));
    expect(storeBadgesId(sections)).toBeUndefined();
    expect(sections).toHaveLength(4);
  });

  it('idempotent: a second call does not inject a duplicate', () => {
    const { sections, sectionLayouts, content } = baseLayout();
    const goal = downloadGoal([PLAY_URL, APPSTORE_URL]);
    injectGoalSections(sections, sectionLayouts, content, goal);
    injectGoalSections(sections, sectionLayouts, content, goal);
    const injected = sections.filter((id) => id.startsWith('storeBadges-'));
    expect(injected).toHaveLength(1);
  });
});

describe('injectGoalSections — no-op cases', () => {
  it('non-download-app intent → no injection', () => {
    const { sections, sectionLayouts, content } = baseLayout();
    const goal = {
      intent: 'book-call',
      mechanism: 'M1',
      param: { links: [PLAY_URL, APPSTORE_URL] },
    } as BriefGoal;
    injectGoalSections(sections, sectionLayouts, content, goal);
    expect(storeBadgesId(sections)).toBeUndefined();
    expect(sections).toHaveLength(4);
  });

  it('download-app with no links → no injection', () => {
    const { sections, sectionLayouts, content } = baseLayout();
    injectGoalSections(sections, sectionLayouts, content, downloadGoal([]));
    expect(storeBadgesId(sections)).toBeUndefined();
  });

  it('null goal → no-op', () => {
    const { sections, sectionLayouts, content } = baseLayout();
    injectGoalSections(sections, sectionLayouts, content, null);
    expect(sections).toHaveLength(4);
  });
});
