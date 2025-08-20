import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  onClose: () => void;
  triggerRect?: DOMRect;
  placeholder?: string;
}

// Icon categories with emojis and SVG alternatives
const ICON_CATEGORIES = {
  common: {
    name: 'Common',
    icons: [
      { emoji: '🎯', name: 'target', svg: 'target' },
      { emoji: '⚡', name: 'lightning', svg: 'bolt' },
      { emoji: '🔒', name: 'lock', svg: 'lock-closed' },
      { emoji: '🎨', name: 'palette', svg: 'color-swatch' },
      { emoji: '🔗', name: 'link', svg: 'link' },
      { emoji: '💡', name: 'lightbulb', svg: 'light-bulb' },
      { emoji: '⭐', name: 'star', svg: 'star' },
      { emoji: '✅', name: 'check', svg: 'check-circle' },
      { emoji: '🚀', name: 'rocket', svg: 'rocket' },
      { emoji: '💰', name: 'money', svg: 'currency-dollar' },
      { emoji: '📊', name: 'chart', svg: 'chart-bar' },
      { emoji: '🔧', name: 'wrench', svg: 'wrench' }
    ]
  },
  business: {
    name: 'Business',
    icons: [
      { emoji: '📈', name: 'trending-up', svg: 'trending-up' },
      { emoji: '📉', name: 'trending-down', svg: 'trending-down' },
      { emoji: '💼', name: 'briefcase', svg: 'briefcase' },
      { emoji: '🏢', name: 'building', svg: 'office-building' },
      { emoji: '👥', name: 'users', svg: 'users' },
      { emoji: '🎪', name: 'performance', svg: 'sparkles' },
      { emoji: '🛡️', name: 'shield', svg: 'shield-check' },
      { emoji: '⚙️', name: 'settings', svg: 'cog' },
      { emoji: '📋', name: 'clipboard', svg: 'clipboard-list' },
      { emoji: '📧', name: 'email', svg: 'mail' },
      { emoji: '🌐', name: 'globe', svg: 'globe' },
      { emoji: '🔄', name: 'refresh', svg: 'refresh' }
    ]
  },
  tech: {
    name: 'Technology',
    icons: [
      { emoji: '💻', name: 'computer', svg: 'desktop-computer' },
      { emoji: '📱', name: 'mobile', svg: 'device-mobile' },
      { emoji: '☁️', name: 'cloud', svg: 'cloud' },
      { emoji: '🔌', name: 'plug', svg: 'lightning-bolt' },
      { emoji: '📡', name: 'antenna', svg: 'wifi' },
      { emoji: '🖥️', name: 'monitor', svg: 'monitor' },
      { emoji: '⌨️', name: 'keyboard', svg: 'code' },
      { emoji: '🖱️', name: 'mouse', svg: 'cursor-click' },
      { emoji: '🗄️', name: 'database', svg: 'database' },
      { emoji: '🔐', name: 'secure', svg: 'shield-exclamation' },
      { emoji: '📊', name: 'analytics', svg: 'chart-square-bar' },
      { emoji: '🤖', name: 'robot', svg: 'cpu-chip' }
    ]
  },
  emotions: {
    name: 'Emotions',
    icons: [
      { emoji: '😊', name: 'happy', svg: 'emoji-happy' },
      { emoji: '🎉', name: 'celebration', svg: 'gift' },
      { emoji: '❤️', name: 'heart', svg: 'heart' },
      { emoji: '👍', name: 'thumbs-up', svg: 'thumb-up' },
      { emoji: '🌟', name: 'star-glow', svg: 'star' },
      { emoji: '🔥', name: 'fire', svg: 'fire' },
      { emoji: '✨', name: 'sparkles', svg: 'sparkles' },
      { emoji: '🎊', name: 'confetti', svg: 'gift' },
      { emoji: '💪', name: 'strength', svg: 'hand' },
      { emoji: '🏆', name: 'trophy', svg: 'trophy' },
      { emoji: '🎖️', name: 'medal', svg: 'badge-check' },
      { emoji: '🥇', name: 'first-place', svg: 'star' }
    ]
  }
};

