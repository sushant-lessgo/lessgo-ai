// components/ui/PersistenceStatusIndicator.tsx - User Feedback Component for Save/Load Status
import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Cloud, 
  CloudOff, 
  History,
  AlertTriangle,
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react';

/**
 * ===== COMPONENT TYPES =====
 */

export interface PersistenceStatusIndicatorProps {
  // State props
  isDirty: boolean;
  isSaving: boolean;
  isLoading: boolean;
  lastSaved?: number;
  lastLoaded?: number;
  saveError?: string;
  loadError?: string;
  hasActiveConflicts: boolean;
  
  // Metrics
  metrics?: {
    totalSaves: number;
    successfulSaves: number;
    failedSaves: number;
    averageSaveTime: number;
  };
  
  // Actions
  onManualSave?: () => void;
  onForceSave?: () => void;
  onRetry?: () => void;
  onResolveConflicts?: () => void;
  onShowHistory?: () => void;
  
  // Display options
  variant?: 'compact' | 'full' | 'minimal';
  showMetrics?: boolean;
  showActions?: boolean;
  position?: 'fixed' | 'relative';
  className?: string;
}

interface StatusState {
  type: 'idle' | 'saving' | 'loading' | 'success' | 'error' | 'conflict' | 'dirty';
  message: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}

/**
 * ===== MAIN COMPONENT =====
 */

