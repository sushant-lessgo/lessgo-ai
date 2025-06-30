// components/ui/SaveStatusIndicator.tsx - Visual Auto-Save Status Component
import React, { useState, useEffect } from 'react';
import { useSaveStatus, useVersionControl, useConflictResolution } from '@/hooks/useAutoSave';

/**
 * ===== COMPONENT TYPES =====
 */

export interface SaveStatusIndicatorProps {
  variant?: 'compact' | 'detailed' | 'floating' | 'header';
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showVersionControls?: boolean;
  showConflictWarnings?: boolean;
  showPerformanceStats?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
  onClick?: () => void;
  className?: string;
}

interface StatusIconProps {
  color: 'green' | 'yellow' | 'red' | 'gray';
  isAnimated?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

interface ConflictBadgeProps {
  conflictCount: number;
  onResolve: () => void;
}

/**
 * ===== UTILITY COMPONENTS =====
 */

const StatusIcon: React.FC<StatusIconProps> = ({ color, isAnimated = false, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4', 
    lg: 'w-5 h-5',
  };

  const colorClasses = {
    green: 'text-green-500',
    yellow: 'text-yellow-500',
    red: 'text-red-500',
    gray: 'text-gray-400',
  };

  const animationClass = isAnimated ? 'animate-pulse' : '';

  // Different icons based on status
  const getIcon = () => {
    switch (color) {
      case 'green':
        return (
          <svg className={`${sizeClasses[size]} ${colorClasses[color]}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'yellow':
        return (
          <svg className={`${sizeClasses[size]} ${colorClasses[color]} ${animationClass}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case 'red':
        return (
          <svg className={`${sizeClasses[size]} ${colorClasses[color]}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'gray':
        return (
          <svg className={`${sizeClasses[size]} ${colorClasses[color]}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return <div className="flex items-center justify-center">{getIcon()}</div>;
};

const ConflictBadge: React.FC<ConflictBadgeProps> = ({ conflictCount, onResolve }) => {
  if (conflictCount === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={onResolve}
        className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full hover:bg-red-200 transition-colors"
        title={`${conflictCount} conflict(s) need resolution`}
      >
        ⚠️ {conflictCount}
      </button>
    </div>
  );
};

const VersionControls: React.FC = () => {
  const { canUndo, canRedo, undo, redo, currentVersion, totalVersions } = useVersionControl();

  return (
    <div className="flex items-center space-x-1 text-xs text-gray-500">
      <button
        onClick={() => undo()}
        disabled={!canUndo}
        className={`p-1 rounded hover:bg-gray-100 transition-colors ${
          !canUndo ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
        title="Undo (Ctrl+Z)"
      >
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
      </button>
      
      <button
        onClick={() => redo()}
        disabled={!canRedo}
        className={`p-1 rounded hover:bg-gray-100 transition-colors ${
          !canRedo ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
        title="Redo (Ctrl+Y)"
      >
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {totalVersions > 0 && (
        <span className="text-xs text-gray-400 ml-1">
          {currentVersion}/{totalVersions}
        </span>
      )}
    </div>
  );
};

/**
 * ===== MAIN COMPONENT VARIANTS =====
 */

const CompactIndicator: React.FC<SaveStatusIndicatorProps> = ({ 
  showVersionControls = false,
  showConflictWarnings = true,
  onClick,
  className = '',
}) => {
  const saveStatus = useSaveStatus();
  const conflicts = useConflictResolution();

  return (
    <div 
      className={`flex items-center space-x-2 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <StatusIcon 
        color={saveStatus.color} 
        isAnimated={saveStatus.isSaving} 
        size="sm"
      />
      
      {showConflictWarnings && (
        <ConflictBadge 
          conflictCount={conflicts.conflictCount}
          onResolve={() => {/* Handle conflict resolution */}}
        />
      )}
      
      {showVersionControls && <VersionControls />}
    </div>
  );
};

const DetailedIndicator: React.FC<SaveStatusIndicatorProps> = ({
  showVersionControls = true,
  showConflictWarnings = true,
  showPerformanceStats = false,
  onClick,
  className = '',
}) => {
  const saveStatus = useSaveStatus();
  const conflicts = useConflictResolution();

  return (
    <div 
      className={`bg-white border border-gray-200 rounded-lg p-3 shadow-sm ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <StatusIcon 
            color={saveStatus.color} 
            isAnimated={saveStatus.isSaving} 
            size="md"
          />
          <span className="text-sm font-medium text-gray-700">
            {saveStatus.message}
          </span>
        </div>
        
        {showVersionControls && <VersionControls />}
      </div>

      {showConflictWarnings && conflicts.hasConflicts && (
        <div className="mb-2">
          <div className="flex items-center space-x-2">
            <ConflictBadge 
              conflictCount={conflicts.conflictCount}
              onResolve={() => {/* Handle conflict resolution */}}
            />
            <span className="text-xs text-red-600">
              {conflicts.conflictSummary}
            </span>
          </div>
        </div>
      )}

      {!saveStatus.isOnline && (
        <div className="flex items-center space-x-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span>Working offline</span>
        </div>
      )}

      {showPerformanceStats && saveStatus.lastSaved && (
        <div className="text-xs text-gray-400 mt-2">
          Last saved: {saveStatus.lastSaved.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

const FloatingIndicator: React.FC<SaveStatusIndicatorProps> = ({
  position = 'bottom-right',
  autoHide = true,
  autoHideDelay = 3000,
  showVersionControls = false,
  showConflictWarnings = true,
  className = '',
}) => {
  const saveStatus = useSaveStatus();
  const conflicts = useConflictResolution();
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Show indicator when there are changes or conflicts
   useEffect(() => {
    const shouldShow = Boolean(
      saveStatus.isDirty || 
      saveStatus.isSaving || 
      saveStatus.saveError || 
      conflicts.hasConflicts
    );
    setIsVisible(shouldShow);
  }, [saveStatus.isDirty, saveStatus.isSaving, saveStatus.saveError, conflicts.hasConflicts]);

  // Auto-hide logic
  useEffect(() => {
    if (autoHide && isVisible && !isHovered && !saveStatus.isDirty && !saveStatus.isSaving && !conflicts.hasConflicts) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, isVisible, isHovered, saveStatus.isDirty, saveStatus.isSaving, conflicts.hasConflicts, autoHideDelay]);

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed ${positionClasses[position]} z-50 transition-all duration-300 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="bg-white border border-gray-200 rounded-lg p-2 shadow-lg">
        <div className="flex items-center space-x-2">
          <StatusIcon 
            color={saveStatus.color} 
            isAnimated={saveStatus.isSaving} 
            size="sm"
          />
          
          <span className="text-sm text-gray-700 whitespace-nowrap">
            {saveStatus.message}
          </span>
          
          {showConflictWarnings && conflicts.hasConflicts && (
            <ConflictBadge 
              conflictCount={conflicts.conflictCount}
              onResolve={() => {/* Handle conflict resolution */}}
            />
          )}
          
          {showVersionControls && <VersionControls />}
        </div>
        
        {saveStatus.saveError && (
          <div className="text-xs text-red-600 mt-1 max-w-xs truncate">
            {saveStatus.saveError}
          </div>
        )}
      </div>
    </div>
  );
};

const HeaderIndicator: React.FC<SaveStatusIndicatorProps> = ({
  showVersionControls = true,
  showConflictWarnings = true,
  onClick,
  className = '',
}) => {
  const saveStatus = useSaveStatus();
  const conflicts = useConflictResolution();

  return (
    <div 
      className={`flex items-center justify-between py-2 px-4 bg-gray-50 border-b border-gray-200 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        <StatusIcon 
          color={saveStatus.color} 
          isAnimated={saveStatus.isSaving} 
          size="md"
        />
        
        <div>
          <div className="text-sm font-medium text-gray-700">
            {saveStatus.message}
          </div>
          
          {conflicts.hasConflicts && showConflictWarnings && (
            <div className="text-xs text-red-600">
              {conflicts.conflictSummary}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        {conflicts.hasConflicts && showConflictWarnings && (
          <ConflictBadge 
            conflictCount={conflicts.conflictCount}
            onResolve={() => {/* Handle conflict resolution */}}
          />
        )}
        
        {showVersionControls && <VersionControls />}
      </div>
    </div>
  );
};

/**
 * ===== MAIN EXPORT COMPONENT =====
 */

export const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = (props) => {
  const { variant = 'compact', ...restProps } = props;

  switch (variant) {
    case 'compact':
      return <CompactIndicator {...restProps} />;
    case 'detailed':
      return <DetailedIndicator {...restProps} />;
    case 'floating':
      return <FloatingIndicator {...restProps} />;
    case 'header':
      return <HeaderIndicator {...restProps} />;
    default:
      return <CompactIndicator {...restProps} />;
  }
};

/**
 * ===== CONVENIENCE EXPORTS =====
 */

// Pre-configured variants for common use cases
export const CompactSaveStatus: React.FC<Omit<SaveStatusIndicatorProps, 'variant'>> = (props) => (
  <SaveStatusIndicator variant="compact" {...props} />
);

export const DetailedSaveStatus: React.FC<Omit<SaveStatusIndicatorProps, 'variant'>> = (props) => (
  <SaveStatusIndicator variant="detailed" {...props} />
);

export const FloatingSaveStatus: React.FC<Omit<SaveStatusIndicatorProps, 'variant'>> = (props) => (
  <SaveStatusIndicator variant="floating" {...props} />
);

export const HeaderSaveStatus: React.FC<Omit<SaveStatusIndicatorProps, 'variant'>> = (props) => (
  <SaveStatusIndicator variant="header" {...props} />
);

/**
 * ===== USAGE EXAMPLES =====
 */

/*
// Compact indicator for toolbar
<CompactSaveStatus showVersionControls={true} />

// Detailed status panel
<DetailedSaveStatus 
  showPerformanceStats={true}
  onClick={() => openSavePanel()}
/>

// Floating indicator (auto-hide)
<FloatingSaveStatus 
  position="bottom-right"
  autoHide={true}
  autoHideDelay={5000}
/>

// Header bar integration
<HeaderSaveStatus 
  showConflictWarnings={true}
  onClick={() => openSaveHistory()}
/>

// Custom styling
<SaveStatusIndicator 
  variant="compact"
  className="border rounded-md p-2 bg-blue-50"
  showVersionControls={true}
/>
*/

export default SaveStatusIndicator;