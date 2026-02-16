// FontPreviewText.tsx
import React from 'react';
import { previewContent } from './typographyPreviews';
import type { FontTheme } from '@/types/core/index';

interface FontPreviewTextProps {
  theme: FontTheme;
  size?: 'small' | 'medium';
}

export function FontPreviewText({ theme, size = 'medium' }: FontPreviewTextProps) {
  const headlineClass = size === 'small'
    ? 'text-sm font-semibold'
    : 'text-base font-bold';

  const bodyClass = size === 'small'
    ? 'text-xs text-gray-600'
    : 'text-sm text-gray-600';

  return (
    <div className="space-y-1">
      <div
        className={`${headlineClass} text-gray-900`}
        style={{ fontFamily: theme.headingFont }}
      >
        {previewContent.headline}
      </div>
      <div
        className={bodyClass}
        style={{ fontFamily: theme.bodyFont }}
      >
        {previewContent.body}
      </div>
    </div>
  );
}
