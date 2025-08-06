// hooks/useInlineEditorAutoSave.ts - Specialized auto-save for inline text editor
import { useState, useCallback, useMemo, useEffect } from 'react';
import { debounce } from 'lodash';
import { useEditStoreLegacy as useEditStore } from './useEditStoreLegacy';

export interface ContentChange {
  id: string;
  sectionId: string;
  elementKey: string;
  oldContent: string;
  newContent: string;
  timestamp: number;
  formatChanges?: any;
  selectionRange?: { start: number; end: number };
}

export interface AutoSaveConfig {
  enabled: boolean;
  debounceMs: number;
  onSave: (content: string) => void;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export function useInlineEditorAutoSave(config: AutoSaveConfig) {
  const { updateElementContent, trackChange, announceLiveRegion } = useEditStore();

  // Track content changes and integrate with existing auto-save
  const trackContentChange = useCallback((change: ContentChange) => {
    // Update content in store immediately
    updateElementContent(
      change.sectionId,
      change.elementKey,
      change.newContent
    );
    
    // Track change for existing auto-save system
    trackChange({
      type: 'content',
      sectionId: change.sectionId,
      elementKey: change.elementKey,
      oldValue: change.oldContent,
      newValue: change.newContent,
      source: 'user',
    });
    
    // Call the provided onSave callback
    if (config.enabled) {
      config.onSave(change.newContent);
    }
  }, [updateElementContent, trackChange, config]);

  return {
    trackContentChange,
    status: {
      isActive: config.enabled,
      isSaving: false,
      lastSaved: null,
      pendingChanges: 0,
      errors: [],
    },
  };
}