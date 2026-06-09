// src/modules/templates/meridian/resolveMeridianBlock.ts
// Meridian block dispatch — P0 STUB. Returns the placeholder for every
// (sectionType, layoutName, mode); the real 7-block registry lands in P2
// (mirrors Hearth's resolveServiceBlock map). Signature matches Hearth so the
// index.ts adapter + TemplateModule.resolveBlock contract work unchanged.

import React from 'react';
import { MeridianPlaceholderBlock } from './MeridianPlaceholderBlock';

export type MeridianBlockMode = 'edit' | 'published';

export function resolveMeridianBlock(
  _sectionType: string,
  _layoutName: string,
  _mode: MeridianBlockMode = 'edit',
): React.ComponentType<any> | null {
  // P2 will key a real edit/published registry by lowercased layoutName.
  return MeridianPlaceholderBlock;
}
