'use client';

// src/components/editor/SocialProfilesPanel.tsx
// scale-04 (phase 6, D13) — editor panel for the project's SITE-LEVEL social
// profiles. These are the single source for every footer/nav "social" link and
// the LinkTargetPopover's derived Social options.
//
// Storage / bridge: the panel edits the editor's richer `SocialMediaConfig`
// store slice ({ items:{ id, platform, url, icon, order }[] }) via the existing
// SocialMediaEditor UI + store actions. The Brief↔config bridge lives in
// persistenceActions: on load, `Project.brief.socialProfiles` ({platform,url}[])
// seeds this config when the editor has none yet (so scrape-prefilled profiles
// flow in for free); on save, the config is written back to
// `Project.brief.socialProfiles`. This wrapper is the stable D13 entry point;
// it reuses the proven SocialMediaEditor rather than duplicating its UI.

import React from 'react';
import SocialMediaEditor from '@/components/social/SocialMediaEditor';

interface SocialProfilesPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export function SocialProfilesPanel({ isVisible, onClose }: SocialProfilesPanelProps) {
  return <SocialMediaEditor isVisible={isVisible} onClose={onClose} />;
}

export default SocialProfilesPanel;
