'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { usePathname } from 'next/navigation';

export function InjectLandingTheme() {
  const pathname = usePathname();
  // Only inject theme on editor routes (/create)
  // Published pages (/p/) use embedded CSS from htmlContent
  const isLandingPage = pathname?.startsWith('/create/');

  const { getFullTheme } = useThemeStore();

  useEffect(() => {
    if (isLandingPage) {
      const fullTheme = getFullTheme();
      for (const [key, value] of Object.entries(fullTheme)) {
        document.documentElement.style.setProperty(key, value);
      }
    } else {
      const keys = [
        '--landing-primary',
        '--landing-primary-hover',
        '--landing-accent',
        '--landing-muted-bg',
        '--landing-border',
        '--landing-text-primary',
        '--landing-text-secondary',
        '--landing-text-muted',
      ];
      keys.forEach((key) =>
        document.documentElement.style.removeProperty(key)
      );
    }
  }, [isLandingPage, getFullTheme]);

  return null;
}
