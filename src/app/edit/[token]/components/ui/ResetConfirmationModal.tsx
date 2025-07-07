// /app/edit/[token]/components/ui/ResetConfirmationModal.tsx
"use client";

import React from 'react';
import type { ResetScope } from '@/types/core';

interface ResetConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (scope: ResetScope) => void;
}

export function ResetConfirmationModal({ isOpen, onClose, onConfirm }: ResetConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Reset to LessGo Generated
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                This will restore your original AI-generated design. Your customizations will be lost.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => onConfirm('design')}
                  className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">Reset Design Only</div>
                  <div className="text-sm text-gray-600">Background, colors, and typography</div>
                </button>
                
                <button
                  onClick={() => onConfirm('all')}
                  className="w-full text-left px-4 py-3 border border-amber-200 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                >
                  <div className="font-medium text-amber-900">Reset Everything</div>
                  <div className="text-sm text-amber-700">Design + all content changes</div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}