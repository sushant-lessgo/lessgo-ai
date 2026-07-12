// scale-05 phase 7 — shared StoreBadges block: dual-renderer parity +
// firewall-split registry resolution + href + beacon (data-lessgo-cta) attrs.
//
// The edit twin reads useEditStore → we mock it (tests aren't in the
// published path, so importing the edit twin here is fine).

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi } from 'vitest';

const SECTION_ID = 'storeBadges-abcd1234';
const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.kathaworld.app';
const APPSTORE_URL = 'https://apps.apple.com/us/app/kathaworld/id1234567890';

// Mock the store BEFORE importing the edit twin.
vi.mock('@/hooks/useEditStore', () => ({
  useEditStore: (selector?: (s: any) => any) => {
    const state = {
      content: {
        [SECTION_ID]: {
          id: SECTION_ID,
          layout: 'SharedStoreBadges',
          elements: {
            appstore_url: APPSTORE_URL,
            playstore_url: PLAY_URL,
            badge_label: 'Get the app',
          },
        },
      },
      updateElementContent: vi.fn(),
    };
    return selector ? selector(state) : state;
  },
}));

import StoreBadges from '../StoreBadges/StoreBadges';
import StoreBadgesPublished from '../StoreBadges/StoreBadges.published';
import { resolveSharedBlock } from '../registry';
import { resolveSharedBlockPublished } from '../registry.published';
import { getComponent as getEditComponent } from '../../componentRegistry';
import { getComponent as getPublishedComponent } from '../../componentRegistry.published';

function publishedMarkup(props: Record<string, any> = {}) {
  return renderToStaticMarkup(
    <StoreBadgesPublished
      sectionId={SECTION_ID}
      appstore_url={APPSTORE_URL}
      playstore_url={PLAY_URL}
      badge_label="Get the app"
      {...props}
    />
  );
}

describe('shared StoreBadges — firewall-split registry resolution', () => {
  it('resolves the edit twin through the edit registry (lowercase key)', () => {
    expect(resolveSharedBlock('storebadges')).toBe(StoreBadges);
    // Casing tolerated by the resolver (defensive) — real section type is `storeBadges`.
    expect(resolveSharedBlock('storeBadges')).toBe(StoreBadges);
  });

  it('resolves the published twin through the published registry', () => {
    expect(resolveSharedBlockPublished('storebadges')).toBe(StoreBadgesPublished);
  });

  it('componentRegistry (edit) dispatches a real storeBadges-<uuid> id BEFORE template dispatch', () => {
    const C = getEditComponent(SECTION_ID, 'SharedStoreBadges', 'service', 'hearth');
    expect(C).toBe(StoreBadges);
  });

  it('componentRegistry.published dispatches storebadges to the published twin', () => {
    // Published renderer extracts the type (lowercased) first, then getComponent.
    const C = getPublishedComponent('storebadges', 'SharedStoreBadges', 'service', 'hearth');
    expect(C).toBe(StoreBadgesPublished);
  });
});

describe('shared StoreBadges — TWO badges (Kathaworld) + beacon attrs', () => {
  it('published emits TWO badge anchors with the exact store hrefs', () => {
    const html = publishedMarkup();
    expect(html).toContain(`href="${PLAY_URL}"`);
    expect(html).toContain(`href="${APPSTORE_URL}"`);
    // Two anchors.
    expect(html.match(/class="lg-badge"/g)).toHaveLength(2);
  });

  it('each published anchor carries data-lessgo-cta + secondary role + external target', () => {
    const html = publishedMarkup();
    expect(html.match(/data-lessgo-cta=""/g)).toHaveLength(2);
    expect(html.match(/data-lessgo-cta-role="secondary"/g)).toHaveLength(2);
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('ONE store url → ONE badge', () => {
    const html = renderToStaticMarkup(
      <StoreBadgesPublished
        sectionId={SECTION_ID}
        playstore_url={PLAY_URL}
        badge_label="Get the app"
      />
    );
    expect(html.match(/class="lg-badge"/g)).toHaveLength(1);
    expect(html).toContain(`href="${PLAY_URL}"`);
    expect(html).not.toContain(APPSTORE_URL);
  });
});

describe('shared StoreBadges — dual-renderer parity', () => {
  it('edit + published emit the same section/badge markup', () => {
    const pub = publishedMarkup();
    const edit = renderToStaticMarkup(<StoreBadges sectionId={SECTION_ID} />);

    for (const marker of [
      'class="lg-badges lg-badges-pad"',
      'data-surface="neutral"',
      'class="lg-badges__inner"',
      'class="lg-badges__row"',
      'class="lg-badges__h"',
      `href="${PLAY_URL}"`,
      `href="${APPSTORE_URL}"`,
      'Google Play',
      'App Store',
    ]) {
      expect(pub, `published missing ${marker}`).toContain(marker);
      expect(edit, `edit missing ${marker}`).toContain(marker);
    }

    // Both render exactly two badge anchors.
    expect(pub.match(/class="lg-badge"/g)).toHaveLength(2);
    expect(edit.match(/class="lg-badge"/g)).toHaveLength(2);

    // Published has the beacon attrs; edit is an inert preview (no beacon).
    expect(pub).toContain('data-lessgo-cta');
    expect(edit).not.toContain('data-lessgo-cta');
  });
});
