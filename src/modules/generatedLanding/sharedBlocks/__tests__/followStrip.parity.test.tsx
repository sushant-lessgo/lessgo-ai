// scale-05 phase 8 — shared FollowStrip block: dual-renderer parity +
// firewall-split registry resolution + hrefs + beacon (data-lessgo-cta) attrs +
// platform→icon mapping.
//
// The edit twin reads useEditStore → we mock it (tests aren't in the
// published path, so importing the edit twin here is fine).

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi } from 'vitest';

const SECTION_ID = 'followStrip-abcd1234';
const INSTAGRAM_URL = 'https://instagram.com/writerhandle';
const YOUTUBE_URL = 'https://youtube.com/@writerchannel';
const LINKS_JSON = JSON.stringify([
  { platform: 'instagram', url: INSTAGRAM_URL },
  { platform: 'youtube', url: YOUTUBE_URL },
]);

// Mock the store BEFORE importing the edit twin.
vi.mock('@/hooks/useEditStore', () => ({
  useEditStore: (selector?: (s: any) => any) => {
    const state = {
      content: {
        [SECTION_ID]: {
          id: SECTION_ID,
          layout: 'SharedFollowStrip',
          elements: {
            strip_heading: 'Follow along',
            links_json: LINKS_JSON,
          },
        },
      },
      updateElementContent: vi.fn(),
    };
    return selector ? selector(state) : state;
  },
}));

import FollowStrip from '../FollowStrip/FollowStrip';
import FollowStripPublished from '../FollowStrip/FollowStrip.published';
import { socialIcon } from '../FollowStrip/socialIcons';
import { resolveSharedBlock } from '../registry';
import { resolveSharedBlockPublished } from '../registry.published';
import { getComponent as getEditComponent } from '../../componentRegistry';
import { getComponent as getPublishedComponent } from '../../componentRegistry.published';

function publishedMarkup(props: Record<string, any> = {}) {
  return renderToStaticMarkup(
    <FollowStripPublished
      sectionId={SECTION_ID}
      strip_heading="Follow along"
      links_json={LINKS_JSON}
      {...props}
    />
  );
}

describe('shared FollowStrip — firewall-split registry resolution', () => {
  it('resolves the edit twin through the edit registry (lowercase key)', () => {
    expect(resolveSharedBlock('followstrip')).toBe(FollowStrip);
    // Casing tolerated by the resolver — real section type is `followStrip`.
    expect(resolveSharedBlock('followStrip')).toBe(FollowStrip);
  });

  it('resolves the published twin through the published registry', () => {
    expect(resolveSharedBlockPublished('followstrip')).toBe(FollowStripPublished);
  });

  it('componentRegistry (edit) dispatches a real followStrip-<uuid> id BEFORE template dispatch', () => {
    const C = getEditComponent(SECTION_ID, 'SharedFollowStrip', 'service', 'hearth');
    expect(C).toBe(FollowStrip);
  });

  it('componentRegistry.published dispatches followstrip to the published twin', () => {
    const C = getPublishedComponent('followstrip', 'SharedFollowStrip', 'service', 'hearth');
    expect(C).toBe(FollowStripPublished);
  });
});

describe('shared FollowStrip — hrefs + beacon attrs + goal-platform role', () => {
  it('published emits an anchor per profile with the exact hrefs', () => {
    const html = publishedMarkup();
    expect(html).toContain(`href="${INSTAGRAM_URL}"`);
    expect(html).toContain(`href="${YOUTUBE_URL}"`);
    expect(html.match(/class="lg-follow__link"/g)).toHaveLength(2);
  });

  it('the FIRST anchor (goal platform) is role="primary", the rest secondary', () => {
    const html = publishedMarkup();
    // Exactly one primary (the goal platform), one secondary.
    expect(html.match(/data-lessgo-cta-role="primary"/g)).toHaveLength(1);
    expect(html.match(/data-lessgo-cta-role="secondary"/g)).toHaveLength(1);
    // The primary is on the Instagram (first) anchor.
    const firstAnchor = html.slice(html.indexOf('<a'), html.indexOf('</a>') + 4);
    expect(firstAnchor).toContain(INSTAGRAM_URL);
    expect(firstAnchor).toContain('data-lessgo-cta-role="primary"');
  });

  it('every anchor carries data-lessgo-cta + external target', () => {
    const html = publishedMarkup();
    expect(html.match(/data-lessgo-cta=""/g)).toHaveLength(2);
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });
});

describe('shared FollowStrip — platform → icon mapping', () => {
  it('published markup renders the mapped icon SVG for each platform', () => {
    const html = publishedMarkup();
    const instaSvg = renderToStaticMarkup(socialIcon('instagram'));
    const ytSvg = renderToStaticMarkup(socialIcon('youtube'));
    expect(html).toContain(instaSvg);
    expect(html).toContain(ytSvg);
  });

  it('unknown platform falls back to the website/globe icon', () => {
    const html = renderToStaticMarkup(
      <FollowStripPublished
        sectionId={SECTION_ID}
        strip_heading="Follow along"
        links_json={JSON.stringify([{ platform: 'myspace', url: 'https://myspace.com/x' }])}
      />
    );
    expect(html).toContain(renderToStaticMarkup(socialIcon('website')));
  });
});

describe('shared FollowStrip — dual-renderer parity', () => {
  it('edit + published emit the same section/strip markup', () => {
    const pub = publishedMarkup();
    const edit = renderToStaticMarkup(<FollowStrip sectionId={SECTION_ID} />);

    for (const marker of [
      'class="lg-follow lg-follow-pad"',
      'data-surface="neutral"',
      'class="lg-follow__inner"',
      'class="lg-follow__row"',
      'class="lg-follow__h"',
      `href="${INSTAGRAM_URL}"`,
      `href="${YOUTUBE_URL}"`,
      'Follow along',
    ]) {
      expect(pub, `published missing ${marker}`).toContain(marker);
      expect(edit, `edit missing ${marker}`).toContain(marker);
    }

    // Both render exactly two profile anchors.
    expect(pub.match(/class="lg-follow__link"/g)).toHaveLength(2);
    expect(edit.match(/class="lg-follow__link"/g)).toHaveLength(2);

    // Published has the beacon attrs; edit is an inert preview (no beacon).
    expect(pub).toContain('data-lessgo-cta');
    expect(edit).not.toContain('data-lessgo-cta');
  });
});