export function PersistenceStatusIndicator({
  isDirty,
  isSaving,
  isLoading,
  lastSaved,
  lastLoaded,
  saveError,
  loadError,
  hasActiveConflicts,
  metrics,
  onManualSave,
  onForceSave,
  onRetry,
  onResolveConflicts,
  onShowHistory,
  variant = 'compact',
  showMetrics = false,
  showActions = true,
  position = 'fixed',
  className = '',
}: PersistenceStatusIndicatorProps) {
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showTooltip, setShowTooltip] = useState(false);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Determine current status
  const getStatusState = (): StatusState => {
    // Priority order: loading > saving > conflicts > errors > dirty > success
    
    if (isLoading) {
      return {
        type: 'loading',
        message: 'Loading...',
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
      };
    }

    if (isSaving) {
      return {
        type: 'saving',
        message: 'Saving...',
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
      };
    }

    if (hasActiveConflicts) {
      return {
        type: 'conflict',
        message: 'Conflicts detected',
        icon: <AlertTriangle className="w-4 h-4" />,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
      };
    }

    if (saveError || loadError) {
      const error = saveError || loadError;
      return {
        type: 'error',
        message: isOnline ? (error || 'Save failed') : 'Offline - changes saved locally',
        icon: isOnline ? <AlertCircle className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />,
        color: isOnline ? 'text-red-600' : 'text-yellow-600',
        bgColor: isOnline ? 'bg-red-50' : 'bg-yellow-50',
        borderColor: isOnline ? 'border-red-200' : 'border-yellow-200',
      };
    }

    if (isDirty) {
      return {
        type: 'dirty',
        message: 'Unsaved changes',
        icon: <Clock className="w-4 h-4" />,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
      };
    }

    if (lastSaved) {
      const timeAgo = getTimeAgo(lastSaved);
      return {
        type: 'success',
        message: `Saved ${timeAgo}`,
        icon: <CheckCircle className="w-4 h-4" />,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
      };
    }

    return {
      type: 'idle',
      message: 'Ready',
      icon: <Cloud className="w-4 h-4" />,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
    };
  };

  const statusState = getStatusState();

  // Format time ago
  function getTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  }

  // Render based on variant
  if (variant === 'minimal') {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <div className={`${statusState.color}`}>
          {statusState.icon}
        </div>
        {!isOnline && (
          <WifiOff className="w-3 h-3 ml-1 text-gray-400" />
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div 
        className={`
          inline-flex items-center space-x-2 px-3 py-2 rounded-lg border
          ${statusState.bgColor} ${statusState.borderColor}
          ${position === 'fixed' ? 'fixed bottom-4 right-4 z-50 shadow-lg' : ''}
          ${className}
        `}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className={statusState.color}>
          {statusState.icon}
        </div>
        
        <span className={`text-sm font-medium ${statusState.color}`}>
          {statusState.message}
        </span>

        {!isOnline && (
          <WifiOff className="w-4 h-4 text-gray-400" />
        )}

        {showActions && (statusState.type === 'error' || statusState.type === 'conflict') && (
          <div className="flex space-x-1 ml-2">
            {statusState.type === 'error' && onRetry && (
              <button
                onClick={onRetry}
                className="text-xs px-2 py-1 bg-white border rounded hover:bg-gray-50"
              >
                Retry
              </button>
            )}
            
            {statusState.type === 'conflict' && onResolveConflicts && (
              <button
                onClick={onResolveConflicts}
                className="text-xs px-2 py-1 bg-white border rounded hover:bg-gray-50"
              >
                Resolve
              </button>
            )}
          </div>
        )}

        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute bottom-full right-0 mb-2 p-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap">
            {getTooltipContent()}
          </div>
        )}
      </div>
    );
  }

  // Full variant
  return (
    <div 
      className={`
        flex flex-col space-y-3 p-4 rounded-lg border
        ${statusState.bgColor} ${statusState.borderColor}
        ${position === 'fixed' ? 'fixed bottom-4 right-4 z-50 shadow-lg max-w-sm' : ''}
        ${className}
      `}
    >
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={statusState.color}>
            {statusState.icon}
          </div>
          <span className={`font-medium ${statusState.color}`}>
            {statusState.message}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          {!isOnline && (
            <WifiOff className="w-4 h-4 text-gray-400" />
          )}
          {onShowHistory && (
            <button
              onClick={onShowHistory}
              className="p-1 hover:bg-white rounded"
              title="View history"
            >
              <History className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Metrics */}
      {showMetrics && metrics && (
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div>
            <span className="font-medium">Saves:</span> {metrics.successfulSaves}/{metrics.totalSaves}
          </div>
          <div>
            <span className="font-medium">Avg time:</span> {metrics.averageSaveTime}ms
          </div>
        </div>
      )}

      {/* Last Save/Load Info */}
      <div className="text-xs text-gray-500 space-y-1">
        {lastSaved && (
          <div>Last saved: {new Date(lastSaved).toLocaleString()}</div>
        )}
        {lastLoaded && (
          <div>Last loaded: {new Date(lastLoaded).toLocaleString()}</div>
        )}
      </div>

      {/* Error Details */}
      {(saveError || loadError) && (
        <div className="text-xs text-red-600 bg-red-100 p-2 rounded">
          {saveError || loadError}
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex space-x-2">
          {statusState.type === 'dirty' && onManualSave && (
            <button
              onClick={onManualSave}
              className="flex-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Save Now
            </button>
          )}
          
          {statusState.type === 'error' && onRetry && (
            <button
              onClick={onRetry}
              className="flex-1 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Retry
            </button>
          )}
          
          {statusState.type === 'conflict' && onResolveConflicts && (
            <button
              onClick={onResolveConflicts}
              className="flex-1 px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
            >
              Resolve Conflicts
            </button>
          )}

          {onForceSave && (
            <button
              onClick={onForceSave}
              className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
              title="Force save (bypass conflicts)"
            >
              Force Save
            </button>
          )}
        </div>
      )}
    </div>
  );

  function getTooltipContent(): string {
    const parts: string[] = [];
    
    if (lastSaved) {
      parts.push(`Last saved: ${new Date(lastSaved).toLocaleString()}`);
    }
    
    if (metrics) {
      parts.push(`${metrics.successfulSaves}/${metrics.totalSaves} saves successful`);
    }
    
    if (!isOnline) {
      parts.push('Offline mode - changes saved locally');
    }
    
    return parts.join(' • ');
  }
}

/**
 * ===== PRESET COMPONENTS =====
 */

