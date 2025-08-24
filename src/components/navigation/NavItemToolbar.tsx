/**
 * NavItemToolbar Component
 * Provides inline editing controls for navigation items in edit mode
 */

import React, { useState, useRef, useEffect } from 'react';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import NavigationEditor from './NavigationEditor';
import type { NavigationItem } from '@/types/store/state';

interface NavItemToolbarProps {
  isVisible: boolean;
  position: { x: number; y: number };
  navItem?: NavigationItem;
  onClose: () => void;
}

const NavItemToolbar: React.FC<NavItemToolbarProps> = ({
  isVisible,
  position,
  navItem,
  onClose,
}) => {
  const store = useEditStore();
  const [showEditor, setShowEditor] = useState(false);
  const [showLinkMenu, setShowLinkMenu] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const linkMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible) {
      setShowLinkMenu(false);
    }
  }, [isVisible]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        toolbarRef.current && 
        !toolbarRef.current.contains(event.target as Node) &&
        linkMenuRef.current &&
        !linkMenuRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onClose]);

  if (!isVisible || !navItem) return null;

  const availableSections = store.sections
    .filter(id => !id.includes('header') && !id.includes('footer'))
    .map(id => ({
      id,
      layout: store.sectionLayouts[id] || '',
      label: getSectionDisplayName(id, store.sectionLayouts[id] || ''),
    }));

  const handleUpdateLink = (newLink: string, sectionId?: string) => {
    store.updateNavItem(navItem.id, {
      link: newLink,
      sectionId: sectionId,
    });
    setShowLinkMenu(false);
    onClose();
  };

  const handleDeleteItem = () => {
    store.removeNavItem(navItem.id);
    onClose();
  };

  const handleMoveUp = () => {
    const navItems = store.navigationConfig?.items || [];
    const currentIndex = navItems.findIndex(item => item.id === navItem.id);
    if (currentIndex > 0) {
      const newOrder = [...navItems];
      [newOrder[currentIndex], newOrder[currentIndex - 1]] = [newOrder[currentIndex - 1], newOrder[currentIndex]];
      store.reorderNavItems(newOrder.map(item => item.id));
    }
    onClose();
  };

  const handleMoveDown = () => {
    const navItems = store.navigationConfig?.items || [];
    const currentIndex = navItems.findIndex(item => item.id === navItem.id);
    if (currentIndex < navItems.length - 1) {
      const newOrder = [...navItems];
      [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
      store.reorderNavItems(newOrder.map(item => item.id));
    }
    onClose();
  };

  return (
    <>
      <div
        ref={toolbarRef}
        className="fixed z-[55] bg-white rounded-lg shadow-lg border border-gray-200 p-2"
        style={{
          left: position.x,
          top: position.y,
          transform: 'translateX(-50%)',
        }}
      >
        <div className="flex items-center gap-1">
          {/* Edit Link Button */}
          <button
            onClick={() => setShowLinkMenu(!showLinkMenu)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Change link"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>

          {/* Move Up */}
          <button
            onClick={handleMoveUp}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Move up"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>

          {/* Move Down */}
          <button
            onClick={handleMoveDown}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Move down"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Open Full Editor */}
          <button
            onClick={() => setShowEditor(true)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Edit navigation"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* Delete */}
          <button
            onClick={handleDeleteItem}
            className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
            title="Delete item"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* Link Menu */}
        {showLinkMenu && (
          <div
            ref={linkMenuRef}
            className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[200px] z-10"
          >
            <div className="px-3 py-2 text-sm font-medium text-gray-700 border-b border-gray-100">
              Link to:
            </div>
            
            {/* Section Links */}
            {availableSections.length > 0 && (
              <div className="py-1">
                <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Page Sections
                </div>
                {availableSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => handleUpdateLink(`#${section.id}`, section.id)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                      navItem.sectionId === section.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    {section.label}
                  </button>
                ))}
              </div>
            )}

            {/* Common External Links */}
            <div className="border-t border-gray-100 py-1">
              <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Common Links
              </div>
              <button
                onClick={() => handleUpdateLink('/contact')}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
              >
                Contact Page
              </button>
              <button
                onClick={() => handleUpdateLink('/about')}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
              >
                About Page
              </button>
              <button
                onClick={() => handleUpdateLink('/blog')}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
              >
                Blog
              </button>
            </div>

            {/* Custom Link */}
            <div className="border-t border-gray-100 py-1">
              <button
                onClick={() => {
                  const customLink = prompt('Enter custom URL:', navItem.link);
                  if (customLink) {
                    handleUpdateLink(customLink);
                  }
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
              >
                Custom URL...
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Full Navigation Editor */}
      <NavigationEditor
        isVisible={showEditor}
        onClose={() => {
          setShowEditor(false);
          onClose();
        }}
      />
    </>
  );
};

/**
 * Generate a display name for a section based on its ID and layout
 */
function getSectionDisplayName(sectionId: string, layout: string): string {
  // Extract type from section ID
  const type = sectionId.split('-')[0] || '';
  
  // Map section types to display names
  const typeDisplayNames: Record<string, string> = {
    hero: 'Hero Section',
    features: 'Features',
    pricing: 'Pricing',
    testimonials: 'Testimonials',
    faq: 'FAQ',
    problem: 'Problem',
    results: 'Results',
    comparison: 'Comparison',
    howitworks: 'How It Works',
    usecase: 'Use Cases',
    integration: 'Integrations',
    security: 'Security',
    objection: 'Objections',
    socialproof: 'Social Proof',
    beforeafter: 'Before & After',
    uniquemechanism: 'Unique Mechanism',
    foundernote: 'Founder Note',
    close: 'Call to Action',
    primarycta: 'Get Started',
  };

  const baseName = typeDisplayNames[type] || type.charAt(0).toUpperCase() + type.slice(1);
  
  // If there are multiple sections of the same type, show layout info
  if (layout && layout !== 'default') {
    return `${baseName} (${layout})`;
  }
  
  return baseName;
}

export default NavItemToolbar;