// F25 regression: hearth + lex published nav headers must dual-read a link's
// href — a legacy raw string passes through verbatim; a new `Link` object
// (written by the edit-mode LinkTargetPopover) resolves to a plain href.
// Guards the dual-renderer law: re-pointing a nav link in the editor must
// survive publish.

import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import type { Link } from '@/types/destination';
import HearthNavPublished from './hearth/blocks/Header/WarmNavHeader.published';
import LexNavPublished from './lex/blocks/Header/LetterheadNav.published';

const sectionLink: Link = { dest: { kind: 'section', anchor: 'pricing' }, source: 'manual' };
const pageLink: Link = { dest: { kind: 'page', pathSlug: '/contact' }, source: 'derived' };

describe.each([
  ['hearth WarmNavHeaderPublished', HearthNavPublished],
  ['lex LetterheadNavPublished', LexNavPublished],
])('%s dual-reads nav link hrefs', (_name, Comp) => {
  const render = () =>
    ReactDOMServer.renderToStaticMarkup(
      <Comp
        sectionId="header-abc123"
        nav_items={[
          { id: 'n1', label: 'Legacy', href: '#legacy' },
          { id: 'n2', label: 'Section', href: sectionLink },
          { id: 'n3', label: 'Page', href: pageLink },
        ]}
      />,
    );

  it('passes a legacy raw string href through verbatim', () => {
    expect(render()).toContain('href="#legacy"');
  });

  it('resolves a section Link object to its anchor', () => {
    expect(render()).toContain('href="#pricing"');
  });

  it('resolves a page Link object to its pathSlug', () => {
    expect(render()).toContain('href="/contact"');
  });
});
