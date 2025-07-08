// app/edit/[token]/components/ui/TaxonomyTile.tsx
"use client";

import { useState } from 'react';

interface TaxonomyTileProps {
  id: string;
  label: string;
  description?: string;
  isSelected?: boolean;
  onClick: () => void;
  onHover?: () => void;
  onHoverEnd?: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  layout?: 'vertical' | 'horizontal';
  showIcon?: boolean;
  icon?: React.ReactNode;
  badge?: string;
  className?: string;
}

export function TaxonomyTile({
  id,
  label,
  description,
  isSelected = false,
  onClick,
  onHover,
  onHoverEnd,
  disabled = false,
  size = 'medium',
  layout = 'vertical',
  showIcon = false,
  icon,
  badge,
  className = '',
}: TaxonomyTileProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    if (disabled) return;
    setIsHovered(true);
    onHover?.();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onHoverEnd?.();
  };

  const handleClick = () => {
    if (disabled) return;
    onClick();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  const sizeClasses = {
    small: 'p-3 text-sm',
    medium: 'p-4 text-base',
    large: 'p-6 text-lg',
  };

  const layoutClasses = {
    vertical: 'flex-col text-center',
    horizontal: 'flex-row text-left items-center space-x-3',
  };

  const baseClasses = `
    relative flex cursor-pointer border rounded-xl transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
    ${sizeClasses[size]} ${layoutClasses[layout]}
  `;

  const stateClasses = disabled
    ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
    : isSelected
    ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-md'
    : isHovered
    ? 'bg-gray-50 border-gray-300 text-gray-900 shadow-sm'
    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300';

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={isSelected}
      aria-disabled={disabled}
      className={`${baseClasses} ${stateClasses} ${className}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      data-testid={`taxonomy-tile-${id}`}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2">
          <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}

      {/* Badge */}
      {badge && (
        <div className="absolute top-2 left-2">
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
            {badge}
          </span>
        </div>
      )}

      {/* Icon */}
      {showIcon && icon && (
        <div className={`flex-shrink-0 ${layout === 'vertical' ? 'mb-2' : ''}`}>
          {icon}
        </div>
      )}

      {/* Content */}
      <div className={`flex-1 min-w-0 ${layout === 'vertical' ? 'text-center' : 'text-left'}`}>
        <div className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
          {label}
        </div>
        
        {description && (
          <div className={`mt-1 text-sm ${isSelected ? 'text-blue-700' : 'text-gray-500'}`}>
            {description}
          </div>
        )}
      </div>

      {/* Hover Effect Overlay */}
      {isHovered && !disabled && !isSelected && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent opacity-30 rounded-xl pointer-events-none" />
      )}
    </div>
  );
}

export default TaxonomyTile;