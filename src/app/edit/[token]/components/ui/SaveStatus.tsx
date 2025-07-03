// /app/edit/[token]/components/ui/SaveStatus.tsx
"use client";

import React from 'react';
import { useEditStore } from '@/hooks/useEditStore';

export function SaveStatus() {
  const { persistence, autoSave } = useEditStore();

  if (persistence.isSaving || autoSave.isSaving) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <div className="w-3 h-3 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        <span>Saving...</span>
      </div>
    );
  }

  if (persistence.isDirty || autoSave.isDirty) {
    return (
      <div className="flex items-center space-x-2 text-sm text-amber-600">
        <div className="w-2 h-2 bg-amber-500 rounded-full" />
        <span>Unsaved changes</span>
      </div>
    );
  }

  if (persistence.saveError) {
    return (
      <div className="flex items-center space-x-2 text-sm text-red-600">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <span>Save failed</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-sm text-green-600">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
      </svg>
      <span>All changes saved</span>
    </div>
  );
}