// Simple status dot for headers/toolbars
export function PersistenceStatusDot({
  isDirty,
  isSaving,
  saveError,
  className = '',
}: Pick<PersistenceStatusIndicatorProps, 'isDirty' | 'isSaving' | 'saveError' | 'className'>) {
  let dotColor = 'bg-gray-400'; // Default
  let title = 'Ready';

  if (isSaving) {
    dotColor = 'bg-blue-500';
    title = 'Saving...';
  } else if (saveError) {
    dotColor = 'bg-red-500';
    title = 'Save failed';
  } else if (isDirty) {
    dotColor = 'bg-yellow-500';
    title = 'Unsaved changes';
  } else {
    dotColor = 'bg-green-500';
    title = 'Saved';
  }

  return (
    <div
      className={`w-2 h-2 rounded-full ${dotColor} ${className}`}
      title={title}
    />
  );
}

// Status badge for navigation/headers
export function PersistenceStatusBadge({
  isDirty,
  isSaving,
  saveError,
  lastSaved,
  className = '',
}: Pick<PersistenceStatusIndicatorProps, 'isDirty' | 'isSaving' | 'saveError' | 'lastSaved' | 'className'>) {
  const statusState = React.useMemo(() => {
    if (isSaving) {
      return { text: 'Saving', color: 'text-blue-600 bg-blue-100' };
    } else if (saveError) {
      return { text: 'Error', color: 'text-red-600 bg-red-100' };
    } else if (isDirty) {
      return { text: 'Unsaved', color: 'text-yellow-600 bg-yellow-100' };
    } else if (lastSaved) {
      return { text: 'Saved', color: 'text-green-600 bg-green-100' };
    }
    return { text: 'Ready', color: 'text-gray-600 bg-gray-100' };
  }, [isDirty, isSaving, saveError, lastSaved]);

  return (
    <span
      className={`
        inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
        ${statusState.color} ${className}
      `}
    >
      {statusState.text}
    </span>
  );
}

/**
 * ===== USAGE EXAMPLES =====
 */

export function PersistenceStatusExamples() {
  // Example usage with the hook
  const mockProps = {
    isDirty: true,
    isSaving: false,
    isLoading: false,
    lastSaved: Date.now() - 60000,
    saveError: undefined,
    hasActiveConflicts: false,
    metrics: {
      totalSaves: 15,
      successfulSaves: 14,
      failedSaves: 1,
      averageSaveTime: 245,
    },
    onManualSave: () => console.log('Manual save'),
    onForceSave: () => console.log('Force save'),
    onRetry: () => console.log('Retry'),
    onResolveConflicts: () => console.log('Resolve conflicts'),
    onShowHistory: () => console.log('Show history'),
  };

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold">Persistence Status Indicator Examples</h3>
      
      {/* Minimal variant */}
      <div>
        <h4 className="text-sm font-medium mb-2">Minimal</h4>
        <PersistenceStatusIndicator {...mockProps} variant="minimal" />
      </div>
      
      {/* Compact variant */}
      <div>
        <h4 className="text-sm font-medium mb-2">Compact</h4>
        <PersistenceStatusIndicator {...mockProps} variant="compact" position="relative" />
      </div>
      
      {/* Full variant */}
      <div>
        <h4 className="text-sm font-medium mb-2">Full</h4>
        <PersistenceStatusIndicator 
          {...mockProps} 
          variant="full" 
          position="relative" 
          showMetrics={true}
        />
      </div>
      
      {/* Status dot */}
      <div>
        <h4 className="text-sm font-medium mb-2">Status Dot</h4>
        <PersistenceStatusDot {...mockProps} />
      </div>
      
      {/* Status badge */}
      <div>
        <h4 className="text-sm font-medium mb-2">Status Badge</h4>
        <PersistenceStatusBadge {...mockProps} />
      </div>
    </div>
  );
}

/**
 * ===== INTEGRATION WITH EDIT STORE =====
 */

