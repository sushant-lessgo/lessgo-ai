// src/modules/templates/granth/resolveGranthBlock.ts
// Granth block dispatch — keyed by SECTION TYPE (lowercase), not layout name.
// Covers the 6 Granth section types. Schema is keyed by the `Granth*` layout name
// (§3g two-identifier discipline); dispatch here is by type. No blog blocks in v1
// (writer profile sites have no blog).

import React from 'react';
import { GranthPlaceholderBlock } from './GranthPlaceholderBlock';

// Edit-mode blocks
import GranthHero from './blocks/Hero/GranthHero';
import GranthAbout from './blocks/About/GranthAbout';
import GranthBooks from './blocks/Books/GranthBooks';
import GranthWriting from './blocks/Writing/GranthWriting';
import GranthPraise from './blocks/Praise/GranthPraise';
import GranthFooter from './blocks/Footer/GranthFooter';

// Published-mode blocks
import GranthHeroPublished from './blocks/Hero/GranthHero.published';
import GranthAboutPublished from './blocks/About/GranthAbout.published';
import GranthBooksPublished from './blocks/Books/GranthBooks.published';
import GranthWritingPublished from './blocks/Writing/GranthWriting.published';
import GranthPraisePublished from './blocks/Praise/GranthPraise.published';
import GranthFooterPublished from './blocks/Footer/GranthFooter.published';

interface BlockEntry {
  edit: React.ComponentType<any>;
  published: React.ComponentType<any>;
}

// Keyed by section type (lowercase single tokens — §3g casing rule).
const GRANTH_BLOCK_REGISTRY: Record<string, BlockEntry> = {
  hero:    { edit: GranthHero,    published: GranthHeroPublished },
  about:   { edit: GranthAbout,   published: GranthAboutPublished },
  books:   { edit: GranthBooks,   published: GranthBooksPublished },
  writing: { edit: GranthWriting, published: GranthWritingPublished },
  praise:  { edit: GranthPraise,  published: GranthPraisePublished },
  footer:  { edit: GranthFooter,  published: GranthFooterPublished },
};

export type GranthBlockMode = 'edit' | 'published';

export function resolveGranthBlock(
  sectionType: string,
  mode: GranthBlockMode = 'edit',
  _layoutName?: string, // one block per section; accepted for TemplateModule contract parity
): React.ComponentType<any> | null {
  const key = (sectionType || '').toLowerCase();
  const entry = GRANTH_BLOCK_REGISTRY[key];
  if (!entry) {
    return GranthPlaceholderBlock;
  }
  return mode === 'published' ? entry.published : entry.edit;
}
