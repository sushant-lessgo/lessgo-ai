'use client';

import React, { ReactNode } from 'react';

interface SectionTrackerProps {
  sectionId: string;
  sectionType?: string;
  children: ReactNode;
  threshold?: number; // Percentage of section that must be visible (0-1) - legacy prop
}

/**
 * Section wrapper component for published pages.
 * Previously tracked section visibility via PostHog - now deprecated.
 * Kept for backward compatibility with component tree structure.
 */
export function SectionTracker({
  sectionId,
  sectionType,
  children,
}: SectionTrackerProps) {
  return (
    <div data-section-id={sectionId} data-section-type={sectionType}>
      {children}
    </div>
  );
}