// HOC for automatic integration with persistence hook
export function withPersistenceStatus<T extends object>(
  Component: React.ComponentType<T>,
  persistenceProps: Pick<PersistenceStatusIndicatorProps, 'variant' | 'position' | 'showMetrics' | 'showActions'>
) {
  return function PersistenceWrappedComponent(props: T & { tokenId: string }) {
    // This would integrate with the useStatePersistence hook
    // For now, showing the pattern
    
    return (
      <div className="relative">
        <Component {...props} />
        <PersistenceStatusIndicator
          {...persistenceProps}
          isDirty={false}
          isSaving={false}
          isLoading={false}
          hasActiveConflicts={false}
        />
      </div>
    );
  };
}

/**
 * ===== INTEGRATION EXAMPLE WITH PERSISTENCE HOOK =====
 */

// Example of how to use with the actual persistence hook
export function PersistenceStatusWithHook({ tokenId }: { tokenId: string }) {
  // This is how you would use it with the actual persistence hook
  // Commented out to avoid import errors during development
  
  /*
  const persistence = useStatePersistence({
    tokenId,
    autoSaveEnabled: true,
    backgroundSaveEnabled: true,
  });

  return (
    <PersistenceStatusIndicator
      isDirty={persistence.isDirty}
      isSaving={persistence.isSaving}
      isLoading={persistence.isLoading}
      lastSaved={persistence.lastSaved}
      lastLoaded={persistence.lastLoaded}
      saveError={persistence.saveError}
      loadError={persistence.loadError}
      hasActiveConflicts={persistence.hasActiveConflicts}
      metrics={persistence.metrics}
      onManualSave={() => persistence.saveManual('User-triggered save')}
      onForceSave={() => persistence.forceSave('Force save')}
      onRetry={() => persistence.saveManual('Retry save')}
      onResolveConflicts={() => {
        const conflicts = persistence.getActiveConflicts();
        if (conflicts.length > 0) {
          persistence.resolveConflict(conflicts[0].conflictId, 'manual');
        }
      }}
      onShowHistory={() => console.log('Show version history')}
      variant="compact"
      showMetrics={true}
      showActions={true}
    />
  );
  */
  
  // Placeholder for development
  return (
    <PersistenceStatusIndicator
      isDirty={false}
      isSaving={false}
      isLoading={false}
      hasActiveConflicts={false}
      variant="compact"
    />
  );
}

/**
 * ===== DEVELOPMENT UTILITIES =====
 */

if (process.env.NODE_ENV === 'development') {
  (window as any).__persistenceStatusDebug = {
    // Test different states
    testStates: {
      idle: {
        isDirty: false,
        isSaving: false,
        isLoading: false,
        hasActiveConflicts: false,
      },
      saving: {
        isDirty: true,
        isSaving: true,
        isLoading: false,
        hasActiveConflicts: false,
      },
      error: {
        isDirty: true,
        isSaving: false,
        isLoading: false,
        hasActiveConflicts: false,
        saveError: 'Network connection failed',
      },
      conflict: {
        isDirty: true,
        isSaving: false,
        isLoading: false,
        hasActiveConflicts: true,
      },
      success: {
        isDirty: false,
        isSaving: false,
        isLoading: false,
        hasActiveConflicts: false,
        lastSaved: Date.now() - 30000, // 30 seconds ago
      },
    },
    
    // Create test component
    createTestComponent: (state: string) => {
      const testState = (window as any).__persistenceStatusDebug.testStates[state];
      if (!testState) {
        console.error('Unknown test state:', state);
        return;
      }
      
      console.log('🧪 Test component created for state:', state, testState);
      return testState;
    },
    
    // Simulate state changes
    simulateStateChange: (fromState: string, toState: string) => {
      console.log(`🔄 Simulating state change: ${fromState} → ${toState}`);
      // This would trigger actual state updates in a real implementation
    },
  };
  
  console.log('🔧 Persistence Status Indicator debug utilities available at window.__persistenceStatusDebug');
}