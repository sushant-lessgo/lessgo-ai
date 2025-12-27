/**
 * SimpleFooter - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { TextPublished } from '@/components/published/TextPublished';

export default function SimpleFooterPublished(props: LayoutComponentProps) {
  const { sectionBackgroundCSS } = props;
  const copyright = props.copyright || `© ${new Date().getFullYear()} Your Company. All rights reserved.`;

  return (
    <section style={{ background: sectionBackgroundCSS }} className="py-8 px-6 border-t">
      <div className="flex flex-col items-center gap-2">
        <TextPublished value={copyright} element="p" className="text-sm text-gray-600" />
        <div className="text-sm text-gray-600">
          Built with{' '}
          <a href="https://lessgo.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600">
            Lessgo.ai
          </a>
        </div>
      </div>
    </section>
  );
}
