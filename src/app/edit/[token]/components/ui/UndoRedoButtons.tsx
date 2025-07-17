// /app/edit/[token]/components/ui/UndoRedoButtons.tsx
"use client";

import React, { useEffect } from 'react';
import { useUndoRedo } from './useUndoRedo';

export function UndoRedoButtons() {
  // Temporary fix: Return placeholder until undo/redo is implemented
  return (
    <div className="flex items-center space-x-1">
      <button
        disabled
        className="w-8 h-8 rounded border border-gray-100 text-gray-300 cursor-not-allowed flex items-center justify-center"
        title="Undo (Not available)"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      </button>
      
      <button
        disabled
        className="w-8 h-8 rounded border border-gray-100 text-gray-300 cursor-not-allowed flex items-center justify-center"
        title="Redo (Not available)"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
        </svg>
      </button>
    </div>
  );
}