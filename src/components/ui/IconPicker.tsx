import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import * as LucideIcons from 'lucide-react';
import { searchIcons, getIconsByCategory, IconSearchEntry } from '@/lib/iconSearchIndex';
import { ICON_CATEGORIES, getCategoryById } from '@/lib/lucideIconCategories';
import { trackUsage, getRecentIcons, getPopularIcons, IconUsage } from '@/lib/iconUsageTracker';
import { encodeIcon } from '@/lib/iconStorage';
import { lucideNameToPascalCase } from '@/lib/iconStorage';

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  onClose: () => void;
  triggerRect?: DOMRect;
  placeholder?: string;
}

const ICONS_PER_PAGE = 80;

export default function IconPicker({ value, onChange, onClose, triggerRect, placeholder }: IconPickerProps) {
  const [activeTab, setActiveTab] = useState<string>('popular');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(0); // Reset to first page on new search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Convert IconUsage[] to IconSearchEntry[] (define before use)
  const usageToIconEntries = (usage: IconUsage[]): IconSearchEntry[] => {
    return usage.map(u => ({
      name: u.iconName,
      displayName: u.iconName,
      keywords: [],
      category: [],
      type: u.type
    }));
  };

  // Get filtered icons based on search or active tab
  const filteredIcons = useMemo(() => {
    // If searching, return search results
    if (debouncedSearch.trim()) {
      const results = searchIcons(debouncedSearch, 200);
      return results.map(r => r.icon);
    }

    // Popular tab
    if (activeTab === 'popular') {
      const popular = getPopularIcons();
      return usageToIconEntries(popular);
    }

    // Recent tab
    if (activeTab === 'recent') {
      const recent = getRecentIcons();
      return usageToIconEntries(recent);
    }

    // Category tabs
    return getIconsByCategory(activeTab);
  }, [debouncedSearch, activeTab]);

  // Pagination
  const totalPages = Math.ceil(filteredIcons.length / ICONS_PER_PAGE);
  const paginatedIcons = useMemo(() => {
    const start = currentPage * ICONS_PER_PAGE;
    return filteredIcons.slice(start, start + ICONS_PER_PAGE);
  }, [filteredIcons, currentPage]);

  // Position the picker
  const getPickerStyle = (): React.CSSProperties => {
    if (!triggerRect) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9999
      };
    }

    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const pickerHeight = 600; // Increased for more content
    const pickerWidth = 480; // Increased for 8 columns

    let top = triggerRect.bottom + 8;
    let left = triggerRect.left;

    // Adjust if picker would go off screen
    if (top + pickerHeight > viewportHeight) {
      top = Math.max(16, triggerRect.top - pickerHeight - 8);
    }
    if (left + pickerWidth > viewportWidth) {
      left = viewportWidth - pickerWidth - 16;
    }

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      zIndex: 9999
    };
  };

  const handleIconSelect = (icon: IconSearchEntry) => {
    const iconValue = encodeIcon(icon.name, icon.type);

    // Track usage
    trackUsage(icon.name, icon.type);

    onChange(iconValue);
    onClose();
  };

  const renderIcon = (icon: IconSearchEntry) => {
    if (icon.type === 'emoji') {
      return <span className="text-2xl">{icon.name}</span>;
    } else if (icon.type === 'lucide') {
      const componentName = lucideNameToPascalCase(icon.name);
      const IconComponent = (LucideIcons as any)[componentName];

      if (IconComponent) {
        return <IconComponent size={24} strokeWidth={2} className="text-gray-700" />;
      } else {
        // Fallback for missing icon
        return <span className="text-xs text-gray-400">?</span>;
      }
    }

    return null;
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  const pickerContent = (
    <div
      ref={pickerRef}
      className="bg-white border border-gray-200 rounded-lg shadow-xl w-[480px] max-h-[600px] overflow-hidden flex flex-col"
      style={getPickerStyle()}
    >
      {/* Header */}
      <div className="p-3 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900">Choose Icon</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search icons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            autoFocus
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Category Tabs */}
      {!searchTerm && (
        <div className="px-3 py-2 border-b border-gray-200 flex-shrink-0 overflow-x-auto">
          <div className="flex space-x-1 min-w-max">
            {ICON_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setActiveTab(category.id);
                  setCurrentPage(0);
                }}
                className={`px-3 py-1.5 text-xs rounded-md whitespace-nowrap transition-colors flex items-center space-x-1 ${
                  activeTab === category.id
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title={category.name}
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Icons Grid */}
      <div className="p-3 flex-1 overflow-y-auto">
        {paginatedIcons.length > 0 ? (
          <div className="grid grid-cols-8 gap-1">
            {paginatedIcons.map((icon, index) => (
              <button
                key={`${icon.type}-${icon.name}-${index}`}
                onClick={() => handleIconSelect(icon)}
                className="w-12 h-12 flex items-center justify-center rounded-md hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                title={icon.displayName}
              >
                {renderIcon(icon)}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 text-sm">
            {searchTerm ? (
              <>
                <div className="text-4xl mb-2">🔍</div>
                <div>No icons found for "{searchTerm}"</div>
                <div className="text-xs mt-1">Try a different search term</div>
              </>
            ) : (
              <>
                <div className="text-4xl mb-2">😊</div>
                <div>No icons in this category yet</div>
                {activeTab === 'popular' && (
                  <div className="text-xs mt-1">Start using icons to see popular ones here</div>
                )}
                {activeTab === 'recent' && (
                  <div className="text-xs mt-1">Recently used icons will appear here</div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer with pagination */}
      <div className="px-3 py-2 border-t border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="flex items-center justify-between text-xs">
          <div className="text-gray-500">
            {filteredIcons.length > 0 ? (
              <>
                Showing {currentPage * ICONS_PER_PAGE + 1}-
                {Math.min((currentPage + 1) * ICONS_PER_PAGE, filteredIcons.length)} of{' '}
                {filteredIcons.length}
              </>
            ) : (
              'No icons'
            )}
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 0}
                className={`px-2 py-1 rounded ${
                  currentPage === 0
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                ← Prev
              </button>
              <span className="text-gray-600">
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage >= totalPages - 1}
                className={`px-2 py-1 rounded ${
                  currentPage >= totalPages - 1
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render in portal to ensure proper z-index
  return typeof window !== 'undefined' ? createPortal(pickerContent, document.body) : null;
}
