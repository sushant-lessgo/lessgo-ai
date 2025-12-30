/**
 * MinimalNavHeader - Published Version
 *
 * Server-safe component with ZERO hook imports
 * Used by componentRegistry.published.ts for SSR rendering
 *
 * Features:
 * - Logo on left with mr-8 spacing, navigation right (most compact)
 * - Up to 4 navigation items (smallest of all headers)
 * - Inline logo with placeholder fallback
 * - Sticky header with backdrop blur
 * - Smooth scroll using scrollIntoView (simpler than manual offset)
 * - External links open in new tab
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';

// ============================================================================
// Helper Components
// ============================================================================

/**
 * Placeholder Logo SVG - Server-safe static component
 */
const PlaceholderLogo = () => (
  <svg
    width="80"
    height="32"
    viewBox="0 0 80 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-full w-auto"
  >
    <rect x="0.5" y="0.5" width="79" height="31" rx="5.5" fill="#F3F4F6" stroke="#D1D5DB"/>
    <text
      x="50%"
      y="50%"
      dominantBaseline="middle"
      textAnchor="middle"
      fill="#6B7280"
      fontSize="12"
      fontFamily="system-ui, -apple-system, sans-serif"
      fontWeight="500"
    >
      LOGO
    </text>
  </svg>
);

// ============================================================================
// Main Component
// ============================================================================

export default function MinimalNavHeaderPublished(props: LayoutComponentProps) {
  // Extract navigation items (4 total - smallest of all headers)
  const nav_item_1 = props.nav_item_1 || 'Home';
  const nav_item_2 = props.nav_item_2 || 'Features';
  const nav_item_3 = props.nav_item_3 || 'Pricing';
  const nav_item_4 = props.nav_item_4 || 'Contact';

  // Extract navigation links (4 total)
  const nav_link_1 = props.nav_link_1 || '#';
  const nav_link_2 = props.nav_link_2 || '#features';
  const nav_link_3 = props.nav_link_3 || '#pricing';
  const nav_link_4 = props.nav_link_4 || '#contact';

  // Logo from props (passed from parent via globalSettings)
  const logo = props.logo || '';

  // Build nav items array
  const navItems = [
    { label: nav_item_1, link: nav_link_1 },
    { label: nav_item_2, link: nav_link_2 },
    { label: nav_item_3, link: nav_link_3 },
    { label: nav_item_4, link: nav_link_4 },
  ].filter(item => item.label && item.label !== '___REMOVED___' && item.label.trim() !== '');

  /**
   * Handle navigation click with smooth scroll for anchors
   * Uses native scrollIntoView (simpler than manual offset calculation)
   */
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, link: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (link.startsWith('#')) {
      const element = document.querySelector(link);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      window.open(link, '_blank');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between py-2 md:py-3">
          {/* Logo on left with mr-8 spacing */}
          <div className="flex items-center">
            {logo && logo !== '___REMOVED___' ? (
              <img
                src={logo}
                alt="Logo"
                className="h-8 md:h-10 w-auto object-contain mr-8"
              />
            ) : (
              <div className="mr-8">
                <PlaceholderLogo />
              </div>
            )}
          </div>

          {/* Navigation on right */}
          <div className="flex items-center gap-4">
            <ul className="flex items-center gap-4 md:gap-5">
              {navItems.map((navItem, index) => (
                <li key={index}>
                  <a
                    href={navItem.link}
                    className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors cursor-pointer"
                    onClick={(e) => handleNavClick(e, navItem.link)}
                  >
                    {navItem.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>
    </header>
  );
}
