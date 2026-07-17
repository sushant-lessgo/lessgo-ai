'use client';

// src/components/editor/SocialProfilesPanel.tsx
// scale-04 (phase 6, D13) — editor panel for the project's SITE-LEVEL social
// profiles. These are the single source for every footer/nav "social" link and
// the LinkPicker's derived Social options.
//
// Storage / bridge: the panel edits the editor's richer `SocialMediaConfig`
// store slice ({ items:{ id, platform, url, icon, order }[] }) via the
// SocialItemsEditor UI + store actions. The Brief↔config bridge lives in
// persistenceActions: on load, `Project.brief.socialProfiles` ({platform,url}[])
// seeds this config when the editor has none yet (so scrape-prefilled profiles
// flow in for free); on save, the config is written back to
// `Project.brief.socialProfiles`. This wrapper is the stable D13 entry point.
//
// toolbar-standard-beta phase 4: the UI it delegates to is now the t5
// `SocialItemsEditor` (`@/components/editor/SocialItemsEditor`); the previous
// `SocialMediaEditor` (`@/components/social/`) is DELETED. This wrapper is kept
// as-is rather than collapsed away because `GlobalModals.tsx:95` mounts it by
// name with the `isVisible`/`onClose` contract, and GlobalModals is outside
// phase 4's files-touched — so that prop surface is load-bearing and unchanged.

import React from 'react';
import SocialItemsEditor from '@/components/editor/SocialItemsEditor';

interface SocialProfilesPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export function SocialProfilesPanel({ isVisible, onClose }: SocialProfilesPanelProps) {
  return <SocialItemsEditor isVisible={isVisible} onClose={onClose} />;
}

export default SocialProfilesPanel;