// Heroicon SVG components (simplified versions)
const HEROICONS: Record<string, React.ReactNode> = {
  'target': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  'bolt': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  'lock-closed': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  'star': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  'check-circle': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  // Add more as needed...
};

export default function IconPicker({ value, onChange, onClose, triggerRect, placeholder }: IconPickerProps) {
  const [activeCategory, setActiveCategory] = useState('common');
  const [searchTerm, setSearchTerm] = useState('');
  const [displayMode, setDisplayMode] = useState<'emoji' | 'svg'>('emoji');
  const pickerRef = useRef<HTMLDivElement>(null);

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

  // Filter icons based on search
  const filteredIcons = React.useMemo(() => {
    if (!searchTerm) return ICON_CATEGORIES[activeCategory as keyof typeof ICON_CATEGORIES].icons;
    
    const allIcons = Object.values(ICON_CATEGORIES).flatMap(cat => cat.icons);
    return allIcons.filter(icon => 
      icon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      icon.emoji.includes(searchTerm)
    );
  }, [activeCategory, searchTerm]);

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
    const pickerHeight = 400;
    const pickerWidth = 320;

    let top = triggerRect.bottom + 8;
    let left = triggerRect.left;

    // Adjust if picker would go off screen
    if (top + pickerHeight > viewportHeight) {
      top = triggerRect.top - pickerHeight - 8;
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

  const handleIconSelect = (icon: typeof ICON_CATEGORIES.common.icons[0]) => {
    const selectedValue = displayMode === 'emoji' ? icon.emoji : `svg:${icon.svg}`;
    onChange(selectedValue);
    onClose();
  };

  const renderIcon = (icon: typeof ICON_CATEGORIES.common.icons[0]) => {
    if (displayMode === 'emoji') {
      return <span className="text-xl">{icon.emoji}</span>;
    } else {
      return (
        <div className="text-blue-600">
          {HEROICONS[icon.svg] || <span className="text-xs">{icon.name}</span>}
        </div>
      );
    }
  };

  const pickerContent = (
    <div
      ref={pickerRef}
      className="bg-white border border-gray-200 rounded-lg shadow-xl w-80 max-h-96 overflow-hidden"
      style={getPickerStyle()}
    >
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900">Choose Icon</h3>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setDisplayMode('emoji')}
              className={`px-2 py-1 text-xs rounded ${displayMode === 'emoji' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
            >
              😊 Emoji
            </button>
            <button
              onClick={() => setDisplayMode('svg')}
              className={`px-2 py-1 text-xs rounded ${displayMode === 'svg' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
            >
              ⚡ SVG
            </button>
          </div>
        </div>
        
        {/* Search */}
        <input
          type="text"
          placeholder="Search icons..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          autoFocus
        />
      </div>

      {/* Categories */}
      {!searchTerm && (
        <div className="px-3 py-2 border-b border-gray-200">
          <div className="flex space-x-1">
            {Object.entries(ICON_CATEGORIES).map(([key, category]) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  activeCategory === key 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Icons Grid */}
      <div className="p-3 max-h-64 overflow-y-auto">
        <div className="grid grid-cols-6 gap-2">
          {filteredIcons.map((icon, index) => (
            <button
              key={`${icon.name}-${index}`}
              onClick={() => handleIconSelect(icon)}
              className="w-10 h-10 flex items-center justify-center rounded hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
              title={icon.name}
            >
              {renderIcon(icon)}
            </button>
          ))}
        </div>
        
        {filteredIcons.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            No icons found for "{searchTerm}"
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Current: <span className="font-mono">{value || placeholder}</span>
          </span>
          <button
            onClick={onClose}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  // Render in portal to ensure proper z-index
  return typeof window !== 'undefined' 
    ? createPortal(pickerContent, document.body)
    : null;
}

// Export icon categories for other components to use
export { ICON_CATEGORIES, HEROICONS };