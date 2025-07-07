// /app/edit/[token]/components/ui/typography/typographyApplication.ts
import type { FontTheme } from '@/types/core/index';

export function applyTypographyTheme(theme: FontTheme): void {
  const root = document.documentElement;
  root.style.setProperty('--font-heading', theme.headingFont);
  root.style.setProperty('--font-body', theme.bodyFont);
}

export function previewTypographyTheme(theme: FontTheme): void {
  applyTypographyTheme(theme);
}

export function restoreTypographyTheme(theme: FontTheme): void {
  applyTypographyTheme(theme);
}

export function getTypographyPreviewStyle(theme: FontTheme) {
  return {
    headingStyle: { fontFamily: theme.headingFont },
    bodyStyle: { fontFamily: theme.bodyFont }
  };
}