/**
 * NavWithCTAHeader - Published Version
 *
 * Server-safe header with logo + navigation (max 6 items)
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { LogoPublished } from '@/components/published/LogoPublished';
import { getPublishedTextColors } from '@/lib/publishedTextColors';

export default function NavWithCTAHeaderPublished(props: LayoutComponentProps) {
  const { sectionId, theme } = props;

  // Extract navigation items from props (max 6)
  const navItems = [
    { label: props.nav_item_1, link: props.nav_link_1 },
    { label: props.nav_item_2, link: props.nav_link_2 },
    { label: props.nav_item_3, link: props.nav_link_3 },
    { label: props.nav_item_4, link: props.nav_link_4 },
    { label: props.nav_item_5, link: props.nav_link_5 },
    { label: props.nav_item_6, link: props.nav_link_6 },
  ].filter(item =>
    item.label &&
    item.label !== '___REMOVED___' &&
    item.label.trim() !== '' &&
    item.link &&
    item.link !== '___REMOVED___'
  ).slice(0, 6);

  // Calculate text colors based on header background
  const textColors = getPublishedTextColors(
    'primary',
    theme,
    theme.colors.sectionBackgrounds?.primary || '#FFFFFF'
  );

  // Calculate background with 95% opacity
  const headerBg = theme.colors.sectionBackgrounds?.primary || '#FFFFFF';
  const headerBgWithOpacity = `${headerBg}F2`; // F2 = 95% opacity in hex

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-sm border-b"
      style={{
        backgroundColor: headerBgWithOpacity,
        borderColor: theme.colors.border || '#E5E7EB',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between py-2 md:py-3">
          {/* Logo */}
          <LogoPublished
            logoUrl={props.logo}
            companyName={props.company_name || 'Logo'}
            size="md"
            className="h-8 md:h-10"
          />

          {/* Navigation Items */}
          <div className="flex items-center justify-center flex-1">
            {navItems.length > 0 && (
              <ul className="flex items-center gap-4 md:gap-6">
                {navItems.map((navItem, index) => (
                  <li key={index}>
                    <a
                      href={navItem.link}
                      style={{ color: textColors.body }}
                      className="text-sm font-medium hover:opacity-80 transition-opacity"
                    >
                      {navItem.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Right spacer for visual balance */}
          <div className="h-8 md:h-10" style={{ width: '80px' }} />
        </nav>
      </div>
    </header>
  );
}
