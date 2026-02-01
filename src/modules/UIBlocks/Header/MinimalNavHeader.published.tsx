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

// V2 NavItem interface
interface NavItem {
  id: string;
  label: string;
  link: string;
}

// Default nav items when none provided
const DEFAULT_NAV_ITEMS: NavItem[] = [
  { id: 'nav-1', label: 'Home', link: '#' },
  { id: 'nav-2', label: 'Features', link: '#features' },
  { id: 'nav-3', label: 'Pricing', link: '#pricing' },
  { id: 'nav-4', label: 'Contact', link: '#contact' },
];

export default function MinimalNavHeaderPublished(props: LayoutComponentProps) {
  // V2 format: nav_items array
  const rawNavItems = (props.nav_items as NavItem[]) || [];

  // Use provided nav_items or defaults, max 4 items
  const navItems = (rawNavItems.length > 0 ? rawNavItems : DEFAULT_NAV_ITEMS)
    .slice(0, 4)
    .filter(item => item.label && item.label.trim() !== '');

  // Logo from props (passed from parent via globalSettings)
  const logo = props.logo as string || '';

  // ColorTokens for theme-aware styling
  const colorTokens = props.colorTokens as { text?: string } | undefined;

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
        <nav className="relative flex items-center justify-center py-2 md:py-3">
          {/* Logo - absolute left */}
          <div className="absolute left-0 flex items-center">
            {logo ? (
              <img
                src={logo}
                alt="Logo"
                className="h-8 md:h-10 w-auto object-contain"
              />
            ) : (
              <PlaceholderLogo />
            )}
          </div>

          {/* Navigation - centered */}
          <div className="flex items-center gap-4">
            <ul className="flex items-center gap-4 md:gap-5">
              {navItems.map((navItem) => (
                <li key={navItem.id}>
                  <a
                    href={navItem.link}
                    className="text-sm font-medium transition-colors cursor-pointer hover:opacity-80"
                    style={{ color: colorTokens?.text || '#374151' }}
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
