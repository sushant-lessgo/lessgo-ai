/**
 * MultiColumnFooter - Published Version
 *
 * Server-safe footer with logo, description, copyright
 * Light theme, centered layout
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { LogoPublished } from '@/components/published/LogoPublished';

export default function MultiColumnFooterPublished(props: LayoutComponentProps) {
  // Extract content from props with defaults
  const copyright = props.copyright || `© ${new Date().getFullYear()} Your Company. All rights reserved.`;
  const company_description = props.company_description || 'We help businesses transform their digital presence.';
  const company_name = props.company_name || 'Your Company';

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Top Section: Logo + Description */}
        <div className="flex flex-col items-center text-center gap-6 mb-12">
          {/* Logo */}
          <LogoPublished
            logoUrl={props.logo}
            companyName={company_name}
            size="md"
            className="h-8"
          />

          {/* Company Description */}
          <p className="text-sm text-gray-600 max-w-md">
            {company_description}
          </p>
        </div>

        {/* Bottom Section: Copyright */}
        <div className="pt-8 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">{copyright}</p>
        </div>
      </div>
    </footer>
  );
}
